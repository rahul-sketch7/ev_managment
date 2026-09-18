import React from 'react';
import { useGridCharge } from '../context/GridChargeContext';

export const OptimizationResult: React.FC = () => {
  const { optimizationResult, applySchedule, setCurrentView } = useGridCharge();

  return (
    <div className="flex flex-col w-full gap-4">
      {/* 1. TOP HEADER & METADATA BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] font-bold text-[#0b1c30] tracking-tight">Optimization Results</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-[#82f5c1]/30 text-[#006c4a] border border-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006c4a]"></span>
              <span>FEASIBLE SCHEDULE</span>
            </span>
          </div>
          <p className="text-[12px] text-[#747780]">
            Autonomous charging profiles generated to shave peak feeder demand and protect departure deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="inline-flex items-center gap-1.5 px-3 h-8 rounded bg-white text-[#0b1c30] text-[12px] font-medium hover:bg-[#eff4ff] shadow-xs transition-colors border border-slate-200"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-[#747780]">arrow_back</span>
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => applySchedule()}
            className="inline-flex items-center gap-1.5 px-4 h-8 rounded bg-[#0f2b5c] text-white text-[12px] font-semibold hover:bg-[#00163d] transition-colors shadow-xs"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-[#82f5c1]">send</span>
            <span>Apply to Controllers</span>
          </button>
        </div>
      </div>

      {/* Telemetry metadata chip bar */}
      <div className="p-2.5 rounded-lg bg-white border border-[#c4c6d0]/40 shadow-xs flex flex-wrap items-center justify-between text-[11px] font-mono gap-2 text-[#44464f]">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            Optimization ID: <span className="font-bold text-[#00163d]">{optimizationResult.id}</span>
          </div>
          <div className="h-3 w-px bg-slate-300"></div>
          <div>
            Solved in: <span className="font-bold text-[#006c4a]">{optimizationResult.solvedInSeconds}s</span>
          </div>
          <div className="h-3 w-px bg-slate-300"></div>
          <div>
            Timestamp: <span className="text-[#0b1c30]">{optimizationResult.timestamp}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-sans text-[11px] text-[#747780]">Engine Source:</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              optimizationResult.backendSource === 'live'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-blue-100 text-blue-900 border border-blue-300'
            }`}
          >
            {optimizationResult.backendSource === 'live'
              ? 'Spring Boot Backend (Port 8081)'
              : 'Deterministic Domain Engine'}
          </span>
        </div>
      </div>

      {/* 2. SUMMARY KPI CARDS (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Peak Demand */}
        <div className="p-3.5 rounded-lg bg-white border border-[#c4c6d0]/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#747780] font-semibold">
              Optimized Peak Demand
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#0f2b5c]">electric_meter</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-bold text-[#0f2b5c]">
              {optimizationResult.optimizedPeakDemand} kW
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#85f8c4]/30 text-[#005137] font-semibold">
              -{optimizationResult.peakReductionKw} kW (-{optimizationResult.peakReductionPercent}%)
            </span>
          </div>
          <div className="text-[12px] text-[#747780] mt-1 truncate">
            Uncontrolled baseline: {optimizationResult.uncontrolledPeakDemand} kW
          </div>
        </div>

        {/* Projected Energy Cost */}
        <div className="p-3.5 rounded-lg bg-white border border-[#c4c6d0]/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#747780] font-semibold">
              Projected Energy Cost
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#006c4a]">currency_rupee</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-bold text-[#006c4a]">
              ₹{optimizationResult.energyCost.toLocaleString()}
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#82f5c1]/40 text-[#00714e] font-semibold">
              -₹{optimizationResult.costSavings.toLocaleString()} ({optimizationResult.costSavingsPercent}%)
            </span>
          </div>
          <div className="text-[12px] text-[#747780] mt-1 truncate">
            Uncontrolled baseline: ₹{optimizationResult.uncontrolledCost.toLocaleString()}
          </div>
        </div>

        {/* Vehicles Ready */}
        <div className="p-3.5 rounded-lg bg-white border border-[#c4c6d0]/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#747780] font-semibold">
              Vehicles Ready On-Time
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#006c4a]">check_circle</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-bold text-[#006c4a]">
              {optimizationResult.vehiclesReady}
            </span>
            <span className="text-[12px] text-[#747780]">/ {optimizationResult.totalVehicles} units</span>
          </div>
          <div className="text-[12px] text-[#747780] mt-1 truncate">
            {Math.round((optimizationResult.vehiclesReady / optimizationResult.totalVehicles) * 100)}% route SLA adherence
          </div>
        </div>

        {/* Grid Headroom */}
        <div className="p-3.5 rounded-lg bg-white border border-[#c4c6d0]/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#747780] font-semibold">
              Grid Headroom Preserved
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#00163d]">health_and_safety</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-bold text-[#00163d]">
              {optimizationResult.gridHeadroom} kW
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#eff4ff] text-[#00163d] font-semibold">
              {Math.round((optimizationResult.gridHeadroom / optimizationResult.siteCapacity) * 100)}% margin
            </span>
          </div>
          <div className="text-[12px] text-[#747780] mt-1 truncate">
            Site limit: {optimizationResult.siteCapacity} kW
          </div>
        </div>
      </div>

      {/* 3. EXPLANATION STRIP */}
      <div className="p-4 rounded-lg bg-white border border-[#c4c6d0]/40 shadow-xs flex flex-col gap-2">
        <h3 className="text-[15px] font-semibold text-[#00163d]">Optimization Summary & Key Decisions</h3>
        <ul className="list-disc list-inside text-[12px] text-[#44464f] space-y-1">
          {optimizationResult.explanationPoints.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      </div>

      {/* 4. MAIN SPLIT: SHIFTS TABLE (COL-SPAN-8) & CONSTRAINT CHECKLIST (COL-SPAN-4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT: SCHEDULE SHIFTS & REASONING */}
        <div className="lg:col-span-8 p-4 rounded-lg bg-white border border-[#c4c6d0]/40 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#c4c6d0]/30">
            <div>
              <h2 className="text-[16px] font-semibold text-[#00163d]">Detailed Schedule Shifts & Rationales</h2>
              <p className="text-[12px] text-[#44464f]">
                Vehicle-level schedule adjustments determined by the optimization engine.
              </p>
            </div>
            <span className="text-[11px] text-[#747780] font-mono">
              {optimizationResult.shifts.length} Key Adjustments
            </span>
          </div>

          <div className="w-full overflow-x-auto mt-2">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-[#c4c6d0]/40 text-[10px] uppercase font-semibold text-[#747780] bg-[#eff4ff]">
                  <th className="py-2 px-3">Vehicle</th>
                  <th className="py-2 px-3">Route</th>
                  <th className="py-2 px-3">Priority</th>
                  <th className="py-2 px-3 font-mono">Prev Start</th>
                  <th className="py-2 px-3 font-mono">Optimized Start</th>
                  <th className="py-2 px-3 font-mono">Shift</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5eeff]">
                {optimizationResult.shifts.map((s) => (
                  <tr key={s.vehicleId} className="hover:bg-[#eff4ff]/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#00163d]">{s.vehicleId}</td>
                    <td className="py-2.5 px-3 text-[#0b1c30]">{s.route}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                          s.priority === 'CRITICAL'
                            ? 'bg-[#ffdad6] text-[#ba1a1a]'
                            : s.priority === 'HIGH'
                            ? 'bg-[#ffdcc3] text-[#6e3900]'
                            : 'bg-[#e5eeff] text-[#44464f]'
                        }`}
                      >
                        {s.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#747780]">{s.prevStart}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-[#00163d]">{s.optimizedStart}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#006c4a]">{s.shiftDelta}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          s.status === 'PRIORITY'
                            ? 'bg-[#0f2b5c] text-white'
                            : s.status === 'DEFERRED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#44464f] text-[11px] max-w-xs">{s.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: CONSTRAINT VERIFICATION CHECKLIST */}
        <div className="lg:col-span-4 p-4 rounded-lg bg-white border border-[#c4c6d0]/40 shadow-xs flex flex-col gap-3">
          <div className="pb-2 border-b border-[#c4c6d0]/30 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-[#00163d]">Constraint Feasibility Audit</h3>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              All Passed
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {optimizationResult.constraintChecks.map((c, i) => (
              <div key={i} className="p-2.5 rounded bg-[#eff4ff] border border-slate-100 flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#006c4a] shrink-0 mt-0.5">
                  check_circle
                </span>
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-[#0b1c30]">{c.name}</span>
                  <span className="text-[11px] text-[#44464f] leading-snug mt-0.5">{c.description}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => applySchedule()}
            className="w-full mt-2 h-9 rounded bg-[#0f2b5c] text-white text-[12px] font-semibold hover:bg-[#00163d] transition-colors shadow-xs flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px] text-[#82f5c1]">send</span>
            <span>Deploy Active Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
