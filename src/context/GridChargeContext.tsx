import React, { createContext, useContext, useState } from 'react';
import { Vehicle, Charger, GridConfiguration, OptimizationResultData, PageView, LanguageCode, OperationalAlert, HistoricalDayRecord, SimulationParameters } from '../types';
import { initialVehicles, initialChargers, initialGridConfig, initialSimulationParams, presetExpressFleet, presetOverloadFleet } from '../data/initialData';
import { BaselineResult, OptimizationStatus, Scenario, ScenarioDocument, ValidationIssue, ExtractionResult, ExtractedVehicleSchedule } from '../types/scenario';
import { calculateBaseline } from '../services/baselineService';
import { OptimizationEngineError } from '../services/optimizerContract';
import { OptimizationService } from '../services/optimizationService';
import { validateSchedule } from '../services/scenarioValidationService';
import { translations, Translations } from '../i18n/translations';

interface GridChargeContextType {
  currentView: PageView; setCurrentView: (view: PageView) => void; language: LanguageCode; setLanguage: (lang: LanguageCode) => void; t: Translations;
  vehicles: Vehicle[]; chargers: Charger[]; gridConfig: GridConfiguration; scenario: Scenario; sourceDocument: ScenarioDocument | null; validationIssues: ValidationIssue[];
  optimizationStatus: OptimizationStatus; optimizationError: string | null; optimizationResult: OptimizationResultData | null; baselineResult: BaselineResult | null; extractionResult: ExtractionResult | null; approvedSchedule: ExtractedVehicleSchedule[] | null; setExtractionResult: (result: ExtractionResult | null) => void; approveExtractedSchedule: (rows: ExtractedVehicleSchedule[]) => void; isOptimizing: boolean;
  alerts: OperationalAlert[]; historicalDays: HistoricalDayRecord[]; simulationParams: SimulationParameters; selectedVehicleId: string; setSelectedVehicleId: (id: string) => void; selectedChargerId: string; setSelectedChargerId: (id: string) => void;
  toastMessage: string | null; showToast: (msg: string) => void; hideToast: () => void; addVehicle: (vehicle: Vehicle) => void; updateVehicle: (id: string, updates: Partial<Vehicle>) => void; deleteVehicle: (id: string) => void; setCustomFleet: (newVehicles: Vehicle[]) => void; loadPresetFleet: (presetName: 'default' | 'express' | 'overload') => void; activePreset: 'default' | 'express' | 'overload'; addCharger: (charger: Charger) => void; runOptimization: (stayOnCurrentView?: boolean) => Promise<void>; applySchedule: () => void; updateGridConfig: (config: Partial<GridConfiguration>) => void; updateSimulationParams: (params: Partial<SimulationParameters>) => void; apiBaseUrl: string; setApiBaseUrl: (url: string) => void;
}
const GridChargeContext = createContext<GridChargeContextType | undefined>(undefined);
const scenarioFrom = (vehicles: Vehicle[], chargers: Charger[], gridConfiguration: GridConfiguration, result: OptimizationResultData | null = null, status: OptimizationStatus = 'NOT_RUN'): Scenario => ({ id: 'scenario-active', name: 'Active depot scenario', source: 'DEMO_INPUT', sourceDocument: null, vehicles, chargers, gridConfiguration, tariffConfiguration: gridConfiguration.tariffs, validationStatus: 'NOT_VALIDATED', optimizationStatus: status, optimizationResult: result, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

export const GridChargeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<PageView>('dashboard'); const [language, setLanguage] = useState<LanguageCode>('en'); const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles); const [chargers, setChargers] = useState<Charger[]>(initialChargers); const [gridConfig, setGridConfig] = useState<GridConfiguration>(initialGridConfig);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResultData | null>(null); const [optimizationStatus, setOptimizationStatus] = useState<OptimizationStatus>('NOT_RUN'); const [optimizationError, setOptimizationError] = useState<string | null>(null); const [baselineResult, setBaselineResult] = useState<BaselineResult | null>(null); const [scenario, setScenario] = useState<Scenario>(() => scenarioFrom(initialVehicles, initialChargers, initialGridConfig));
  const [sourceDocument, setSourceDocument] = useState<ScenarioDocument | null>(null); const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]); const [extractionResult, setExtractionResultState] = useState<ExtractionResult | null>(null); const [approvedSchedule, setApprovedSchedule] = useState<ExtractedVehicleSchedule[] | null>(null); const [activePreset, setActivePreset] = useState<'default' | 'express' | 'overload'>('default'); const [alerts, setAlerts] = useState<OperationalAlert[]>([]); const [historicalDays] = useState<HistoricalDayRecord[]>([]); const [simulationParams, setSimulationParams] = useState<SimulationParameters>(initialSimulationParams); const [selectedVehicleId, setSelectedVehicleId] = useState('EV-002'); const [selectedChargerId, setSelectedChargerId] = useState('CS-08'); const [toastMessage, setToastMessage] = useState<string | null>(null); const [apiBaseUrl, setApiBaseUrlState] = useState(OptimizationService.getApiBaseUrl());
  const t = translations[language] || translations.en;
  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 4000); };
  const invalidate = (nextVehicles: Vehicle[], nextChargers: Charger[], nextGrid: GridConfiguration) => { setOptimizationResult(null); setBaselineResult(null); setOptimizationStatus('NOT_RUN'); setOptimizationError(null); setScenario(scenarioFrom(nextVehicles, nextChargers, nextGrid)); };
  const addVehicle = (v: Vehicle) => setVehicles((previous) => { const next = [v, ...previous]; invalidate(next, chargers, gridConfig); return next; });
  const updateVehicle = (id: string, updates: Partial<Vehicle>) => setVehicles((previous) => { const next = previous.map((v) => v.id === id ? { ...v, ...updates } : v); invalidate(next, chargers, gridConfig); return next; });
  const deleteVehicle = (id: string) => setVehicles((previous) => { const next = previous.filter((v) => v.id !== id); invalidate(next, chargers, gridConfig); return next; });
  const setCustomFleet = (next: Vehicle[]) => { setVehicles(next); invalidate(next, chargers, gridConfig); showToast(`Fleet updated: ${next.length} vehicles loaded.`); };
  const loadPresetFleet = (preset: 'default' | 'express' | 'overload') => { const next = preset === 'express' ? presetExpressFleet : preset === 'overload' ? presetOverloadFleet : initialVehicles; setActivePreset(preset); setVehicles(next); invalidate(next, chargers, gridConfig); };
  const addCharger = (c: Charger) => setChargers((previous) => { const next = [...previous, c]; invalidate(vehicles, next, gridConfig); return next; });
  const updateGridConfig = (changes: Partial<GridConfiguration>) => setGridConfig((previous) => { const next = { ...previous, ...changes }; next.availableHeadroom = next.siteCapacity - next.currentDemand; next.utilizationPercent = Math.round(next.currentDemand / next.siteCapacity * 1000) / 10; invalidate(vehicles, chargers, next); return next; });
  const runOptimization = async (stayOnCurrentView = true) => {
    if (!approvedSchedule) {
      setOptimizationStatus('FAILED');
      setOptimizationError('Approve an imported vehicle schedule before running optimization.');
      showToast('Approve an imported vehicle schedule before running optimization.');
      return;
    }
    const input: Scenario = { ...scenario, vehicles, chargers, gridConfiguration: gridConfig, tariffConfiguration: gridConfig.tariffs, updatedAt: new Date().toISOString() };
    const baseline = calculateBaseline(input);
    setScenario({ ...input, optimizationStatus: 'RUNNING' });
    setOptimizationStatus('RUNNING');
    setOptimizationError(null);
    setBaselineResult(baseline);
    try {
      const result = await OptimizationService.runOptimization(vehicles, chargers, gridConfig, baseline);
      setOptimizationResult(result);
      setOptimizationStatus('SUCCESS');
      setScenario({ ...input, optimizationStatus: 'SUCCESS', optimizationResult: result });
      if (!stayOnCurrentView) setCurrentView('optimization-result');
      showToast('Optimization complete.');
    } catch (error) {
      const engineError = error instanceof OptimizationEngineError ? error : new OptimizationEngineError('Optimization engine unavailable.', 'UNAVAILABLE');
      setOptimizationStatus(engineError.code);
      setOptimizationError(engineError.message);
      setScenario({ ...input, optimizationStatus: engineError.code, optimizationResult: null });
      showToast(engineError.message);
    }
  };
  const applySchedule = () => { if (!optimizationResult) { showToast('Run a successful optimization before applying a schedule.'); return; } setCurrentView('charging-schedule'); };
  const setExtractionResult = (result: ExtractionResult | null) => { console.log('[PDF workflow] received extraction result:', result?.extractedRows.length ?? 0); setExtractionResultState(result); setSourceDocument(result?.sourceDocument || null); if (!result) { setValidationIssues([]); return; } const validation = validateSchedule(result.extractedRows); console.log('[PDF workflow] validation:', validation.validRows.length, validation.errors.length, validation.warnings.length); setValidationIssues([...validation.errors, ...validation.warnings]); };
  const approveExtractedSchedule = (rows: ExtractedVehicleSchedule[]) => { const next = rows.map((row) => ({ id: row.vehicleId!, model: row.model || 'Unspecified model', type: 'Commercial Cargo', route: row.route || 'Unspecified route', routePriority: row.priority!, currentSOC: row.currentSOC!, targetSOC: row.targetSOC!, batteryCapacity: row.batteryCapacityKwh!, requiredEnergy: row.requiredEnergyKwh!, arrivalTime: row.arrivalTime!, departureTime: row.departureTime!, maxChargingPower: row.maxPowerKw!, chargingStatus: 'Scheduled' as const, currentPower: 0 })); setVehicles(next); setApprovedSchedule(rows); setValidationIssues([]); const nextScenario = scenarioFrom(next, chargers, gridConfig); nextScenario.source = 'PDF_SCHEDULE'; nextScenario.sourceDocument = sourceDocument; setScenario(nextScenario); setBaselineResult(calculateBaseline(nextScenario)); setOptimizationResult(null); setOptimizationStatus('NOT_RUN'); setOptimizationError(null); showToast(`${next.length} imported vehicles approved as the active scenario.`); };
  return <GridChargeContext.Provider value={{ currentView, setCurrentView, language, setLanguage, t, vehicles, chargers, gridConfig, scenario, sourceDocument, validationIssues, optimizationStatus, optimizationError, optimizationResult, baselineResult, extractionResult, approvedSchedule, setExtractionResult, approveExtractedSchedule, isOptimizing: optimizationStatus === 'RUNNING', alerts, historicalDays, simulationParams, selectedVehicleId, setSelectedVehicleId, selectedChargerId, setSelectedChargerId, toastMessage, showToast, hideToast: () => setToastMessage(null), addVehicle, updateVehicle, deleteVehicle, setCustomFleet, loadPresetFleet, activePreset, addCharger, runOptimization, applySchedule, updateGridConfig, updateSimulationParams: (params) => setSimulationParams((previous) => ({ ...previous, ...params })), apiBaseUrl, setApiBaseUrl: (url) => { OptimizationService.setApiBaseUrl(url); setApiBaseUrlState(OptimizationService.getApiBaseUrl()); } }}>{children}</GridChargeContext.Provider>;
};
export const useGridCharge = () => { const context = useContext(GridChargeContext); if (!context) throw new Error('useGridCharge must be used within a GridChargeProvider'); return context; };
