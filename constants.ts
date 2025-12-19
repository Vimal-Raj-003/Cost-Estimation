
import { Machine, Material, RunnerType, Template, ShapeType, UserInputs, WeightSource } from './types';

export const MATERIALS: Material[] = [
  { code: 'PP_HOMO', name: 'Polypropylene Homopolymer', family: 'PP', density: 0.90, cf_min: 0.28, cf_max: 0.28, k_cool_min: 2.1, k_cool_max: 2.1, k_pack_min: 0.25, k_pack_max: 0.25, t_fill_min: 0.9, t_fill_max: 0.9, regrind: 30, priceResin: 105, priceUSD: 1.30, priceScrap: 15, remarks: 'General purpose, automotive interiors' },
  { code: 'PP_CO', name: 'Polypropylene Copolymer', family: 'PP', density: 0.90, cf_min: 0.32, cf_max: 0.32, k_cool_min: 2.4, k_cool_max: 2.4, k_pack_min: 0.30, k_pack_max: 0.30, t_fill_min: 1.0, t_fill_max: 1.0, regrind: 30, priceResin: 115, priceUSD: 1.40, priceScrap: 15, remarks: 'Impact modified' },
  { code: 'HDPE', name: 'High Density Polyethylene', family: 'PE', density: 0.95, cf_min: 0.28, cf_max: 0.28, k_cool_min: 2.0, k_cool_max: 2.0, k_pack_min: 0.25, k_pack_max: 0.25, t_fill_min: 0.9, t_fill_max: 0.9, regrind: 25, priceResin: 110, priceUSD: 1.35, priceScrap: 15, remarks: 'Containers, blow & injection' },
  { code: 'LDPE', name: 'Low Density Polyethylene', family: 'PE', density: 0.92, cf_min: 0.25, cf_max: 0.25, k_cool_min: 1.9, k_cool_max: 1.9, k_pack_min: 0.22, k_pack_max: 0.22, t_fill_min: 0.8, t_fill_max: 0.8, regrind: 25, priceResin: 120, priceUSD: 1.45, priceScrap: 15, remarks: 'Flexible components' },
  { code: 'PS', name: 'Polystyrene', family: 'PS', density: 1.05, cf_min: 0.35, cf_max: 0.35, k_cool_min: 2.5, k_cool_max: 2.5, k_pack_min: 0.30, k_pack_max: 0.30, t_fill_min: 1.1, t_fill_max: 1.1, regrind: 20, priceResin: 125, priceUSD: 1.55, priceScrap: 15, remarks: 'Disposable & consumer items' },
  { code: 'ABS', name: 'Acrylonitrile Butadiene Styrene', family: 'ABS', density: 1.04, cf_min: 0.42, cf_max: 0.42, k_cool_min: 3.0, k_cool_max: 3.0, k_pack_min: 0.38, k_pack_max: 0.38, t_fill_min: 1.4, t_fill_max: 1.4, regrind: 20, priceResin: 190, priceUSD: 2.30, priceScrap: 25, remarks: 'Automotive & appliance housings' },
  { code: 'PC', name: 'Polycarbonate', family: 'PC', density: 1.20, cf_min: 0.55, cf_max: 0.55, k_cool_min: 4.0, k_cool_max: 4.0, k_pack_min: 0.50, k_pack_max: 0.50, t_fill_min: 1.6, t_fill_max: 1.6, regrind: 10, priceResin: 320, priceUSD: 3.90, priceScrap: 40, remarks: 'High strength, transparent' },
  { code: 'PMMA', name: 'Acrylic (PMMA)', family: 'PMMA', density: 1.18, cf_min: 0.50, cf_max: 0.50, k_cool_min: 3.6, k_cool_max: 3.6, k_pack_min: 0.45, k_pack_max: 0.45, t_fill_min: 1.5, t_fill_max: 1.5, regrind: 10, priceResin: 280, priceUSD: 3.40, priceScrap: 35, remarks: 'Optical & transparent parts' },
  { code: 'PA6', name: 'Nylon 6', family: 'PA', density: 1.13, cf_min: 0.45, cf_max: 0.45, k_cool_min: 3.0, k_cool_max: 3.0, k_pack_min: 0.40, k_pack_max: 0.40, t_fill_min: 1.3, t_fill_max: 1.3, regrind: 20, priceResin: 260, priceUSD: 3.20, priceScrap: 30, remarks: 'Mechanical components' },
  { code: 'PA66', name: 'Nylon 66', family: 'PA', density: 1.14, cf_min: 0.50, cf_max: 0.50, k_cool_min: 3.4, k_cool_max: 3.4, k_pack_min: 0.45, k_pack_max: 0.45, t_fill_min: 1.4, t_fill_max: 1.4, regrind: 20, priceResin: 300, priceUSD: 3.70, priceScrap: 35, remarks: 'High strength engineering plastic' },
  { code: 'POM', name: 'Acetal', family: 'POM', density: 1.41, cf_min: 0.45, cf_max: 0.45, k_cool_min: 2.6, k_cool_max: 2.6, k_pack_min: 0.35, k_pack_max: 0.35, t_fill_min: 1.2, t_fill_max: 1.2, regrind: 20, priceResin: 280, priceUSD: 3.40, priceScrap: 30, remarks: 'Precision gears & bearings' },
  { code: 'PBT', name: 'Polybutylene Terephthalate', family: 'PBT', density: 1.31, cf_min: 0.45, cf_max: 0.45, k_cool_min: 3.0, k_cool_max: 3.0, k_pack_min: 0.40, k_pack_max: 0.40, t_fill_min: 1.3, t_fill_max: 1.3, regrind: 20, priceResin: 270, priceUSD: 3.30, priceScrap: 30, remarks: 'Electrical connectors' },
  { code: 'ABS_GF30', name: 'ABS Glass Filled 30%', family: 'ABS_GF', density: 1.20, cf_min: 0.55, cf_max: 0.55, k_cool_min: 3.2, k_cool_max: 3.2, k_pack_min: 0.45, k_pack_max: 0.45, t_fill_min: 1.6, t_fill_max: 1.6, regrind: 5, priceResin: 230, priceUSD: 2.80, priceScrap: 20, remarks: 'Structural housings' },
  { code: 'PA66_GF30', name: 'Nylon 66 Glass Filled 30%', family: 'PA_GF', density: 1.36, cf_min: 0.65, cf_max: 0.65, k_cool_min: 3.8, k_cool_max: 3.8, k_pack_min: 0.55, k_pack_max: 0.55, t_fill_min: 1.8, t_fill_max: 1.8, regrind: 5, priceResin: 360, priceUSD: 4.40, priceScrap: 30, remarks: 'Automotive structural parts' },
  // Fixed duplicate t_fill_min property and added missing t_fill_max to resolve validation errors
  { code: 'PC_GF20', name: 'Polycarbonate Glass Filled 20%', family: 'PC_GF', density: 1.32, cf_min: 0.65, cf_max: 0.65, k_cool_min: 4.2, k_cool_max: 4.2, k_pack_min: 0.55, k_pack_max: 0.55, t_fill_min: 1.9, t_fill_max: 1.9, regrind: 5, priceResin: 390, priceUSD: 4.80, priceScrap: 35, remarks: 'High stiffness parts' },
  { code: 'PBT_GF30', name: 'PBT Glass Filled 30%', family: 'PBT_GF', density: 1.55, cf_min: 0.60, cf_max: 0.60, k_cool_min: 3.6, k_cool_max: 3.6, k_pack_min: 0.50, k_pack_max: 0.50, t_fill_min: 1.7, t_fill_max: 1.7, regrind: 5, priceResin: 350, priceUSD: 4.30, priceScrap: 30, remarks: 'Electrical & EV components' },
];

export const MACHINES: Machine[] = [
  { tonnage: 80, max_shot: 90, t_open_close: 2.0, t_eject: 1.0, power: 10, mhr_inr: 700 },
  { tonnage: 120, max_shot: 150, t_open_close: 2.5, t_eject: 1.0, power: 14, mhr_inr: 900 },
  { tonnage: 150, max_shot: 220, t_open_close: 3.0, t_eject: 1.2, power: 18, mhr_inr: 1100 },
  { tonnage: 200, max_shot: 350, t_open_close: 3.2, t_eject: 1.3, power: 22, mhr_inr: 1400 },
  { tonnage: 250, max_shot: 500, t_open_close: 3.5, t_eject: 1.4, power: 26, mhr_inr: 1700 },
  { tonnage: 300, max_shot: 650, t_open_close: 3.8, t_eject: 1.5, power: 30, mhr_inr: 2000 },
  { tonnage: 350, max_shot: 800, t_open_close: 4.2, t_eject: 1.6, power: 35, mhr_inr: 2500 },
  { tonnage: 450, max_shot: 1200, t_open_close: 4.8, t_eject: 1.8, power: 45, mhr_inr: 3200 },
  { tonnage: 650, max_shot: 2000, t_open_close: 5.5, t_eject: 2.0, power: 60, mhr_inr: 4500 },
  { tonnage: 850, max_shot: 3000, t_open_close: 6.5, t_eject: 2.2, power: 80, mhr_inr: 6000 },
];

export const RUNNER_RATIO_MASTER = [
  { type: 'Hot Runner', k_r_min: 0.00, k_r_max: 0.02, enumVal: RunnerType.HOT },
  { type: 'Semi Hot Runner', k_r_min: 0.05, k_r_max: 0.15, enumVal: RunnerType.SEMI_HOT },
  { type: 'Cold Runner 2-Plate', k_r_min: 0.15, k_r_max: 0.40, enumVal: RunnerType.COLD_2_PLATE },
  { type: 'Cold Runner 3-Plate', k_r_min: 0.30, k_r_max: 0.80, enumVal: RunnerType.COLD_3_PLATE },
];

export const RUNNER_RATIO_BY_WEIGHT = [
  { w_min: 0, w_max: 5, k_r_min: 0.40, k_r_max: 0.70 },
  { w_min: 5, w_max: 20, k_r_min: 0.30, k_r_max: 0.50 },
  { w_min: 20, w_max: 50, k_r_min: 0.20, k_r_max: 0.40 },
  { w_min: 50, w_max: 150, k_r_min: 0.15, k_r_max: 0.30 },
  { w_min: 150, w_max: 99999, k_r_min: 0.10, k_r_max: 0.25 },
];

export const OEE_MASTER = {
  fully_automated: 0.85,
  semi_automated: 0.75,
  manual: 0.65,
};

export const SCRAP_DEFAULTS = [
  { condition: 'Mature Production', percent: 2 },
  { condition: 'New Tool', percent: 4 },
  { condition: 'Glass Filled Material', percent: 6 },
  { condition: 'Cosmetic Part', percent: 5 },
];

export const AUXILIARY_COST_MASTER = [
  { equipment: 'Hopper Dryer Small', power: 4, cost_hr: 80, id: 'hopper_small' },
  { equipment: 'Hopper Dryer Large', power: 10, cost_hr: 160, id: 'hopper_large' },
  { equipment: 'Chiller', power: 10, cost_hr: 250, id: 'chiller' },
  { equipment: 'Robot Picker', power: 3, cost_hr: 180, id: 'robot' },
  { equipment: 'Conveyor', power: 2, cost_hr: 50, id: 'conveyor' },
];

export const SHAPE_FACTORS = {
  RECTANGLE: 0.85,
  ROUND: 0.70,
  COMPLEX: 0.65,
};

// Typed BASE_INPUTS as UserInputs to ensure literal values like 'calculated' are preserved as WeightSource type
const BASE_INPUTS: UserInputs = {
  length: 100, width: 50, height: 20, wallThickness: 2, projectedArea: null,
  shapeType: ShapeType.RECTANGLE, volume: null, weight: null, 
  weightSource: 'calculated',
  annualVolume: 100000,
  workingDays: 250, shiftsPerDay: 2, hoursPerShift: 8, oee: 0.85, scrapRate: 0.02,
  materialCode: 'PP_HOMO', isGlassFilled: false, runnerType: RunnerType.COLD_2_PLATE,
  numOperators: 1, operatorRate: 150, laborOverhead: 0.3, useRobot: false, useConveyor: false,
  resinPriceOverride: 105, packagingCostPerPart: 0.50, sgaRate: 0.1, profitRate: 0.15,
  purchasedItems: [],
};

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'tmpl_precision_single',
    name: 'Precision Single Cavity',
    description: 'Optimized for engineering parts with tight tolerances and complex geometries.',
    type: 'Injection Molding',
    volumeProfile: 'Low',
    lastUpdated: '05/01/2025',
    inputs: { ...BASE_INPUTS, annualVolume: 10000, runnerType: RunnerType.COLD_2_PLATE, materialCode: 'PC', resinPriceOverride: 320, oee: 0.70 }
  },
  {
    id: 'tmpl_high_volume_multi',
    name: 'High Volume Multi-Cavity',
    description: 'Fast cycle times using hot runners and multi-cavity tooling for consumer goods.',
    type: 'Injection Molding',
    volumeProfile: 'High',
    lastUpdated: '05/01/2025',
    inputs: { ...BASE_INPUTS, annualVolume: 2000000, runnerType: RunnerType.HOT, useRobot: true, useConveyor: true, oee: 0.90, numOperators: 0.5 }
  },
  {
    id: 'tmpl_auto_exterior',
    name: 'Automotive Exterior (ABS)',
    description: 'Standard settings for automotive housings, grills, and mirror caps.',
    type: 'Injection Molding',
    volumeProfile: 'Medium',
    lastUpdated: '05/02/2025',
    inputs: { ...BASE_INPUTS, materialCode: 'ABS', annualVolume: 150000, scrapRate: 0.04, packagingCostPerPart: 1.20 }
  },
  {
    id: 'tmpl_fast_consumer',
    name: 'Disposable Goods (PP)',
    description: 'Extreme efficiency for thin-walled, low-cost commodity items.',
    type: 'Injection Molding',
    volumeProfile: 'High',
    lastUpdated: '05/02/2025',
    inputs: { ...BASE_INPUTS, materialCode: 'PP_HOMO', annualVolume: 5000000, wallThickness: 0.8, oee: 0.95, profitRate: 0.08 }
  }
];
