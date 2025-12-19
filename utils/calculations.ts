import { AUXILIARY_COST_MASTER, MACHINES, MATERIALS, RUNNER_RATIO_BY_WEIGHT, RUNNER_RATIO_MASTER, SHAPE_FACTORS } from '../constants';
import { CalculationResult, Machine, UserInputs } from '../types';

export function calculateCosts(inputs: UserInputs): CalculationResult {
  const warnings: string[] = [];

  // --- Block 1: Inputs & Setup ---
  const L = inputs.length || 0;
  const W = inputs.width || 0;
  const H = inputs.height || 0;
  const t = inputs.wallThickness || 0;

  const materialCode = inputs.materialCode || 'PP_HOMO';
  const matData = MATERIALS.find(m => m.code === materialCode) || MATERIALS[0];

  // --- Block 2: Volume & Weight ---
  const density = matData.density;
  let volume_mm3 = inputs.volume || 0;
  let weight_g = inputs.weight || 0;

  // Case 2: Have weight, find volume
  if (weight_g > 0 && volume_mm3 === 0) {
    const vol_cm3 = weight_g / density;
    volume_mm3 = vol_cm3 * 1000;
  } 
  // Case 1: Weight missing, use volume or fallback
  else if (weight_g === 0) {
    if (volume_mm3 === 0) {
        // Fallback estimate from bounding box
        volume_mm3 = L * W * H * 0.5; 
        warnings.push("Volume estimated from bounding box (50% solid).");
    }
    const vol_cm3 = volume_mm3 / 1000;
    weight_g = vol_cm3 * density;
  }

  // --- Block 3: Projected Area ---
  let Ap_mm2 = 0;
  if (inputs.projectedArea && inputs.projectedArea > 0) {
      Ap_mm2 = inputs.projectedArea; // Assuming input is mm2 if strictly following provided flow (Area input)
      // Note: If UI input is cm2, we should adjust, but logic implies standard units. 
      // Existing App input is usually mm based on other dims.
  } else {
      const shapeFactor = SHAPE_FACTORS[inputs.shapeType] || 0.85;
      Ap_mm2 = (L * W) * shapeFactor;
  }
  const Ap_cm2 = Ap_mm2 / 100;

  // --- Block 4: Clamp Tonnage Baseline (Single Cavity) ---
  const cf = (matData.cf_min + matData.cf_max) / 2;
  const SF = 1.2;
  // This is the specific tonnage per unit area logic
  // Actual required tonnage will depend on cavities in loop

  // --- Block 5: Production Hours ---
  const Q_yr = inputs.annualVolume || 100000;
  const D = inputs.workingDays || 250;
  const S = inputs.shiftsPerDay || 2;
  const H_s = inputs.hoursPerShift || 8;
  const oee = inputs.oee || 0.85;

  const availableHours = D * S * H_s * oee;
  const PPH_req = availableHours > 0 ? Q_yr / availableHours : 0;

  if (PPH_req === 0) warnings.push("Zero production requirements.");

  // --- Block 6, 8, 10: Cavity Selection Loop ---
  // We will iterate powers of 2 for efficiency (1, 2, 4...) up to 128
  // Use a structure to hold the best result found
  let finalStats = {
      n_cav: 1,
      finalMachine: MACHINES[MACHINES.length - 1],
      shotWeight: 0,
      paidShotWeight: 0,
      CT: 0,
      tCool: 0,
      tFill: 0,
      tPack: 0,
      tMachine: 0,
      PPH: 0,
      paidRunnerWeight: 0
  };

  for (let n_cav = 1; n_cav <= 128; n_cav = (n_cav === 1 ? 2 : n_cav * 2)) {
      
      // Calculate Required Tonnage for n cavities
      const totalProjectedArea = Ap_cm2 * n_cav;
      const requiredTonnage = totalProjectedArea * cf * SF;

      // Find Machine for Tonnage
      let currentMachine = MACHINES.find(m => m.tonnage >= requiredTonnage);
      
      // If no machine fits tonnage, stop trying larger cavities
      if (!currentMachine) {
          break;
      }

      // --- Block 7: Runner & Shot ---
      // 1. K_r from Type
      const runnerType = inputs.runnerType;
      const runnerRow = RUNNER_RATIO_MASTER.find(r => r.enumVal === runnerType) || RUNNER_RATIO_MASTER[2];
      const k_r_type = (runnerRow.k_r_min + runnerRow.k_r_max) / 2;

      // 2. K_r from Weight
      const weightRow = RUNNER_RATIO_BY_WEIGHT.find(r => weight_g >= r.w_min && weight_g < r.w_max) || RUNNER_RATIO_BY_WEIGHT[RUNNER_RATIO_BY_WEIGHT.length - 1];
      const k_r_weight = (weightRow.k_r_min + weightRow.k_r_max) / 2;

      // Take minimum
      const k_r = Math.min(k_r_type, k_r_weight);
      
      const runnerWeight = k_r * (weight_g * n_cav);
      const shotWeight = (weight_g * n_cav) + runnerWeight;

      const r_allowed = matData.regrind / 100;
      const paidRunnerWeight = runnerWeight * (1 - r_allowed);
      const paidShotWeight = (weight_g * n_cav) + paidRunnerWeight;

      // --- Block 8: Shot Capacity Check ---
      // Adjust Machine Shot Capacity (PS based) for Density
      // Capacity_Mat = Capacity_PS * (Density_Mat / Density_PS)
      // Density_PS ~ 1.05
      
      // Upgrade machine if shot weight exceeds 80% capacity
      let validMachine = true;
      while (shotWeight > 0.8 * (currentMachine.max_shot * (density / 1.05))) {
         const idx = MACHINES.indexOf(currentMachine);
         if (idx < MACHINES.length - 1) {
             currentMachine = MACHINES[idx + 1];
         } else {
             validMachine = false; // Exceeded largest machine
             break;
         }
      }

      if (!validMachine) {
          break; // Stop iteration if we max out machine
      }

      // --- Block 9: Cycle Time ---
      // 9.1 Machine
      const t_open_close = currentMachine.t_open_close;
      const t_eject = currentMachine.t_eject;
      const t_handling = inputs.useRobot ? 1.5 : 4.0; 
      const tMachine = t_open_close + t_eject + t_handling;

      // 9.2 Fill
      const t_fill_base = (matData.t_fill_min + matData.t_fill_max) / 2;
      const t_fill = t_fill_base * Math.pow((shotWeight / 50), 0.25);

      // 9.3 Pack
      const k_pack = (matData.k_pack_min + matData.k_pack_max) / 2;
      const t_pack = k_pack * (t * t);

      // 9.4 Cool
      const k_cool = (matData.k_cool_min + matData.k_cool_max) / 2;
      const t_cool = k_cool * (t * t);

      // CT = Sum all
      const CT = t_open_close + t_fill + t_pack + t_cool + t_eject + t_handling;

      // --- Block 10: PPH ---
      const scrapRate = inputs.scrapRate || (inputs.isGlassFilled ? 0.06 : 0.02);
      const PPH = (3600 / CT) * n_cav * (1 - scrapRate);

      // Store results
      finalStats = {
          n_cav,
          finalMachine: currentMachine,
          shotWeight,
          paidShotWeight,
          CT,
          tCool: t_cool,
          tFill: t_fill,
          tPack: t_pack,
          tMachine,
          PPH,
          paidRunnerWeight
      };

      // Check optimization condition
      if (PPH >= PPH_req) {
          break; // Found optimal
      }
  }

  // Use the stats from the loop
  const { n_cav, finalMachine, shotWeight, paidShotWeight, CT, PPH, paidRunnerWeight } = finalStats;

  // --- Block 11: Material Cost ---
  const scrapRateVal = inputs.scrapRate || (inputs.isGlassFilled ? 0.06 : 0.02);
  const paidWeightPerPart = (paidShotWeight / n_cav) / (1 - scrapRateVal);
  
  const resinPrice = inputs.resinPriceOverride > 0 ? inputs.resinPriceOverride : matData.priceResin;
  const scrapPrice = matData.priceScrap;

  const resinCost = (paidWeightPerPart / 1000) * resinPrice;
  
  // Calculate scrap credit to allow net cost calculation
  const scrapWeightPerPart = (shotWeight / n_cav) * (scrapRateVal / (1 - scrapRateVal));
  const scrapCredit = (scrapWeightPerPart / 1000) * scrapPrice;
  
  const materialCostPerPart = resinCost - scrapCredit;


  // --- Block 12: Process Cost ---
  const machineCostPerPart = PPH > 0 ? finalMachine.mhr_inr / PPH : 0;
  
  const N_op = inputs.numOperators || 0.5;
  const R_op = inputs.operatorRate || 200;
  const laborOverhead = inputs.laborOverhead || 0.5; 
  const laborCostPerHour = N_op * R_op * (1 + laborOverhead);
  const laborCostPerPart = PPH > 0 ? laborCostPerHour / PPH : 0;

  // Aux Calculation (Summing hourly costs based on config)
  let auxCostPerHour = 0;
  // 1. Chiller (Always)
  const chiller = AUXILIARY_COST_MASTER.find(a => a.id === 'chiller');
  if (chiller) auxCostPerHour += chiller.cost_hr;

  // 2. Dryer (Based on shot weight)
  const dryerId = shotWeight > 500 ? 'hopper_large' : 'hopper_small';
  const dryer = AUXILIARY_COST_MASTER.find(a => a.id === dryerId);
  if (dryer) auxCostPerHour += dryer.cost_hr;

  // 3. Robot (If selected)
  if (inputs.useRobot) {
      const robot = AUXILIARY_COST_MASTER.find(a => a.id === 'robot');
      if (robot) auxCostPerHour += robot.cost_hr;
  }
  // 4. Conveyor (If selected)
  if (inputs.useConveyor) {
      const conv = AUXILIARY_COST_MASTER.find(a => a.id === 'conveyor');
      if (conv) auxCostPerHour += conv.cost_hr;
  }

  const auxCostPerPart = PPH > 0 ? auxCostPerHour / PPH : 0;
  
  const processCostPerPart = machineCostPerPart + laborCostPerPart + auxCostPerPart;

  // --- Block 13: Overheads ---
  const packagingCost = inputs.packagingCostPerPart || 0.5;
  const mfgCost = materialCostPerPart + processCostPerPart + packagingCost;
  
  const p_sga = inputs.sgaRate || 0.1;
  const sgaCost = mfgCost * p_sga;
  
  const p_profit = inputs.profitRate || 0.15;
  const profitCost = (mfgCost + sgaCost) * p_profit;

  // Purchased Items
  const purchasedItemsCost = inputs.purchasedItems.reduce((acc, item) => acc + (item.price / (1 - item.scrapRate)), 0);

  // --- Block 14: Total Cost ---
  const totalPartCost = mfgCost + sgaCost + profitCost + purchasedItemsCost;

  return {
    netWeight: weight_g,
    volumeMm3: volume_mm3,
    projectedAreaCm2: Ap_cm2,
    requiredTonnage: Ap_cm2 * cf * SF * n_cav, // Actual total tonnage required
    selectedMachine: finalMachine,
    numCavities: n_cav,
    availableHours,
    requiredPPH: PPH_req,
    runnerWeight: paidRunnerWeight,
    shotWeight,
    paidShotWeight,
    cycleTime: CT,
    tCool: finalStats.tCool,
    tFill: finalStats.tFill,
    tPack: finalStats.tPack,
    tMachine: finalStats.tMachine,
    actualPPH: PPH,
    materialCostPerPart,
    resinCost,
    scrapCredit,
    processCostPerPart,
    machineCostPerPart,
    laborCostPerPart,
    auxCostPerPart,
    packagingCost,
    sgaCost,
    profitCost,
    purchasedItemsCost,
    totalPartCost,
    warnings
  };
}