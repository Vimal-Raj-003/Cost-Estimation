export type ProjectStatus = 'Draft' | 'Final' | 'Sold' | 'Archived';

export interface ProjectMetadata {
  projectId: string;
  projectName: string;
  customerName: string;
  partName: string;
  estimationType: 'Injection Molding' | 'Sheet Metal' | 'Assembly';
  createdBy: string;
  createdDate: string;
  status: ProjectStatus;
  version: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  type: 'Injection Molding' | 'Sheet Metal' | 'Assembly';
  volumeProfile: 'Low' | 'Medium' | 'High';
  inputs: UserInputs;
  isCustom?: boolean;
  lastUpdated: string;
}

export interface Material {
  code: string;
  name: string;
  family?: string;
  remarks?: string;
  density: number;
  cf_min: number;
  cf_max: number;
  k_cool_min: number;
  k_cool_max: number;
  k_pack_min: number;
  k_pack_max: number;
  t_fill_min: number;
  t_fill_max: number;
  regrind: number;
  priceResin: number;
  priceUSD?: number;
  priceScrap: number;
}

export interface Machine {
  tonnage: number;
  max_shot: number;
  t_open_close: number;
  t_eject: number;
  power: number;
  mhr_inr: number;
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
  scrapRate: number;
}

export interface UserInputs {
  length: number;
  width: number;
  height: number;
  wallThickness: number;
  projectedArea: number | null;
  shapeType: ShapeType;
  volume: number | null;
  weight: number | null;
  annualVolume: number;
  workingDays: number;
  shiftsPerDay: number;
  hoursPerShift: number;
  oee: number;
  scrapRate: number;
  materialCode: string;
  isGlassFilled: boolean;
  runnerType: RunnerType;
  numOperators: number;
  operatorRate: number;
  laborOverhead: number;
  useRobot: boolean;
  useConveyor: boolean;
  resinPriceOverride: number;
  packagingCostPerPart: number;
  sgaRate: number;
  profitRate: number;
  purchasedItems: PurchasedItem[];
}

export interface CalculationResult {
  netWeight: number;
  volumeMm3: number;
  projectedAreaCm2: number;
  requiredTonnage: number;
  selectedMachine: Machine | null;
  numCavities: number;
  availableHours: number;
  requiredPPH: number;
  runnerWeight: number;
  shotWeight: number;
  paidShotWeight: number;
  cycleTime: number;
  tCool: number;
  tFill: number;
  tPack: number;
  tMachine: number;
  actualPPH: number;
  materialCostPerPart: number;
  resinCost: number;
  scrapCredit: number;
  processCostPerPart: number;
  machineCostPerPart: number;
  laborCostPerPart: number;
  auxCostPerPart: number;
  packagingCost: number;
  sgaCost: number;
  profitCost: number;
  purchasedItemsCost: number;
  totalPartCost: number;
  warnings: string[];
}