import { BaselineResult } from '../types/scenario';
import { Scenario } from '../types/scenario';

const minutes = (time: string) => {
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
};
const label = (minute: number) => `${String(Math.floor((minute % 1440) / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;

/** Earliest-possible, 15-minute baseline schedule. It is intentionally independent of the optimizer. */
export const calculateBaseline = (scenario: Scenario): BaselineResult => {
  const slots = Array.from({ length: 96 }, () => scenario.gridConfiguration.baseLoad);
  const availableAt = new Map(scenario.chargers.filter((c) => c.status === 'Available' || c.status === 'Ready' || c.status === 'Standby').map((c) => [c.id, 0]));
  const schedules: BaselineResult['schedules'] = [];
  const readiness: BaselineResult['readiness'] = [];
  const byUrgency = [...scenario.vehicles].sort((a, b) => minutes(a.departureTime) - minutes(b.departureTime));

  for (const vehicle of byUrgency) {
    const arrival = minutes(vehicle.arrivalTime);
    let departure = minutes(vehicle.departureTime);
    if (departure <= arrival) departure += 1440;
    let selected: string | undefined;
    let start = Infinity;
    for (const [chargerId, freeAt] of availableAt) {
      const candidate = Math.max(arrival, freeAt);
      if (candidate < start) { start = candidate; selected = chargerId; }
    }
    if (!selected) {
      readiness.push({ vehicleId: vehicle.id, currentSOC: vehicle.currentSOC, targetSOC: vehicle.targetSOC, requiredEnergy: vehicle.requiredEnergy, estimatedReadyTime: vehicle.departureTime, departureTime: vehicle.departureTime, bufferSlackMinutes: -1, readinessStatus: 'AT RISK' });
      continue;
    }
    const charger = scenario.chargers.find((c) => c.id === selected)!;
    const power = Math.min(charger.maxPower, vehicle.maxChargingPower);
    const duration = Math.ceil((vehicle.requiredEnergy / power) * 60 / 15) * 15;
    const end = start + duration;
    availableAt.set(selected, end);
    for (let point = start; point < end; point += 15) slots[Math.floor((point % 1440) / 15)] += power;
    const ready = end <= departure;
    schedules.push({ vehicleId: vehicle.id, chargerId: selected, startTime: label(start), endTime: label(end), powerKw: power, energyKwh: vehicle.requiredEnergy });
    readiness.push({ vehicleId: vehicle.id, currentSOC: vehicle.currentSOC, targetSOC: vehicle.targetSOC, requiredEnergy: vehicle.requiredEnergy, estimatedReadyTime: label(end), departureTime: vehicle.departureTime, bufferSlackMinutes: departure - end, readinessStatus: ready ? 'READY' : 'AT RISK' });
  }
  let electricityCost = 0;
  let peakPeriodEnergy = 0;
  const hourlyDemandCurve = Array.from({ length: 24 }, (_, hour) => {
    const demand = Math.max(...slots.slice(hour * 4, hour * 4 + 4));
    const rate = hour >= 17 && hour < 21 ? scenario.tariffConfiguration.peak : (hour < 6 || hour >= 22 ? scenario.tariffConfiguration.offPeak : scenario.tariffConfiguration.normal);
    const energy = slots.slice(hour * 4, hour * 4 + 4).reduce((sum, kw) => sum + kw * 0.25, 0);
    electricityCost += energy * rate;
    if (hour >= 17 && hour < 21) peakPeriodEnergy += energy;
    return { hour, timeLabel: `${String(hour).padStart(2, '0')}:00`, uncontrolledKw: demand, optimizedKw: demand, capacityLimitKw: scenario.gridConfiguration.siteCapacity, warningLimitKw: Math.round(scenario.gridConfiguration.siteCapacity * scenario.gridConfiguration.warningThresholdPercent / 100), isPeakTariff: hour >= 17 && hour < 21, tariffRate: rate };
  });
  return { peakDemand: Math.max(...slots), energyConsumption: schedules.reduce((sum, item) => sum + item.energyKwh, 0), electricityCost: Math.round(electricityCost * 100) / 100, peakPeriodEnergy: Math.round(peakPeriodEnergy * 100) / 100, vehiclesReady: readiness.filter((item) => item.readinessStatus === 'READY').length, totalVehicles: scenario.vehicles.length, hourlyDemandCurve, readiness, schedules };
};
