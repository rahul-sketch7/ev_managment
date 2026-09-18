import {
  Charger,
  GridConfiguration,
  HourlyDemandProfile,
  OptimizationResultData,
  PriorityLevel,
  Vehicle,
  VehicleReadiness,
} from '../types';

export type OptimizationStatus =
  | 'NOT_RUN'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED'
  | 'UNAVAILABLE'
  | 'INVALID_RESPONSE'
  | 'NO_FEASIBLE_SOLUTION';

export type ScenarioSource = 'DEMO_INPUT' | 'MANUAL' | 'PDF_SCHEDULE';
export type ValidationStatus = 'NOT_VALIDATED' | 'VALID' | 'INVALID';

export interface VehicleScheduleInput {
  vehicleId: string;
  model: string;
  route: string;
  routePriority: PriorityLevel;
  arrivalTime: string;
  departureTime: string;
  currentSOC: number;
  targetSOC: number;
  requiredEnergyKwh: number;
  batteryCapacityKwh: number;
  maxPowerKw: number;
}

export interface ScenarioDocument {
  name: string;
  uploadedAt: string;
  mimeType?: string;
}

export interface ValidationIssue {
  field: string;
  message: string;
  vehicleId?: string;
}

export type ExtractionStatus = 'IDLE' | 'FILE_SELECTED' | 'EXTRACTING' | 'EXTRACTED' | 'ERROR';
export type ExtractionRowStatus = 'VALID' | 'WARNING' | 'ERROR';
export interface ExtractedVehicleSchedule {
  vehicleId: string | null; model: string | null; route: string | null; priority: PriorityLevel | null;
  arrivalTime: string | null; departureTime: string | null; currentSOC: number | null; targetSOC: number | null;
  batteryCapacityKwh: number | null; requiredEnergyKwh: number | null; maxPowerKw: number | null;
  sourcePage: number; sourceRow: number; originalExtractedText: string; confidence: ExtractionRowStatus;
}
export interface ExtractionResult {
  sourceDocument: ScenarioDocument; extractedRows: ExtractedVehicleSchedule[]; extractionWarnings: string[]; extractionStatus: ExtractionStatus;
}

export interface BaselineResult {
  peakDemand: number;
  energyConsumption: number;
  electricityCost: number;
  peakPeriodEnergy: number;
  vehiclesReady: number;
  totalVehicles: number;
  hourlyDemandCurve: HourlyDemandProfile[];
  readiness: VehicleReadiness[];
  schedules: Array<{ vehicleId: string; chargerId: string; startTime: string; endTime: string; powerKw: number; energyKwh: number }>;
}

export interface Scenario {
  id: string;
  name: string;
  source: ScenarioSource;
  sourceDocument: ScenarioDocument | null;
  vehicles: Vehicle[];
  chargers: Charger[];
  gridConfiguration: GridConfiguration;
  tariffConfiguration: GridConfiguration['tariffs'];
  validationStatus: ValidationStatus;
  optimizationStatus: OptimizationStatus;
  optimizationResult: OptimizationResultData | null;
  createdAt: string;
  updatedAt: string;
}
