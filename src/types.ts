export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'NORMAL';

export type ChargingStatus = 'Charging' | 'Scheduled' | 'Ready' | 'Attention' | 'Idle' | 'Boost DC';

export type ChargerStatus =
  | 'Available'
  | 'Charging'
  | 'Unavailable'
  | 'Priority Charging'
  | 'Attention'
  | 'Ready'
  | 'Maintenance'
  | 'Fault'
  | 'Standby';

export type ChargerType = 'DC Fast' | 'AC Level 2' | 'DC High Power' | string;

export interface Vehicle {
  id: string;
  model: string;
  type: string;
  route: string;
  routePriority: PriorityLevel;
  currentSOC: number;
  targetSOC: number;
  batteryCapacity: number; // kWh
  requiredEnergy: number; // kWh
  arrivalTime: string;
  departureTime: string;
  maxChargingPower: number; // kW
  chargingStatus: ChargingStatus;
  assignedChargerId?: string;
  currentPower: number; // kW
  scheduledStart?: string;
  scheduledEnd?: string;
  energyDelivered?: number; // kWh
  inspectionBufferMin?: number;
  notes?: string;
}

export interface Charger {
  id: string;
  type: ChargerType;
  manufacturer?: string;
  model?: string;
  location: string;
  maxPower: number; // kW
  voltage?: number; // V
  phases?: 1 | 3;
  connector?: string;
  current?: number; // A
  group: string;
  status: ChargerStatus;
  smartCharging: boolean;
  peakProtection?: boolean;
  dynamicLoadBalancing?: boolean;
  connectedVehicleId?: string;
  assignedVehicleId?: string;
  currentPower: number; // kW
  sessionDuration?: string;
  sessionEnergy?: number; // kWh
}

export interface GridConfiguration {
  siteCapacity: number; // kW (e.g. 600)
  warningThresholdPercent: number; // e.g. 85 -> 510 kW
  criticalLimitPercent: number; // e.g. 95 -> 570 kW
  baseLoad: number; // kW (e.g. 220)
  currentDemand: number; // kW (e.g. 428)
  availableHeadroom: number; // kW (e.g. 172)
  utilizationPercent: number; // e.g. 71.3%
  peakTariffStart: string; // "17:00"
  peakTariffEnd: string; // "21:00"
  tariffs: {
    offPeak: number; // ₹5.20
    normal: number; // ₹7.20
    peak: number; // ₹10.50
  };
}

export interface ScheduleAdjustment {
  vehicleId: string;
  route: string;
  priority: PriorityLevel;
  prevStart: string;
  optimizedStart: string;
  departure: string;
  shiftDelta: string;
  status: 'SHIFTED' | 'PRIORITY' | 'DEFERRED' | 'UNCHANGED';
  reason: string;
}

export interface VehicleReadiness {
  vehicleId: string;
  currentSOC: number;
  targetSOC: number;
  requiredEnergy: number;
  estimatedReadyTime: string;
  departureTime: string;
  bufferSlackMinutes: number;
  readinessStatus: 'READY' | 'AT RISK' | 'ON TRACK';
}

export interface HourlyDemandProfile {
  hour: number; // 0 to 24
  timeLabel: string; // "00:00", "01:00", ...
  uncontrolledKw: number;
  optimizedKw: number;
  capacityLimitKw: number;
  warningLimitKw: number;
  isPeakTariff: boolean;
  tariffRate: number; // ₹/kWh
}

export interface OptimizationResultData {
  id: string;
  timestamp: string;
  solvedInSeconds: number | null;
  optimizedPeakDemand: number;
  uncontrolledPeakDemand: number;
  peakReductionKw: number;
  peakReductionPercent: number;
  energyCost: number | null;
  uncontrolledCost: number | null;
  costSavings: number | null;
  costSavingsPercent: number | null;
  vehiclesReady: number;
  totalVehicles: number;
  gridHeadroom: number;
  siteCapacity: number;
  shifts: ScheduleAdjustment[];
  readiness: VehicleReadiness[];
  constraintChecks: {
    name: string;
    description: string;
    passed: boolean;
  }[];
  explanationPoints: string[];
  backendSource: 'live';
  hourlyDemandCurve?: HourlyDemandProfile[];
  vehicleSchedules: Array<{
    vehicleId: string;
    chargerId: string | null;
    startTime: string;
    endTime: string;
    powerKw: number;
    energyKwh: number;
  }>;
}

export interface SimulationParameters {
  scenarioName?: string;
  fleetSize: number;
  chargerCount?: number;
  gridCapacity: number; // kW
  avgInitialSoc: number; // %
  targetSoc: number; // %
  arrivalWindow?: string; // e.g. "08:00 - 18:00"
  departureWindow?: string; // e.g. "17:00 - 22:00"
  priorityDistribution: {
    critical: number;
    high: number;
    normal: number;
  };
  tariffs: {
    offPeak: number;
    normal: number;
    peak: number;
  };
}

export interface OperationalAlert {
  id: string;
  type: 'critical' | 'warning' | 'optimization';
  title: string;
  description: string;
  timestamp: string;
  vehicleId?: string;
}

export interface HistoricalDayRecord {
  date: string;
  dayName: string;
  peakDemandKw: number;
  uncontrolledPeakKw: number;
  energyCost: number;
  uncontrolledCost: number;
  vehiclesReady: number;
  totalVehicles: number;
  energyMwh: number;
  peakReductionKw: number;
  peakReductionPercent: number;
  status: 'Compliant' | 'Warning';
  energyDeliveredKwh?: number;
  savingsRupees?: number;
  optimizedPeakKw?: number;
  peakShavedKw?: number;
  costRupees?: number;
  onTimePercent?: number;
}

export type PageView =
  | 'dashboard'
  | 'fleet'
  | 'charging-infrastructure'
  | 'charging-schedule'
  | 'energy-and-grid'
  | 'simulation'
  | 'analytics'
  | 'settings'
  | 'optimization-result'
  | 'add-vehicle'
  | 'add-charger'
  | 'playground'
  | 'data-inspector'
  | 'pdf-schedule-import';

export type LanguageCode = 'en' | 'hi' | 'de' | 'es' | 'fr';
