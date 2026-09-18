import React, { useState, useMemo } from 'react';
import { useGridCharge } from '../context/GridChargeContext';
import { OptimizationService } from '../services/optimizationService';

type ScenarioPreset = 'baseline' | 'peak-shaving' | 'delayed-arrival' | 'charger-outage' | 'tariff-spike';

export const Simulation: React.FC = () => {
  const { simulationParams, updateSimulationParams, showToast, setCurrentView } = useGridCharge();

  const [activeScenario, setActiveScenario] = useState<ScenarioPreset>('baseline');
  const [fleetSize, setFleetSize] = useState<number>(27);
  const [gridCapacity, setGridCapacity] = useState<number>(500);
  const [arrivalDelayMins, setArrivalDelayMins] = useState<number>(0);
  const [offlineChargersCount, setOfflineChargersCount] = useState<number>(0);
  const [avgInitialSoc, setAvgInitialSoc] = useState<number>(45);
  const [targetSoc, setTargetSoc] = useState<number>(90);
  const [peakTariff, setPeakTariff] = useState<number>(11.5);
  const [criticalCount, setCriticalCount] = useState<number>(3);
  const [isComparingBaseline, setIsComparingBaseline] = useState<boolean>(true);

  const applyPreset = (preset: ScenarioPreset) => {
    setActiveScenario(preset);
    switch (preset) {
      case 'baseline':
        setFleetSize(27);
        setGridCapacity(500);
        setArrivalDelayMins(0);
        setOfflineChargersCount(0);
        setAvgInitialSoc(45);
        setTargetSoc(90);
        setPeakTariff(11.5);
        setCriticalCount(3);
        showToast('Loaded Baseline Standard Schedule scenario.');
        break;
      case 'peak-shaving':
        setFleetSize(27);
        setGridCapacity(420);
        setArrivalDelayMins(0);
        setOfflineChargersCount(0);
        setAvgInitialSoc(45);
        setTargetSoc(90);
        setPeakTariff(11.5);
        setCriticalCount(3);
        showToast('Loaded Peak Shaving Priority: Hard cap coincident load to 420 kW.');
        break;
      case 'delayed-arrival':
        setFleetSize(27);
        setGridCapacity(500);
        setArrivalDelayMins(75); // +75m delay
        setOfflineChargersCount(0);
        setAvgInitialSoc(38);
        setTargetSoc(90);
        setPeakTariff(11.5);
        setCriticalCount(5);
        showToast('Loaded Delayed Fleet Arrival (+75m shift, compressed overnight window).');
        break;
      case 'charger-outage':
        setFleetSize(27);
        setGridCapacity(500);
        setArrivalDelayMins(0);
        setOfflineChargersCount(2); // 2 bays offline
        setAvgInitialSoc(45);
        setTargetSoc(90);
        setPeakTariff(11.5);
        setCriticalCount(4);
        showToast('Loaded Charger Outage: 2 bays offline in Bay Cluster B.');
        break;
      case 'tariff-spike':
        setFleetSize(27);
        setGridCapacity(400); // 400 kW grid curtailment
        setArrivalDelayMins(0);
        setOfflineChargersCount(0);
        setAvgInitialSoc(45);
        setTargetSoc(90);
        setPeakTariff(16.5); // Peak tariff surge
        setCriticalCount(3);
        showToast('Loaded Tariff Spike & Grid Curtailment: 400 kW limit, ₹16.50/kWh peak.');
        break;
    }
  };

  // Baseline calculation (fixed reference)
  const baselineResult = useMemo(() => {
    return OptimizationService.runSimulation({
      scenarioName: 'Baseline Standard',
      fleetSize: 27,
      chargerCount: 12,
      gridCapacity: 500,
      avgInitialSoc: 45,
      targetSoc: 90,
      arrivalWindow: '18:00',
      departureWindow: '06:00',
      priorityDistribution: { critical: 3, high: 8, normal: 16 },
      tariffs: { offPeak: 4.2, normal: 6.8, peak: 11.5 },
    });
  }, []);

  // Active scenario calculation
  const simResult = useMemo(() => {
    const availableChargers = Math.max(4, 12 - offlineChargersCount);
    const base = OptimizationService.runSimulation({
      scenarioName: activeScenario,
      fleetSize,
      chargerCount: availableChargers,
      gridCapacity,
      avgInitialSoc,
      targetSoc,
      arrivalWindow: arrivalDelayMins > 0 ? `19:${arrivalDelayMins}` : '18:00',
      departureWindow: '06:00',
      priorityDistribution: {
        critical: criticalCount,
        high: Math.round(fleetSize * 0.3),
        normal: Math.max(0, fleetSize - criticalCount - Math.round(fleetSize * 0.3)),
      },
      tariffs: {
        offPeak: 4.2,
        normal: 6.8,
        peak: peakTariff,
      },
    });

    // Determine Feasibility Verdict
    let verdict: 'FEASIBLE' | 'AT RISK' | 'INFEASIBLE' = 'FEASIBLE';
    let readinessPercent = 100;

    if (base.optimizedPeak > gridCapacity) {
      verdict = 'INFEASIBLE';
      readinessPercent = 78;
    } else if (arrivalDelayMins > 60 || offlineChargersCount >= 2 || gridCapacity <= 420) {
      verdict = 'AT RISK';
      readinessPercent = 92;
    } else {
      verdict = 'FEASIBLE';
      readinessPercent = 100;
    }

    const costDelta = base.optimizedCost - baselineResult.optimizedCost;
    const peakDelta = base.optimizedPeak - baselineResult.optimizedPeak;

    return {
      ...base,
      verdict,
      readinessPercent,
      costDelta,
      peakDelta,
    };
  }, [
    activeScenario,
    fleetSize,
    offlineChargersCount,
    gridCapacity,
    avgInitialSoc,
    targetSoc,
    arrivalDelayMins,
    criticalCount,
    peakTariff,
    baselineResult,
  ]);

  const handleApplyAsActiveSchedule = () => {
    updateSimulationParams({
      fleetSize,
      gridCapacity,
      avgInitialSoc,
      targetSoc,
      priorityDistribution: {
        critical: criticalCount,
        high: Math.round(fleetSize * 0.3),
        normal: Math.max(0, fleetSize - criticalCount - Math.round(fleetSize * 0.3)),
      },
      tariffs: {
        offPeak: 4.2,
        normal: 6.8,
        peak: peakTariff,
      },
    });
    showToast(`Applied "${activeScenario}" scenario as the active depot charging schedule.`);
    setCurrentView('charging-schedule');
  };

  const getVerdictBadge = () => {
    switch (simResult.verdict) {
      case 'FEASIBLE':
        return (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#006c4a] text-white flex items-center justify-center font-bold text-[18px]">
                ✓
              </span>
              <div>
                <div className="font-bold text-[14px] uppercase tracking-wide text-[#005137]">
                  FEASIBLE • ALL DEPARTURE CONSTRAINTS SATISFIED
                </div>
                <div className="text-[12px] text-emerald-800">
                  Peak load ({simResult.optimizedPeak} kW) remains safely under the {gridCapacity} kW limit with {simResult.gridHeadroom} kW headroom. 100% on-time departure.
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded bg-[#006c4a] text-white font-mono text-[12px] font-bold">
              VERDICT: FEASIBLE
            </span>
          </div>
        );
      case 'AT RISK':
        return (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-[18px]">
                !
              </span>
              <div>
                <div className="font-bold text-[14px] uppercase tracking-wide text-amber-900">
                  AT RISK • COMPRESSED CHARGE WINDOW / CONTINGENCY ENGAGED
                </div>
                <div className="text-[12px] text-amber-800">
                  2 vehicles may finish within 15 mins of departure. Power capped at {simResult.optimizedPeak} kW. Minor schedule vulnerability detected.
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded bg-amber-600 text-white font-mono text-[12px] font-bold">
              VERDICT: AT RISK
            </span>
          </div>
        );
      case 'INFEASIBLE':
        return (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-950 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center font-bold text-[18px]">
                ✕
              </span>
              <div>
                <div className="font-bold text-[14px] uppercase tracking-wide text-[#ba1a1a]">
                  INFEASIBLE • GRID CAPACITY BREACH PREDICTED
                </div>
                <div className="text-[12px] text-red-800">
                  Peak requirement ({simResult.optimizedPeak} kW) exceeds the {gridCapacity} kW limit by {simResult.optimizedPeak - gridCapacity} kW. Departure targets will fail unless curtailed.
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded bg-[#ba1a1a] text-white font-mono text-[12px] font-bold">
              VERDICT: INFEASIBLE
            </span>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col w-full gap-4">
      {/* 1. TOP HEADER SUB-BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex flex-col">
          <h1 className="text-[20px] font-bold text-[#00163d] tracking-tight">Simulation & What-If</h1>
          <p className="text-[12px] text-[#44464f]">
            Evaluate schedule resilience under operational disruptions, tariff adjustments, and demand constraints.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsComparingBaseline(!isComparingBaseline)}
            className={`inline-flex items-center gap-1.5 px-3 h-8.5 rounded-md text-[12px] font-medium shadow-2xs transition-colors border cursor-pointer ${
              isComparingBaseline
                ? 'bg-[#dce9ff] text-[#00163d] border-blue-300 font-bold'
                : 'bg-white text-[#00163d] border-[#c4c6d0]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">compare_arrows</span>
            <span>{isComparingBaseline ? 'Hide Baseline Compare' : 'Compare to Baseline'}</span>
          </button>
          <button
            onClick={handleApplyAsActiveSchedule}
            className="inline-flex items-center gap-1.5 px-3.5 h-8.5 rounded-md bg-[#00163d] text-white text-[12px] font-semibold hover:bg-[#0f2b5c] transition-colors shadow-xs cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-[#85f8c4]">check_circle</span>
            <span>Apply Scenario as Active Schedule</span>
          </button>
        </div>
      </div>

      {/* 2. FIVE REQUIRED PRESET SCENARIOS STRIP */}
      <div className="p-3 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#747780]">
            Operational Disruption Scenarios
          </span>
          <span className="text-[11px] text-[#44464f] font-mono">
            Active: <strong>{activeScenario.toUpperCase().replace('-', ' ')}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {/* Preset 1: Baseline */}
          <button
            onClick={() => applyPreset('baseline')}
            className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
              activeScenario === 'baseline'
                ? 'bg-[#00163d] text-white border-[#00163d] shadow-sm'
                : 'bg-[#eff4ff] hover:bg-blue-100 text-[#00163d] border-blue-100'
            }`}
            type="button"
          >
            <div className="text-[12px] font-bold flex items-center justify-between">
              <span>1. Baseline</span>
              <span className="material-symbols-outlined text-[15px]">check</span>
            </div>
            <div className={`text-[10px] mt-1 line-clamp-2 ${activeScenario === 'baseline' ? 'text-slate-300' : 'text-[#44464f]'}`}>
              Standard 27 EVs, 500 kW grid limit, nominal 18:00 shift.
            </div>
          </button>

          {/* Preset 2: Peak Shaving Priority */}
          <button
            onClick={() => applyPreset('peak-shaving')}
            className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
              activeScenario === 'peak-shaving'
                ? 'bg-[#00163d] text-white border-[#00163d] shadow-sm'
                : 'bg-[#eff4ff] hover:bg-blue-100 text-[#00163d] border-blue-100'
            }`}
            type="button"
          >
            <div className="text-[12px] font-bold flex items-center justify-between">
              <span>2. Peak Shaving</span>
              <span className="material-symbols-outlined text-[15px]">trending_down</span>
            </div>
            <div className={`text-[10px] mt-1 line-clamp-2 ${activeScenario === 'peak-shaving' ? 'text-slate-300' : 'text-[#44464f]'}`}>
              Hard cap coincident load to 420 kW, maximize overnight off-peak.
            </div>
          </button>

          {/* Preset 3: Delayed Fleet Arrival */}
          <button
            onClick={() => applyPreset('delayed-arrival')}
            className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
              activeScenario === 'delayed-arrival'
                ? 'bg-[#00163d] text-white border-[#00163d] shadow-sm'
                : 'bg-[#eff4ff] hover:bg-blue-100 text-[#00163d] border-blue-100'
            }`}
            type="button"
          >
            <div className="text-[12px] font-bold flex items-center justify-between">
              <span>3. Delayed Arrival</span>
              <span className="material-symbols-outlined text-[15px]">schedule</span>
            </div>
            <div className={`text-[10px] mt-1 line-clamp-2 ${activeScenario === 'delayed-arrival' ? 'text-slate-300' : 'text-[#44464f]'}`}>
              +75m route delay compresses depot turnaround window.
            </div>
          </button>

          {/* Preset 4: Charger Outage */}
          <button
            onClick={() => applyPreset('delayed-arrival')}
            className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
              activeScenario === 'charger-outage'
                ? 'bg-[#00163d] text-white border-[#00163d] shadow-sm'
                : 'bg-[#eff4ff] hover:bg-blue-100 text-[#00163d] border-blue-100'
            }`}
            type="button"
          >
            <div className="text-[12px] font-bold flex items-center justify-between">
              <span>4. Charger Outage</span>
              <span className="material-symbols-outlined text-[15px]">build</span>
            </div>
            <div className={`text-[10px] mt-1 line-clamp-2 ${activeScenario === 'charger-outage' ? 'text-slate-300' : 'text-[#44464f]'}`}>
              2 bays offline in Bay Cluster B (10 bays operating).
            </div>
          </button>

          {/* Preset 5: Tariff Spike / Grid Curtailment */}
          <button
            onClick={() => applyPreset('tariff-spike')}
            className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
              activeScenario === 'tariff-spike'
                ? 'bg-[#00163d] text-white border-[#00163d] shadow-sm'
                : 'bg-[#eff4ff] hover:bg-blue-100 text-[#00163d] border-blue-100'
            }`}
            type="button"
          >
            <div className="text-[12px] font-bold flex items-center justify-between">
              <span>5. Tariff Spike</span>
              <span className="material-symbols-outlined text-[15px]">electric_bolt</span>
            </div>
            <div className={`text-[10px] mt-1 line-clamp-2 ${activeScenario === 'tariff-spike' ? 'text-slate-300' : 'text-[#44464f]'}`}>
              ₹16.50/kWh peak tariff surge & 400 kW feeder curtailment.
            </div>
          </button>
        </div>
      </div>

      {/* 3. FEASIBILITY VERDICT BANNER */}
      {getVerdictBadge()}

      {/* 4. FOUR CORE IMPACT OUTPUT METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Departure Readiness Impact */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#747780] font-semibold">
              Departure Readiness
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#00163d]">verified</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-mono font-bold text-[#00163d]">
              {simResult.readinessPercent}%
            </span>
            <span className="text-[11px] text-[#44464f]">On-Time Target</span>
          </div>
          <div className="text-[11px] text-[#006c4a] font-bold mt-1 truncate">
            {simResult.vehiclesReady} of {fleetSize} fleet vans fully ready
          </div>
        </div>

        {/* Peak Load Impact & Breach Risk */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#747780] font-semibold">
              Peak Coincident Load
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#00163d]">electric_meter</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-mono font-bold text-[#00163d]">
              {simResult.optimizedPeak} kW
            </span>
            <span className={`text-[11px] font-bold ${simResult.optimizedPeak > gridCapacity ? 'text-[#ba1a1a]' : 'text-[#006c4a]'}`}>
              {simResult.optimizedPeak > gridCapacity ? 'BREACH RISK' : 'Within Limit'}
            </span>
          </div>
          <div className="text-[11px] text-[#44464f] mt-1 truncate">
            Limit: {gridCapacity} kW • Headroom: {simResult.gridHeadroom} kW
          </div>
        </div>

        {/* Total Cost Impact */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#747780] font-semibold">
              Total Energy Cost
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#006c4a]">currency_rupee</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-mono font-bold text-[#006c4a]">
              ₹{simResult.optimizedCost.toLocaleString('en-IN')}
            </span>
            {isComparingBaseline && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold font-mono ${
                simResult.costDelta <= 0 ? 'bg-[#85f8c4]/30 text-[#005137]' : 'bg-[#ffdad6] text-[#ba1a1a]'
              }`}>
                {simResult.costDelta <= 0 ? '' : '+'}₹{simResult.costDelta.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#44464f] mt-1 truncate">
            Baseline: ₹{baselineResult.optimizedCost.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Demand Penalty Risk */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#747780] font-semibold">
              Demand Penalty Surcharge
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#ba1a1a]">warning</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-mono font-bold text-[#00163d]">
              {simResult.optimizedPeak > gridCapacity ? `₹${((simResult.optimizedPeak - gridCapacity) * 450).toLocaleString('en-IN')}` : '₹0'}
            </span>
            <span className="text-[11px] text-[#44464f]">Penalty Surcharge</span>
          </div>
          <div className="text-[11px] text-[#006c4a] font-bold mt-1 truncate">
            {simResult.optimizedPeak <= gridCapacity ? 'Zero penalty incurred' : 'Breach threshold exceeded'}
          </div>
        </div>
      </div>

      {/* 5. MAIN SPLIT: PARAMETERS ADJUSTMENT (COL-SPAN-5) & BASELINE COMPARISON (COL-SPAN-7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT: INTERACTIVE CONTROLS */}
        <div className="lg:col-span-5 flex flex-col rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs p-4 gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-[14px] font-bold text-[#00163d] uppercase tracking-wider">
              Disruption & Scenario Variables
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 font-bold font-mono">
              Live Tuning
            </span>
          </div>

          {/* Grid Feeder Limit Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[12px]">
              <span className="font-semibold text-[#00163d]">Feeder Demand Limit (kW)</span>
              <span className="font-mono font-bold text-[#00163d] bg-[#eff4ff] px-2 py-0.5 rounded">
                {gridCapacity} kW
              </span>
            </div>
            <input
              type="range"
              min="300"
              max="600"
              step="10"
              value={gridCapacity}
              onChange={(e) => setGridCapacity(Number(e.target.value))}
              className="w-full accent-[#00163d]"
            />
            <div className="flex justify-between text-[10px] text-[#747780] font-mono">
              <span>300 kW (Deep Curtailment)</span>
              <span>500 kW Standard</span>
              <span>600 kW Physical Max</span>
            </div>
          </div>

          {/* Fleet Arrival Delay Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[12px]">
              <span className="font-semibold text-[#00163d]">Fleet Arrival Delay</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                arrivalDelayMins > 0 ? 'bg-amber-100 text-amber-900' : 'bg-[#eff4ff] text-[#00163d]'
              }`}>
                {arrivalDelayMins === 0 ? 'On-Time (18:00)' : `+${arrivalDelayMins} mins Delay`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="15"
              value={arrivalDelayMins}
              onChange={(e) => setArrivalDelayMins(Number(e.target.value))}
              className="w-full accent-[#00163d]"
            />
            <div className="flex justify-between text-[10px] text-[#747780] font-mono">
              <span>0m (On Time)</span>
              <span>+60m Shift</span>
              <span>+120m Extreme Late</span>
            </div>
          </div>

          {/* Offline Chargers (Outage) Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[12px]">
              <span className="font-semibold text-[#00163d]">Offline / Faulted Bays</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                offlineChargersCount > 0 ? 'bg-red-100 text-red-900' : 'bg-[#eff4ff] text-[#00163d]'
              }`}>
                {offlineChargersCount} Bays Offline ({12 - offlineChargersCount} Operational)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="4"
              value={offlineChargersCount}
              onChange={(e) => setOfflineChargersCount(Number(e.target.value))}
              className="w-full accent-[#00163d]"
            />
            <div className="flex justify-between text-[10px] text-[#747780] font-mono">
              <span>0 (All 12 Online)</span>
              <span>1 Bay Down</span>
              <span>4 Bays Down</span>
            </div>
          </div>

          {/* Peak Tariff Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[12px]">
              <span className="font-semibold text-[#00163d]">Peak Tariff Rate (17:00–23:00)</span>
              <span className="font-mono font-bold text-[#ba1a1a] bg-[#ffdad6]/40 px-2 py-0.5 rounded">
                ₹{peakTariff.toFixed(2)} / kWh
              </span>
            </div>
            <input
              type="range"
              min="8.0"
              max="20.0"
              step="0.5"
              value={peakTariff}
              onChange={(e) => setPeakTariff(Number(e.target.value))}
              className="w-full accent-[#ba1a1a]"
            />
            <div className="flex justify-between text-[10px] text-[#747780] font-mono">
              <span>₹8.00</span>
              <span>Base: ₹11.50</span>
              <span>₹20.00 Spike</span>
            </div>
          </div>
        </div>

        {/* RIGHT: BASELINE COMPARISON & COINCIDENT LOAD CURVE (COL-SPAN-7) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-[14px] font-bold text-[#00163d] uppercase tracking-wider">
                Scenario Comparison: Baseline vs. Active Simulation
              </h3>
              <span className="font-mono text-[11px] text-[#44464f]">24-Hour Coincident Demand Profile</span>
            </div>

            <div className="flex flex-col gap-3 mt-1">
              {/* Baseline Load Bar */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#44464f] mb-1">
                  <span>Baseline Standard Schedule</span>
                  <span className="font-mono font-bold text-[#00163d]">
                    {baselineResult.optimizedPeak} kW Peak • ₹{baselineResult.optimizedCost.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="relative w-full h-6 rounded-md bg-[#e5eeff] overflow-hidden p-1 flex items-center">
                  <div
                    className="h-full rounded bg-[#00163d]/70 text-white font-mono text-[9px] font-bold flex items-center px-2"
                    style={{ width: `${(baselineResult.optimizedPeak / 600) * 100}%` }}
                  >
                    {baselineResult.optimizedPeak} kW
                  </div>
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-600 z-10"
                    style={{ left: `${(gridCapacity / 600) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Active Simulated Scenario Load Bar */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#44464f] mb-1">
                  <span className="font-bold text-[#00163d]">
                    Active Scenario ({activeScenario.toUpperCase().replace('-', ' ')})
                  </span>
                  <span className="font-mono font-bold text-[#006c4a]">
                    {simResult.optimizedPeak} kW Peak • ₹{simResult.optimizedCost.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="relative w-full h-6 rounded-md bg-[#e5eeff] overflow-hidden p-1 flex items-center">
                  <div
                    className={`h-full rounded font-mono text-[9px] font-bold flex items-center px-2 text-white ${
                      simResult.optimizedPeak > gridCapacity ? 'bg-[#ba1a1a]' : 'bg-[#00163d]'
                    }`}
                    style={{ width: `${Math.min(100, (simResult.optimizedPeak / 600) * 100)}%` }}
                  >
                    {simResult.optimizedPeak} kW ({simResult.optimizedPeak > gridCapacity ? 'BREACH' : 'OK'})
                  </div>
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-600 z-10"
                    style={{ left: `${(gridCapacity / 600) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-[#44464f]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-amber-600 rounded-xs"></span>
                <span>Amber vertical marker: <strong>{gridCapacity} kW Demand Ceiling</strong></span>
              </span>
              <span className="font-mono text-[#006c4a] font-bold">
                {simResult.gridHeadroom} kW dynamic headroom
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
