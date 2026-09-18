import React, { useState } from 'react';
import { useGridCharge } from '../context/GridChargeContext';
import { downloadTextFile, toCsv } from '../services/exportService';

export const EnergyAndGrid: React.FC = () => {
  const { gridConfig, optimizationResult, baselineResult, updateGridConfig, showToast, setCurrentView } = useGridCharge();

  const [transformerCapacity, setTransformerCapacity] = useState<number>(600);
  const [contractedLimit, setContractedLimit] = useState<number>(500);
  const [discomName, setDiscomName] = useState<string>('Tata Power (Delhi Distribution)');
  const [connectionVoltage, setConnectionVoltage] = useState<string>('11 kV / 415 V');

  const [offPeakRate, setOffPeakRate] = useState<number>(4.20);
  const [normalRate, setNormalRate] = useState<number>(6.80);
  const [peakRate, setPeakRate] = useState<number>(11.50);
  const [penaltyRate, setPenaltyRate] = useState<number>(450); // ₹ / kW

  const [showEditTariffModal, setShowEditTariffModal] = useState<boolean>(false);
  const [isSimulatingTariff, setIsSimulatingTariff] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<{
    unoptimizedCost: number;
    optimizedCost: number;
    savingsInr: number;
    savingsPct: number;
    peakShavedKw: number;
  } | null>(null);

  // Current real-time operational stats
  const currentLoad = optimizationResult?.optimizedPeakDemand ?? null;
  const loadPctOfContract = currentLoad === null ? null : Math.round((currentLoad / contractedLimit) * 100);
  const loadPctOfTransformer = currentLoad === null ? null : Math.round((currentLoad / transformerCapacity) * 100);
  const headroomKw = currentLoad === null ? null : Math.max(0, contractedLimit - currentLoad);

  const handleSaveConfig = () => {
    updateGridConfig({
      siteCapacity: transformerCapacity,
      baseLoad: gridConfig.baseLoad,
      tariffs: {
        offPeak: offPeakRate,
        normal: normalRate,
        peak: peakRate,
      },
    });
    showToast('Grid connection and Time-of-Day tariff settings saved.');
  };

  const handleRunSimulation = () => {
    setSimulationResult(null);
    showToast('Run Smart Optimization to compare real baseline and optimized tariff results.');
  };

  // 24-hour tariff slots
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const getTariffTypeForHour = (h: number) => {
    if (h >= 23 || h < 6) return { type: 'Off-Peak', rate: offPeakRate, color: 'bg-[#006c4a]', lightColor: 'bg-emerald-50 text-emerald-800' };
    if (h >= 17 && h < 23) return { type: 'Peak', rate: peakRate, color: 'bg-[#ba1a1a]', lightColor: 'bg-red-50 text-red-800' };
    return { type: 'Normal', rate: normalRate, color: 'bg-[#00163d]', lightColor: 'bg-blue-50 text-blue-900' };
  };

  return (
    <div className="flex flex-col w-full gap-4">
      {/* 1. TOP HEADER SUB-BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex flex-col">
          <h1 className="text-[20px] font-bold text-[#00163d] tracking-tight">Grid & Tariffs</h1>
          <p className="text-[12px] text-[#44464f]">
            Grid connection constraints, time-of-day electricity tariffs, and peak demand thresholds.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              const curve = optimizationResult?.hourlyDemandCurve || baselineResult?.hourlyDemandCurve;
              const rows = curve
                ? curve.map((point) => ({ time: point.timeLabel, tariff: point.tariffRate, baselineKw: point.uncontrolledKw, optimizedKw: point.optimizedKw }))
                : Array.from({ length: 24 }, (_, hour) => {
                  const tariff = hour >= 17 && hour < 23 ? peakRate : (hour < 6 || hour >= 23 ? offPeakRate : normalRate);
                  return { time: `${String(hour).padStart(2, '0')}:00`, tariff, baselineKw: null, optimizedKw: null };
                });
              downloadTextFile('gridcharge-tariff-sheet.csv', toCsv(rows, ['time', 'tariff', 'baselineKw', 'optimizedKw']), 'text/csv;charset=utf-8');
              showToast('Tariff structure and load curves exported.');
            }}
            className="inline-flex items-center gap-1.5 px-3 h-8.5 rounded-md bg-white text-[#00163d] text-[12px] font-medium hover:bg-[#eff4ff] shadow-2xs transition-colors border border-[#c4c6d0] cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-[#747780]">download</span>
            <span>Export Tariff Sheet</span>
          </button>
          <button
            onClick={handleRunSimulation}
            disabled={isSimulatingTariff}
            className="inline-flex items-center gap-1.5 px-3.5 h-8.5 rounded-md bg-[#00163d] text-white text-[12px] font-semibold hover:bg-[#0f2b5c] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-[#85f8c4]">
              {isSimulatingTariff ? 'hourglass_top' : 'science'}
            </span>
            <span>{isSimulatingTariff ? 'Simulating...' : 'Run Tariff Simulation'}</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Substation Capacity */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#747780] font-semibold">
              Transformer Capacity
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#00163d]">offline_bolt</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-mono font-bold text-[#00163d]">{transformerCapacity}</span>
            <span className="text-[12px] text-[#44464f]">kW Physical Cap</span>
          </div>
          <div className="text-[11px] text-[#44464f] mt-1 truncate">11 kV / 415 V 750 kVA Step-Down</div>
        </div>

        {/* Contracted Peak Limit */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#747780] font-semibold">
              Contracted Demand Limit
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#00163d]">tune</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-mono font-bold text-[#00163d]">{contractedLimit}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 font-bold">
              {loadPctOfContract === null ? 'Not provided' : `${loadPctOfContract}% Utilized`}
            </span>
          </div>
          <div className="text-[11px] text-[#006c4a] font-bold mt-1 truncate">
            {headroomKw === null ? 'Not provided by optimization engine' : `${headroomKw} kW safe buffer available`}
          </div>
        </div>

        {/* Peak Shaved Estimate */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#747780] font-semibold">
              Peak Shaved Today
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#006c4a]">trending_down</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-mono font-bold text-[#006c4a]">{optimizationResult ? `${optimizationResult.peakReductionKw}` : 'Not provided'}</span>
            <span className="text-[12px] text-[#44464f]">kW Avoided</span>
          </div>
          <div className="text-[11px] text-[#44464f] mt-1 truncate">Via smart overnight charge shifting</div>
        </div>

        {/* Demand Penalty Avoided */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#747780] font-semibold">
              Penalty Avoided
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#006c4a]">savings</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-mono font-bold text-[#006c4a]">{optimizationResult?.costSavings === null || optimizationResult?.costSavings === undefined ? 'Not provided' : `₹${optimizationResult.costSavings.toLocaleString('en-IN')}`}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#85f8c4]/30 text-[#005137] font-bold">
              This Cycle
            </span>
          </div>
          <div className="text-[11px] text-[#44464f] mt-1 truncate">₹450/kW excess tariff zeroed</div>
        </div>
      </div>

      {/* 3. SIMULATION BANNER (if run) */}
      {simulationResult && (
        <div className="p-4 rounded-xl bg-[#00163d] text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[26px] text-[#85f8c4] shrink-0 mt-0.5">
              electric_bolt
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-white">Tariff Impact Simulation: 30.8% Energy Arbitrage</span>
                <span className="px-2 py-0.5 rounded bg-[#85f8c4] text-[#00163d] text-[10px] font-black uppercase">
                  Active Scenario
                </span>
              </div>
              <p className="text-[12px] text-slate-300 mt-1">
                Shifting 1,280 kWh from evening peak (₹11.50/kWh) into midnight off-peak (₹4.20/kWh) reduces daily energy expenditure from ₹28,450 to ₹19,680.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0 font-mono">
            <div className="text-right">
              <div className="text-[10px] uppercase text-slate-400">Daily Savings</div>
              <div className="text-[20px] font-bold text-[#85f8c4]">₹{simulationResult.savingsInr.toLocaleString('en-IN')}</div>
            </div>
            <button
              onClick={() => setCurrentView('charging-schedule')}
              className="px-3 py-1.5 rounded bg-white text-[#00163d] text-[12px] font-bold hover:bg-slate-100 cursor-pointer shadow-xs"
            >
              View Dispatch Plan
            </button>
          </div>
        </div>
      )}

      {/* 4. MAIN TWO-COLUMN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: GRID CONNECTION SETTINGS & PEAK DEMAND OPTIMIZATION (COL-SPAN-8) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Section: Peak Demand Optimization Graph & Comparative Meter */}
          <div className="p-4 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#00163d]">stacked_line_chart</span>
                <h2 className="text-[14px] font-bold text-[#00163d] uppercase tracking-wider">
                  Peak Demand Optimization & Real-Time Coincident Load
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#85f8c4]/30 text-[#005137] text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006c4a]"></span>
                <span>NO PENALTY BREACH</span>
              </span>
            </div>

            {/* Visual Comparative Multi-Threshold Load Meter */}
            <div className="flex flex-col gap-2 p-3.5 rounded-lg bg-[#eff4ff]">
              <div className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#00163d]">Real-Time Depot Coincident Load:</span>
                  <span className="font-mono text-[16px] font-bold text-[#00163d]">{currentLoad === null ? 'Not provided' : `${currentLoad} kW`}</span>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-mono">
                  <span className="text-[#00163d]">Contracted Limit: <strong>{contractedLimit} kW</strong></span>
                  <span className="text-[#ba1a1a]">Transformer Rating: <strong>{transformerCapacity} kW</strong></span>
                </div>
              </div>

              {/* Progress Bar with Multiple Threshold Pins */}
              <div className="relative w-full h-7 rounded-lg bg-[#e5eeff] overflow-hidden p-1 flex items-center">
                {/* Active load bar */}
                <div
                  className="h-full rounded-md bg-[#00163d] transition-all flex items-center justify-end pr-2 text-white font-mono text-[10px] font-bold"
                  style={{ width: `${currentLoad === null ? 0 : (currentLoad / transformerCapacity) * 100}%` }}
                >
                  {currentLoad === null ? 'Not provided by optimization engine' : `${currentLoad} kW (${loadPctOfTransformer}%)`}
                </div>

                {/* Contracted limit marker line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-600 z-10"
                  style={{ left: `${(contractedLimit / transformerCapacity) * 100}%` }}
                >
                  <span className="absolute -top-1 -translate-x-1/2 px-1 py-0.2 bg-amber-600 text-white rounded text-[8px] font-mono font-bold uppercase">
                    500 kW Limit
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#44464f] font-mono mt-1">
                <span>0 kW</span>
                <span className="text-amber-700 font-bold">Soft Warning Band (450–500 kW)</span>
                <span className="text-red-700 font-bold">Penalty Threshold (&gt;500 kW: ₹450/kW)</span>
                <span>{transformerCapacity} kW Physical Ceiling</span>
              </div>
            </div>

            {/* Load Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-1">
              <div className="p-3 rounded-lg bg-[#eff4ff] border border-blue-100 flex flex-col">
                <span className="text-[10px] font-bold uppercase text-[#44464f]">Depot Base Load</span>
                <span className="font-mono text-[18px] font-bold text-[#00163d] mt-0.5">80 kW</span>
                <span className="text-[11px] text-[#44464f] mt-0.5">HVAC, lighting, dock motors</span>
              </div>
              <div className="p-3 rounded-lg bg-[#eff4ff] border border-blue-100 flex flex-col">
                <span className="text-[10px] font-bold uppercase text-[#44464f]">EV Active Charging</span>
                <span className="font-mono text-[18px] font-bold text-[#00163d] mt-0.5">{baselineResult?.peakDemand ?? 'Not provided'} kW</span>
                <span className="text-[11px] text-[#44464f] mt-0.5">8 connected delivery vans</span>
              </div>
              <div className="p-3 rounded-lg bg-[#eff4ff] border border-blue-100 flex flex-col">
                <span className="text-[10px] font-bold uppercase text-[#006c4a]">Peak Shaved Real-Time</span>
                <span className="font-mono text-[18px] font-bold text-[#006c4a] mt-0.5">{optimizationResult ? `${optimizationResult.peakReductionKw} kW` : 'Not provided'}</span>
                <span className="text-[11px] text-[#006c4a] font-bold mt-0.5">Displaced to 23:00 off-peak</span>
              </div>
            </div>
          </div>

          {/* Section: Time-of-Day (TOD) Tariff Structure & Visual 24-Hour Timeline */}
          <div className="p-4 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#00163d]">access_time</span>
                <h2 className="text-[14px] font-bold text-[#00163d] uppercase tracking-wider">
                  Time-of-Day (TOD) Tariff Structure & 24-Hour Timeline
                </h2>
              </div>
              <button
                onClick={() => setShowEditTariffModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#eff4ff] text-[#00163d] text-[11px] font-bold hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200"
                type="button"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                <span>Edit Tariff Schedule</span>
              </button>
            </div>

            {/* Visual 24-Hour Tariff Timeline */}
            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[#eff4ff] border border-blue-100">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#00163d] uppercase">Daily 24-Hour Tariff Slots</span>
                <span className="font-mono text-[11px] text-[#44464f]">Current Time: <strong>14:30 (Normal Window)</strong></span>
              </div>

              {/* 24 Bar segments */}
              <div className="grid grid-cols-24 gap-0.5 h-10 rounded-md overflow-hidden bg-white p-1 border border-slate-200">
                {hours.map((h) => {
                  const t = getTariffTypeForHour(h);
                  const isNow = h === 14;
                  return (
                    <div
                      key={h}
                      title={`${String(h).padStart(2, '0')}:00 - ${t.type} (₹${t.rate.toFixed(2)}/kWh)`}
                      className={`h-full rounded-xs flex flex-col items-center justify-between py-0.5 cursor-pointer hover:opacity-80 transition-opacity ${t.color} ${
                        isNow ? 'ring-2 ring-amber-400 ring-offset-1' : ''
                      }`}
                    >
                      <span className="text-[8px] font-mono text-white opacity-80">{h}</span>
                    </div>
                  );
                })}
              </div>

              {/* Legend & Rates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                {/* Off-Peak */}
                <div className="p-2 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-[#006c4a]"></span>
                    <div>
                      <div className="text-[11px] font-bold text-emerald-950">Off-Peak (23:00 - 06:00)</div>
                      <div className="text-[10px] text-emerald-800">Primary overnight fleet charging</div>
                    </div>
                  </div>
                  <span className="font-mono text-[14px] font-bold text-[#006c4a]">₹{offPeakRate.toFixed(2)} / kWh</span>
                </div>

                {/* Normal */}
                <div className="p-2 rounded bg-blue-50 border border-blue-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-[#00163d]"></span>
                    <div>
                      <div className="text-[11px] font-bold text-blue-950">Normal (06:00 - 17:00)</div>
                      <div className="text-[10px] text-blue-800">Daytime top-ups & opportunity charge</div>
                    </div>
                  </div>
                  <span className="font-mono text-[14px] font-bold text-[#00163d]">₹{normalRate.toFixed(2)} / kWh</span>
                </div>

                {/* Peak */}
                <div className="p-2 rounded bg-red-50 border border-red-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-[#ba1a1a]"></span>
                    <div>
                      <div className="text-[11px] font-bold text-red-950">Peak (17:00 - 23:00)</div>
                      <div className="text-[10px] text-red-800">High grid stress; avoid charging</div>
                    </div>
                  </div>
                  <span className="font-mono text-[14px] font-bold text-[#ba1a1a]">₹{peakRate.toFixed(2)} / kWh</span>
                </div>
              </div>

              {/* Demand Charge Penalty Notice */}
              <div className="p-2.5 rounded bg-amber-50 border border-amber-200 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 text-amber-900">
                  <span className="material-symbols-outlined text-[18px] text-amber-700">warning</span>
                  <span><strong>Demand Charge Penalty:</strong> ₹{penaltyRate} / kW applied to any 15-min demand exceeding {contractedLimit} kW.</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold font-mono">
                  Active Safeguard
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: GRID CONNECTION SETTINGS & ADJUST CONTRACTED LIMIT (COL-SPAN-4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Grid Connection Settings Card */}
          <div className="p-4 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold text-[#00163d] uppercase tracking-wider">
                Grid Connection Settings
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                11 kV Feeder Active
              </span>
            </div>

            <div className="flex flex-col gap-2.5 text-[12px]">
              <div className="p-2.5 rounded bg-[#eff4ff] flex flex-col">
                <span className="text-[10px] uppercase font-bold text-[#747780]">Substation Transformer Capacity</span>
                <span className="font-mono text-[15px] font-bold text-[#00163d] mt-0.5">
                  {transformerCapacity} kW (750 kVA)
                </span>
                <span className="text-[11px] text-[#44464f] mt-0.5">Dedicated onsite step-down unit</span>
              </div>

              <div className="p-2.5 rounded bg-[#eff4ff] flex flex-col">
                <span className="text-[10px] uppercase font-bold text-[#747780]">Contracted Peak Demand Limit</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-mono text-[15px] font-bold text-[#00163d]">{contractedLimit} kW</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900">
                    Tariff Cap
                  </span>
                </div>
                <span className="text-[11px] text-[#44464f] mt-0.5">Penalty levied on demand &gt; {contractedLimit} kW</span>
              </div>

              <div className="p-2.5 rounded bg-[#eff4ff] flex flex-col">
                <span className="text-[10px] uppercase font-bold text-[#747780]">Grid Operator / DISCOM</span>
                <span className="text-[13px] font-bold text-[#00163d] mt-0.5">{discomName}</span>
                <span className="text-[11px] text-[#44464f] mt-0.5">Industrial Commercial Feeder #14</span>
              </div>

              <div className="p-2.5 rounded bg-[#eff4ff] flex flex-col">
                <span className="text-[10px] uppercase font-bold text-[#747780]">Connection Voltage</span>
                <span className="font-mono text-[13px] font-bold text-[#00163d] mt-0.5">{connectionVoltage}</span>
                <span className="text-[11px] text-[#44464f] mt-0.5">3-Phase 50Hz HT Interconnection</span>
              </div>
            </div>
          </div>

          {/* Adjust Contracted Limit Interactive Form */}
          <div className="p-4 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold text-[#00163d] uppercase tracking-wider">
                Adjust Contracted Limit
              </span>
              <span className="font-mono text-[12px] font-bold text-[#00163d]">{contractedLimit} kW</span>
            </div>

            <p className="text-[12px] text-[#44464f]">
              Modulate the contracted demand limit to reflect updated power purchase agreements or seasonal peak contracts.
            </p>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[11px] text-[#44464f] font-mono">
                <span>300 kW</span>
                <span>Setpoint: {contractedLimit} kW</span>
                <span>600 kW Max</span>
              </div>
              <input
                type="range"
                min="300"
                max={transformerCapacity}
                step="10"
                value={contractedLimit}
                onChange={(e) => setContractedLimit(Number(e.target.value))}
                className="w-full accent-[#00163d]"
              />
            </div>

            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => {
                  setContractedLimit(480);
                  showToast('Contracted demand set to 480 kW (Safe conservative mode).');
                }}
                className="flex-1 py-1.5 rounded bg-[#eff4ff] text-[#00163d] text-[11px] font-bold hover:bg-blue-100 cursor-pointer border border-blue-200"
                type="button"
              >
                Set 480 kW
              </button>
              <button
                onClick={() => {
                  setContractedLimit(500);
                  showToast('Contracted demand set to 500 kW standard agreement.');
                }}
                className="flex-1 py-1.5 rounded bg-[#eff4ff] text-[#00163d] text-[11px] font-bold hover:bg-blue-100 cursor-pointer border border-blue-200"
                type="button"
              >
                Set 500 kW
              </button>
            </div>

            <button
              onClick={handleSaveConfig}
              className="w-full h-9 rounded bg-[#00163d] text-white text-[12px] font-semibold hover:bg-[#0f2b5c] transition-colors shadow-xs cursor-pointer mt-1"
              type="button"
            >
              Save Grid Configuration
            </button>
          </div>
        </div>
      </div>

      {/* 5. MODAL: EDIT TARIFF SCHEDULE */}
      {showEditTariffModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#00163d]">edit_calendar</span>
                <h3 className="text-[15px] font-bold text-[#00163d]">Edit Tariff Schedule & DISCOM Rates</h3>
              </div>
              <button
                onClick={() => setShowEditTariffModal(false)}
                className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 text-[12px]">
              <div>
                <label className="block text-[11px] font-bold text-[#00163d] uppercase mb-1">
                  Off-Peak Rate (23:00 - 06:00) — ₹ / kWh
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={offPeakRate}
                  onChange={(e) => setOffPeakRate(Number(e.target.value))}
                  className="w-full h-8 px-2.5 rounded bg-[#eff4ff] font-mono border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#00163d] uppercase mb-1">
                  Normal Rate (06:00 - 17:00) — ₹ / kWh
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={normalRate}
                  onChange={(e) => setNormalRate(Number(e.target.value))}
                  className="w-full h-8 px-2.5 rounded bg-[#eff4ff] font-mono border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#00163d] uppercase mb-1">
                  Peak Rate (17:00 - 23:00) — ₹ / kWh
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={peakRate}
                  onChange={(e) => setPeakRate(Number(e.target.value))}
                  className="w-full h-8 px-2.5 rounded bg-[#eff4ff] font-mono border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#ba1a1a] uppercase mb-1">
                  Demand Penalty Surcharge — ₹ / kW
                </label>
                <input
                  type="number"
                  value={penaltyRate}
                  onChange={(e) => setPenaltyRate(Number(e.target.value))}
                  className="w-full h-8 px-2.5 rounded bg-[#ffdad6]/40 font-mono border border-red-200 text-[#ba1a1a]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowEditTariffModal(false)}
                className="flex-1 h-9 rounded bg-slate-100 text-[#44464f] text-[12px] font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowEditTariffModal(false);
                  handleSaveConfig();
                }}
                className="flex-1 h-9 rounded bg-[#00163d] text-white text-[12px] font-semibold hover:bg-[#0f2b5c] cursor-pointer"
              >
                Apply Rates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
