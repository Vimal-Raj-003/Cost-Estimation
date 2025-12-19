export interface Material {
  code: string;
  name: string;
  density: number; // g/cm3
  cf_min: number; // clamp factor
  cf_max: number;
  k_cool_min: number;
  k_cool_max: number;
  k_pack_min: number;
  k_pack_max: number;
  t_fill_min: number;
  t_fill_max: number;
  regrind: number; // % (e.g. 30 for 30%)
  
  // Pricing (added to merge logic)
  priceResin: number; // INR per kg
  priceScrap: number; // INR per kg
}

export interface Machine {
  tonnage: number;
  max_shot: number; // g (Polystyrene equivalent)
  t_open_close: number; // s
  t_eject: number; // s
  power: number; // kW
  mhr_inr: number; // Cost per hour INR
}

export enum ShapeType {
  RECTANGLE = 'RECTANGLE',
  ROUND = 'ROUND',
  COMPLEX = 'COMPLEX',
}

export enum RunnerType {
  HOT = 'HOT',
  SEMI_HOT = 'SEMI_HOT',
  COLD_2_PLATE = 'COLD_2_PLATE',
  COLD_3_PLATE = 'COLD_3_PLATE',
}

export interface PurchasedItem {
  id: string;
  name: string;
  price: number;
  scrapRate: number; // 0-1
}

export interface UserInputs {
  // Geometry
  length: number;
  width: number;
  height: number;
  wallThickness: number;
  projectedArea: number | null;
  shapeType: ShapeType;
  volume: number | null;
  weight: number | null;
  
  // Production
  annualVolume: number;
  workingDays: number;
  shiftsPerDay: number;
  hoursPerShift: number;
  oee: number; // 0-1
  scrapRate: number; // 0-1
  
  // Material & Tool
  materialCode: string;
  isGlassFilled: boolean;
  runnerType: RunnerType;
  
  // Process Details (Labor/Overhead)
  numOperators: number;
  operatorRate: number;
  laborOverhead: number; // Percentage (0.2 = 20%)
  
  // Auxiliaries
  useRobot: boolean;
  useConveyor: boolean;
  
  // Costs
  resinPriceOverride: number;
  
  // Overheads
  packagingCostPerPart: number;
  sgaRate: number;
  profitRate: number;

  purchasedItems: PurchasedItem[];
}

export interface CalculationResult {
  // Block 2
  netWeight: number;
  volumeMm3: number;
  
  // Block 3
  projectedAreaCm2: number;
  
  // Block 4 & 6 & 8
  requiredTonnage: number;
  selectedMachine: Machine | null;
  numCavities: number;
  
  // Block 5
  availableHours: number;
  requiredPPH: number;
  
  // Block 7
  runnerWeight: number;
  shotWeight: number;
  paidShotWeight: number;
  
  // Block 9
  cycleTime: number;
  tCool: number;
  tFill: number;
  tPack: number;
  tMachine: number;
  
  // Block 10
  actualPPH: number;
  
  // Block 11 (Material Cost)
  materialCostPerPart: number;
  resinCost: number;
  scrapCredit: number;
  
  // Block 12 (Process Cost)
  processCostPerPart: number;
  machineCostPerPart: number;
  laborCostPerPart: number;
  auxCostPerPart: number;
  
  // Block 13 (Overheads)
  packagingCost: number;
  sgaCost: number;
  profitCost: number;
  purchasedItemsCost: number;
  
  // Block 14
  totalPartCost: number;
  
  // Messages/Warnings
  warnings: string[];
}