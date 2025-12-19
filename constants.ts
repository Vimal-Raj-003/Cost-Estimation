import { Machine, Material, RunnerType } from './types';

// Merged Pricing into the Master data (approx 85 INR/USD conversion from original defaults)
export const MATERIALS: Material[] = [
  { code: 'PP_HOMO', name: 'Polypropylene Homopolymer', density: 0.90, cf_min: 0.25, cf_max: 0.30, k_cool_min: 1.8, k_cool_max: 2.4, k_pack_min: 0.20, k_pack_max: 0.30, t_fill_min: 0.8, t_fill_max: 1.0, regrind: 30, priceResin: 100, priceScrap: 10 },
  { code: 'PP_CO', name: 'Polypropylene Copolymer', density: 0.90, cf_min: 0.28, cf_max: 0.35, k_cool_min: 2.0, k_cool_max: 2.6, k_pack_min: 0.25, k_pack_max: 0.35, t_fill_min: 0.9, t_fill_max: 1.1, regrind: 30, priceResin: 110, priceScrap: 10 },
  { code: 'HDPE', name: 'High Density Polyethylene', density: 0.95, cf_min: 0.25, cf_max: 0.30, k_cool_min: 1.8, k_cool_max: 2.3, k_pack_min: 0.20, k_pack_max: 0.30, t_fill_min: 0.8, t_fill_max: 1.0, regrind: 25, priceResin: 105, priceScrap: 10 },
  { code: 'LDPE', name: 'Low Density Polyethylene', density: 0.92, cf_min: 0.22, cf_max: 0.28, k_cool_min: 1.6, k_cool_max: 2.2, k_pack_min: 0.18, k_pack_max: 0.28, t_fill_min: 0.7, t_fill_max: 0.9, regrind: 25, priceResin: 110, priceScrap: 10 },
  { code: 'PS', name: 'Polystyrene', density: 1.05, cf_min: 0.30, cf_max: 0.40, k_cool_min: 2.0, k_cool_max: 2.8, k_pack_min: 0.25, k_pack_max: 0.35, t_fill_min: 1.0, t_fill_max: 1.2, regrind: 20, priceResin: 135, priceScrap: 12 },
  { code: 'ABS', name: 'Acrylonitrile Butadiene Styrene', density: 1.04, cf_min: 0.35, cf_max: 0.45, k_cool_min: 2.5, k_cool_max: 3.2, k_pack_min: 0.30, k_pack_max: 0.45, t_fill_min: 1.2, t_fill_max: 1.5, regrind: 20, priceResin: 170, priceScrap: 15 },
  { code: 'PC', name: 'Polycarbonate', density: 1.20, cf_min: 0.45, cf_max: 0.60, k_cool_min: 3.2, k_cool_max: 4.5, k_pack_min: 0.40, k_pack_max: 0.60, t_fill_min: 1.4, t_fill_max: 1.8, regrind: 10, priceResin: 300, priceScrap: 25 },
  { code: 'PMMA', name: 'Acrylic', density: 1.18, cf_min: 0.40, cf_max: 0.55, k_cool_min: 3.0, k_cool_max: 4.0, k_pack_min: 0.35, k_pack_max: 0.50, t_fill_min: 1.3, t_fill_max: 1.6, regrind: 10, priceResin: 255, priceScrap: 20 },
  { code: 'PA6', name: 'Nylon 6', density: 1.13, cf_min: 0.35, cf_max: 0.50, k_cool_min: 2.5, k_cool_max: 3.5, k_pack_min: 0.30, k_pack_max: 0.45, t_fill_min: 1.1, t_fill_max: 1.4, regrind: 20, priceResin: 240, priceScrap: 20 },
  { code: 'PA66', name: 'Nylon 66', density: 1.14, cf_min: 0.40, cf_max: 0.55, k_cool_min: 2.8, k_cool_max: 3.8, k_pack_min: 0.35, k_pack_max: 0.50, t_fill_min: 1.2, t_fill_max: 1.5, regrind: 20, priceResin: 270, priceScrap: 20 },
  { code: 'POM', name: 'Acetal', density: 1.41, cf_min: 0.35, cf_max: 0.50, k_cool_min: 2.0, k_cool_max: 3.0, k_pack_min: 0.25, k_pack_max: 0.40, t_fill_min: 1.0, t_fill_max: 1.3, regrind: 20, priceResin: 210, priceScrap: 10 },
  { code: 'PBT', name: 'Polybutylene Terephthalate', density: 1.31, cf_min: 0.35, cf_max: 0.50, k_cool_min: 2.3, k_cool_max: 3.5, k_pack_min: 0.30, k_pack_max: 0.45, t_fill_min: 1.1, t_fill_max: 1.4, regrind: 20, priceResin: 230, priceScrap: 15 },
  { code: 'ABS_GF30', name: 'ABS Glass Filled 30%', density: 1.20, cf_min: 0.45, cf_max: 0.60, k_cool_min: 2.8, k_cool_max: 3.6, k_pack_min: 0.40, k_pack_max: 0.55, t_fill_min: 1.4, t_fill_max: 1.8, regrind: 5, priceResin: 200, priceScrap: 5 },
  { code: 'PA66_GF30', name: 'PA66 Glass Filled 30%', density: 1.36, cf_min: 0.50, cf_max: 0.70, k_cool_min: 3.0, k_cool_max: 4.2, k_pack_min: 0.45, k_pack_max: 0.65, t_fill_min: 1.5, t_fill_max: 2.0, regrind: 5, priceResin: 300, priceScrap: 5 },
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