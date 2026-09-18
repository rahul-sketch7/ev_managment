import { Charger, GridConfiguration, OptimizationResultData, SimulationParameters, Vehicle } from '../types';
import { BaselineResult } from '../types/scenario';
import { OptimizationEngineError, parseOptimizerResponse } from './optimizerContract';

export class OptimizationService {
  private static apiBaseUrl = (((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_BASE_URL) || 'http://localhost:8081').replace(/\/+$/, '');
  public static getApiBaseUrl = () => this.apiBaseUrl;
  public static setApiBaseUrl = (url: string) => { this.apiBaseUrl = url.trim().replace(/\/+$/, ''); };

  public static async runOptimization(vehicles: Vehicle[], chargers: Charger[], grid: GridConfiguration, baseline: BaselineResult): Promise<OptimizationResultData> {
    const numericId = (value: string, fallback: number) => {
      const match = value.match(/\d+/);
      return match ? Number(match[0]) : fallback;
    };
    const minutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    const referenceMinutes = Math.min(...vehicles.map((vehicle) => minutes(vehicle.arrivalTime)));
    const arrivalSeconds = (time: string) => minutes(time) * 60;
    const currentTimeSeconds = referenceMinutes * 60;
    const departureSeconds = (vehicle: Vehicle) => {
      const arrival = arrivalSeconds(vehicle.arrivalTime);
      let departure = arrivalSeconds(vehicle.departureTime);
      if (departure <= arrival) departure = Math.min(86399, arrival + 15 * 60);
      return departure;
    };
    const toAmps = (powerKw: number, phases: number) => powerKw * 1000 / (230 * phases);
    const payload = {
      state: {
        currentTimeSeconds,
        chargingStations: chargers.map((charger, index) => {
          const phases = charger.phases || 3;
          const maxCurrentPerPhase = toAmps(charger.maxPower, phases);
          return {
            id: numericId(charger.id, index + 1),
            fusePhase1: maxCurrentPerPhase,
            fusePhase2: maxCurrentPerPhase,
            fusePhase3: maxCurrentPerPhase,
          };
        }),
        cars: vehicles.map((vehicle, index) => {
          const phases = vehicle.maxChargingPower > 11 ? 3 : 1;
          const maxCapacity = vehicle.batteryCapacity;
          return {
            id: numericId(vehicle.id, index + 1),
            name: vehicle.id,
            modelName: vehicle.model,
            carType: 'BEV',
            startCapacity: maxCapacity * vehicle.currentSOC / 100,
            timestampArrival: arrivalSeconds(vehicle.arrivalTime),
            timestampDeparture: departureSeconds(vehicle),
            maxCapacity,
            minCurrent: 0,
            minCurrentPerPhase: 0,
            maxCurrent: toAmps(vehicle.maxChargingPower, phases) * phases,
            maxCurrentPerPhase: toAmps(vehicle.maxChargingPower, phases),
            canLoadPhase1: 1,
            canLoadPhase2: phases > 1 ? 1 : 0,
            canLoadPhase3: phases > 2 ? 1 : 0,
            minLoadingState: maxCapacity * vehicle.targetSOC / 100,
            suspendable: true,
            canUseVariablePower: true,
            immediateStart: false,
          };
        }),
        maximumSiteLimitKW: grid.siteCapacity,
        energyPriceHistory: {
          energyPrices: Array.from({ length: 96 }, (_, slot) => {
            const hour = Math.floor((referenceMinutes / 60 + slot / 4) % 24);
            return hour >= 17 && hour < 21 ? grid.tariffs.peak : (hour < 6 || hour >= 22 ? grid.tariffs.offPeak : grid.tariffs.normal);
          }),
        },
        carAssignments: vehicles
          .filter((vehicle) => arrivalSeconds(vehicle.arrivalTime) <= currentTimeSeconds)
          .slice(0, chargers.length)
          .map((vehicle, index) => ({
          carID: numericId(vehicle.id, index + 1),
          chargingStationID: numericId(chargers[index].id, index + 1),
          })),
      },
      event: { eventType: 'Reoptimize' },
    };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/v1/OptimizeChargingProfiles`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
      if (!response.ok) {
        let detail = '';
        try {
          const errorBody = await response.json() as { message?: unknown; exceptionMessage?: unknown };
          const message = errorBody.message || errorBody.exceptionMessage;
          if (typeof message === 'string') detail = ` ${message}`;
        } catch {
          // Preserve the stable user-facing error when the server has no JSON detail.
        }
        throw new OptimizationEngineError(
          response.status >= 500 ? 'Optimization engine unavailable.' : `Invalid optimization response.${detail}`,
          response.status >= 500 ? 'UNAVAILABLE' : 'INVALID_RESPONSE'
        );
      }
      let data: unknown;
      try { data = await response.json(); } catch { throw new OptimizationEngineError('Invalid optimization response.', 'INVALID_RESPONSE'); }
      return parseOptimizerResponse(data, vehicles, chargers, grid, baseline);
    } catch (error) {
      if (error instanceof OptimizationEngineError) throw error;
      throw new OptimizationEngineError('Optimization engine unavailable.', 'UNAVAILABLE');
    } finally { clearTimeout(timeout); }
  }

  // Existing what-if screen helper. It does not represent an optimizer response.
  public static runSimulation(params: SimulationParameters) {
    const deficit = Math.max(5, params.targetSoc - params.avgInitialSoc);
    const energy = Math.round(params.fleetSize * deficit / 100 * 40);
    const uncontrolledPeak = Math.min(900, Math.round(200 + params.fleetSize * .7 * (params.priorityDistribution.critical > 5 ? 32 : 22)));
    const optimizedPeak = Math.min(Math.round(params.gridCapacity * .71), Math.max(280, Math.round(200 + params.fleetSize * .35 * 22)));
    const uncontrolledCost = Math.round(energy * params.tariffs.peak * .8 + 2200);
    const optimizedCost = Math.round(energy * (params.tariffs.offPeak * .6 + params.tariffs.normal * .3 + params.tariffs.peak * .1) + 1900);
    const savings = Math.max(0, uncontrolledCost - optimizedCost);
    return { uncontrolledPeak, optimizedPeak, peakReductionKw: Math.max(0, uncontrolledPeak - optimizedPeak), peakReductionPercent: Math.round(Math.max(0, uncontrolledPeak - optimizedPeak) / uncontrolledPeak * 100), uncontrolledCost, optimizedCost, costSavings: savings, costSavingsPercent: Math.round(savings / uncontrolledCost * 100), vehiclesReady: Math.min(params.fleetSize, Math.round(params.fleetSize * .89)), totalVehicles: params.fleetSize, gridHeadroom: Math.max(0, params.gridCapacity - optimizedPeak), gridUtilizationPercent: Math.min(100, Math.round(optimizedPeak / params.gridCapacity * 100)), totalEnergyRequiredKwh: energy };
  }
}
