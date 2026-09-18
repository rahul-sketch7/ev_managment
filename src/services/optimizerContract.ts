import { Charger, GridConfiguration, OptimizationResultData, Vehicle } from '../types';
import { BaselineResult } from '../types/scenario';

export class OptimizationEngineError extends Error {
  constructor(message: string, public readonly code: 'UNAVAILABLE' | 'INVALID_RESPONSE' | 'NO_FEASIBLE_SOLUTION') {
    super(message);
    this.name = 'OptimizationEngineError';
  }
}

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const timeLabel = (slot: number, offsetMinutes: number) => {
  const minutes = (slot * 15 + offsetMinutes) % (24 * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
};

/** Adapts the Java response while rejecting responses that cannot produce a real schedule. */
export const parseOptimizerResponse = (
  value: unknown,
  vehicles: Vehicle[],
  chargers: Charger[],
  grid: GridConfiguration,
  baseline: BaselineResult
): OptimizationResultData => {
  if (!value || typeof value !== 'object') throw new OptimizationEngineError('Invalid optimization response.', 'INVALID_RESPONSE');
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.cars) || data.cars.length !== vehicles.length) {
    throw new OptimizationEngineError('Invalid optimization response.', 'INVALID_RESPONSE');
  }
  const cars = data.cars as Array<Record<string, unknown>>;
  const referenceMinutes = Math.min(...vehicles.map((vehicle) => {
    const [hours, minutes] = vehicle.arrivalTime.split(':').map(Number);
    return hours * 60 + minutes;
  }));
  const numericIds = new Map(vehicles.map((vehicle, index) => {
    const match = vehicle.id.match(/\d+/);
    return [match ? Number(match[0]) : index + 1, vehicle] as const;
  }));
  const assignments = new Map(chargers.map((charger, index) => [index + 1, charger.id]));
  const demandSlots = Array.from({ length: 96 }, () => grid.baseLoad);
  const schedules: OptimizationResultData['vehicleSchedules'] = [];
  const readiness = vehicles.map((vehicle) => baseline.readiness.find((item) => item.vehicleId === vehicle.id)!).filter(Boolean);

  for (const car of cars) {
    if (!isNumber(car.id) || !Array.isArray(car.currentPlan) || !isNumber(car.timestampArrival)) {
      throw new OptimizationEngineError('Invalid optimization response.', 'INVALID_RESPONSE');
    }
    const vehicle = numericIds.get(car.id);
    if (!vehicle) throw new OptimizationEngineError('Invalid optimization response.', 'INVALID_RESPONSE');
    const phases = vehicle.maxChargingPower > 11 ? 3 : 1;
    const powerFromCurrent = (current: number) => current * 230 * phases / 1000;
    const plan = car.currentPlan as unknown[];
    if (plan.some((power) => !isNumber(power) || power < 0)) {
      throw new OptimizationEngineError('Invalid optimization response.', 'INVALID_RESPONSE');
    }
    const chargerId = assignments.get(cars.indexOf(car) + 1) || null;
    let first = -1;
    let last = -1;
    let energyKwh = 0;
    plan.slice(0, 96).forEach((current, slot) => {
      const powerKw = powerFromCurrent(current as number);
      demandSlots[slot] += powerKw;
      if (powerKw > 0) {
        if (first < 0) first = slot;
        last = slot;
        energyKwh += powerKw * 0.25;
      }
    });
    schedules.push({
      vehicleId: vehicle.id,
      chargerId,
      startTime: first < 0 ? vehicle.arrivalTime : timeLabel(first, referenceMinutes),
      endTime: last < 0 ? vehicle.arrivalTime : timeLabel(last + 1, referenceMinutes),
      powerKw: first < 0 ? 0 : Math.max(...plan.slice(first, last + 1).map((current) => powerFromCurrent(current as number))),
      energyKwh: Math.round(energyKwh * 100) / 100,
    });
  }
  const optimizedPeakDemand = Math.max(...demandSlots);
  const peakReductionKw = baseline.peakDemand - optimizedPeakDemand;
  const hourlyDemandCurve = Array.from({ length: 24 }, (_, hour) => {
    const demand = Math.max(...demandSlots.slice(hour * 4, hour * 4 + 4));
    const actualHour = Math.floor((referenceMinutes / 60 + hour) % 24);
    const rate = actualHour >= 17 && actualHour < 21 ? grid.tariffs.peak : (actualHour < 6 || actualHour >= 22 ? grid.tariffs.offPeak : grid.tariffs.normal);
    return { hour: actualHour, timeLabel: `${String(actualHour).padStart(2, '0')}:00`, uncontrolledKw: baseline.hourlyDemandCurve[actualHour].uncontrolledKw, optimizedKw: demand, capacityLimitKw: grid.siteCapacity, warningLimitKw: Math.round(grid.siteCapacity * grid.warningThresholdPercent / 100), isPeakTariff: actualHour >= 17 && actualHour < 21, tariffRate: rate };
  });
  let energyCost: number | null = 0;
  hourlyDemandCurve.forEach((point, index) => {
    energyCost! += demandSlots.slice(index * 4, index * 4 + 4).reduce((sum, demand) => sum + (demand - grid.baseLoad) * 0.25, 0) * point.tariffRate;
  });
  energyCost = Math.round(Math.max(0, energyCost) * 100) / 100;
  const uncontrolledCost = baseline.electricityCost;
  const costSavings = uncontrolledCost - energyCost;
  return {
    id: `JAVA-${new Date().toISOString()}`,
    timestamp: new Date().toISOString(),
    solvedInSeconds: null,
    optimizedPeakDemand,
    uncontrolledPeakDemand: baseline.peakDemand,
    peakReductionKw,
    peakReductionPercent: Math.round((peakReductionKw / baseline.peakDemand) * 100),
    energyCost,
    uncontrolledCost,
    costSavings,
    costSavingsPercent: uncontrolledCost > 0 ? Math.round((costSavings / uncontrolledCost) * 1000) / 10 : null,
    vehiclesReady: readiness.filter((item) => item.readinessStatus === 'READY').length,
    totalVehicles: vehicles.length,
    gridHeadroom: grid.siteCapacity - optimizedPeakDemand,
    siteCapacity: grid.siteCapacity,
    shifts: schedules.map((schedule) => {
      const vehicle = vehicles.find((item) => item.id === schedule.vehicleId)!;
      return { vehicleId: vehicle.id, route: vehicle.route, priority: vehicle.routePriority, prevStart: vehicle.arrivalTime, optimizedStart: schedule.startTime, departure: vehicle.departureTime, shiftDelta: 'Java optimizer', status: 'UNCHANGED', reason: 'Returned by Java optimizer.' };
    }),
    readiness,
    constraintChecks: [{ name: 'Java optimizer response', description: 'Charging plans returned for every approved vehicle.', passed: true }],
    explanationPoints: ['Schedule returned by the Java smart charging optimizer.'],
    hourlyDemandCurve,
    backendSource: 'live',
    vehicleSchedules: schedules,
  };
};
