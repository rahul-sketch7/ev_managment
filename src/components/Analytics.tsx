import React, { useState } from 'react';
import { useGridCharge } from '../context/GridChargeContext';

type DateRange = 'today' | '7d' | '30d' | 'custom';

export const Analytics: React.FC = () => {
  const { historicalDays, showToast } = useGridCharge();
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  // KPI calculations
  const totalEnergyKwh = 48240;
  const totalCostInr = 342800;
  const avgCostPerKwh = (totalCostInr / totalEnergyKwh).toFixed(2); // ₹7.11 / kWh
  const peakDemandRecorded = 472; // kW (within 500 kW limit)
  const onTimeDepartureRate = 99.4; // %
  const totalCostSavedInr = 118400; // ₹1,18,400 (25.7% savings)

  // 12 bays utilization data
  const bayUtilization = [
    { bay: 'Bay 01', type: 'AC 22kW', util: 78 },
    { bay: 'Bay 02', type: 'AC 22kW', util: 82 },
    { bay: 'Bay 03', type: 'AC 22kW', util: 74 },
    { bay: 'Bay 04', type: 'AC 22kW', util: 88 },
    { bay: 'Bay 05', type: 'AC 22kW', util: 69 },
    { bay: 'Bay 06', type: 'AC 22kW', util: 76 },
    { bay: 'Bay 07', type: 'AC 22kW', util: 85 },
    { bay: 'Bay 08', type: 'AC 22kW', util: 81 },
    { bay: 'Bay 09', type: 'DC 50kW', util: 92 },
    { bay: 'Bay 10', type: 'DC 50kW', util: 94 },
    { bay: 'Bay 11', type: 'DC 60kW', util: 89 },
    { bay: 'Bay 12', type: 'DC 120kW', util: 96 },
  ];

  return (
    <div className="flex flex-col w-full gap-4">
      {/* 1. TOP HEADER SUB-BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex flex-col">
          <h1 className="text-[20px] font-bold text-[#00163d] tracking-tight">Analytics & Reports</h1>
          <p className="text-[12px] text-[#44464f]">
            Historical charging performance, cost analysis, energy consumption, and fleet readiness trends.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Date Range Selector */}
          <div className="flex items-center rounded-lg border border-[#c4c6d0] bg-[#eff4ff] p-0.5 text-[12px]">
            <button
              onClick={() => setDateRange('today')}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                dateRange === 'today' ? 'bg-white shadow-2xs text-[#00163d] font-bold' : 'text-[#44464f]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateRange('7d')}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                dateRange === '7d' ? 'bg-white shadow-2xs text-[#00163d] font-bold' : 'text-[#44464f]'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateRange('30d')}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                dateRange === '30d' ? 'bg-white shadow-2xs text-[#00163d] font-bold' : 'text-[#44464f]'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDateRange('custom')}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                dateRange === 'custom' ? 'bg-white shadow-2xs text-[#00163d] font-bold' : 'text-[#44464f]'
              }`}
            >
              Custom
            </button>
          </div>

          <button
            onClick={() => showToast('Audited charging dataset exported as CSV.')}
            className="inline-flex items-center gap-1.5 px-3 h-8.5 rounded-md bg-white text-[#00163d] text-[12px] font-medium hover:bg-[#eff4ff] shadow-2xs transition-colors border border-[#c4c6d0] cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-[#747780]">download</span>
            <span>Download CSV Data</span>
          </button>
          <button
            onClick={() => showToast('Depot Executive Analytics Report compiled to PDF.')}
            className="inline-flex items-center gap-1.5 px-3.5 h-8.5 rounded-md bg-[#00163d] text-white text-[12px] font-semibold hover:bg-[#0f2b5c] transition-colors shadow-xs cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-[#85f8c4]">picture_as_pdf</span>
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>

      {/* 2. SIX KPI SUMMARY CARDS (Matching product specification) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Energy Consumed */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#747780] font-semibold">
              Total Energy
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#00163d]">bolt</span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-[22px] font-mono font-bold text-[#00163d]">
              {totalEnergyKwh.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-[#44464f]">kWh</span>
          </div>
          <div className="text-[10px] text-[#44464f] mt-1 truncate">30-day operating total</div>
        </div>

        {/* Total Charging Cost */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#747780] font-semibold">
              Total Cost
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#00163d]">payments</span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-[22px] font-mono font-bold text-[#00163d]">
              ₹{totalCostInr.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-[10px] text-[#006c4a] font-bold mt-1 truncate">DISCOM electricity bill</div>
        </div>

        {/* Average Cost per kWh */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#747780] font-semibold">
              Avg Cost / kWh
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#00163d]">price_change</span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-[22px] font-mono font-bold text-[#00163d]">₹{avgCostPerKwh}</span>
            <span className="text-[10px] text-[#44464f]">/ kWh</span>
          </div>
          <div className="text-[10px] text-[#44464f] mt-1 truncate">Blended TOD rate achieved</div>
        </div>

        {/* Peak Demand Recorded */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#747780] font-semibold">
              Peak Recorded
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#00163d]">electric_meter</span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-[22px] font-mono font-bold text-[#00163d]">{peakDemandRecorded}</span>
            <span className="text-[10px] text-[#44464f]">kW</span>
          </div>
          <div className="text-[10px] text-[#006c4a] font-bold mt-1 truncate">Under 500 kW ceiling</div>
        </div>

        {/* Fleet On-Time Departure Rate */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#747780] font-semibold">
              On-Time SLA
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#006c4a]">verified</span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-[22px] font-mono font-bold text-[#006c4a]">{onTimeDepartureRate}%</span>
          </div>
          <div className="text-[10px] text-[#44464f] mt-1 truncate">186 of 187 runs ready</div>
        </div>

        {/* Total Cost Saved vs Unmanaged */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#747780] font-semibold">
              Cost Saved
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#006c4a]">savings</span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-[22px] font-mono font-bold text-[#006c4a]">
              ₹{totalCostSavedInr.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-[10px] text-[#005137] font-bold mt-1 truncate">
            25.7% vs unmanaged charging
          </div>
        </div>
      </div>

      {/* 3. CHARTS & VISUALIZATIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT (COL-SPAN-8): DAILY ENERGY CONSUMPTION & PEAK DEMAND TREND */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Chart 1: Daily Energy Consumption Bar Chart */}
          <div className="p-4 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-[14px] font-bold text-[#00163d] uppercase tracking-wider">
                  Daily Energy Consumption (kWh) & Peak Shaving
                </h2>
                <p className="text-[12px] text-[#44464f]">
                  Logged 7-day charging volume compared against peak demand shaved.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-[#00163d]">
                  <span className="w-2.5 h-2.5 bg-[#00163d] rounded-xs"></span>
                  <span>Energy Delivered (kWh)</span>
                </span>
                <span className="flex items-center gap-1 text-[#006c4a]">
                  <span className="w-2.5 h-2.5 bg-[#85f8c4] rounded-xs border border-emerald-600"></span>
                  <span>Peak Shaved (kW)</span>
                </span>
              </div>
            </div>

            {/* Bar Chart Representation */}
            <div className="grid grid-cols-7 gap-2 h-44 items-end pt-4 pb-2 px-2 bg-[#eff4ff] rounded-lg">
              {historicalDays.slice(0, 7).map((d) => {
                const kwh = Math.round(d.energyMwh * 1000);
                const barHeight = Math.min(100, Math.round((kwh / 2500) * 100));
                return (
                  <div key={d.date} className="flex flex-col items-center h-full justify-end gap-1 group">
                    <span className="text-[9px] font-mono text-[#00163d] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      {kwh}
                    </span>
                    <div className="w-full max-w-[32px] rounded-t bg-[#00163d] hover:bg-[#0f2b5c] transition-all" style={{ height: `${barHeight}%` }}></div>
                    <span className="text-[10px] font-mono text-[#44464f] mt-1">{d.dayName}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 2: Peak Demand Trend vs Contracted Limit (Line / Multi-point chart) */}
          <div className="p-4 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-[14px] font-bold text-[#00163d] uppercase tracking-wider">
                  Peak Coincident Demand vs. 500 kW Contracted Limit
                </h2>
                <p className="text-[12px] text-[#44464f]">
                  Daily 15-minute maximum coincident demand. Never breached the 500 kW penalty threshold.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#85f8c4]/30 text-[#005137] text-[11px] font-bold font-mono">
                ZERO PENALTY EVENTS
              </span>
            </div>

            <div className="flex flex-col gap-2 p-3 bg-[#eff4ff] rounded-lg">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#00163d]">Depot Max Draw</span>
                <span className="text-amber-700 font-bold">Contract Limit: 500 kW</span>
              </div>

              {/* Day-by-day Peak comparison */}
              <div className="flex flex-col gap-2">
                {historicalDays.slice(0, 5).map((d) => (
                  <div key={d.date} className="flex items-center gap-3 text-[11px]">
                    <span className="w-16 font-mono text-[#44464f]">{d.dayName}</span>
                    <div className="relative flex-1 h-5 rounded bg-white overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-[#00163d] flex items-center justify-end pr-2 text-white font-mono text-[9px] font-bold"
                        style={{ width: `${(d.peakDemandKw / 600) * 100}%` }}
                      >
                        {d.peakDemandKw} kW
                      </div>
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-600 z-10"
                        style={{ left: `${(500 / 600) * 100}%` }}
                      ></div>
                    </div>
                    <span className="w-20 text-right font-mono text-[#006c4a] font-bold">
                      {500 - d.peakDemandKw} kW Buffer
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT (COL-SPAN-4): TARIFF BREAKDOWN, VEHICLE READINESS & CHARGER UTILIZATION */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Breakdown 1: Cost Breakdown by Tariff Period */}
          <div className="p-4 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col gap-3">
            <h3 className="text-[13px] font-bold text-[#00163d] uppercase tracking-wider">
              Cost & kWh by Tariff Period
            </h3>

            <div className="flex flex-col gap-2.5">
              {/* Off-Peak */}
              <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 flex flex-col gap-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-emerald-950">Off-Peak (23:00 - 06:00)</span>
                  <span className="font-mono font-bold text-[#006c4a]">54% of Volume</span>
                </div>
                <div className="w-full h-2 rounded-full bg-emerald-100 overflow-hidden">
                  <div className="h-full bg-[#006c4a] w-[54%]"></div>
                </div>
                <div className="flex justify-between text-[10px] text-emerald-800 font-mono">
                  <span>26,050 kWh</span>
                  <span>Rate: ₹4.20 / kWh</span>
                </div>
              </div>

              {/* Normal */}
              <div className="p-2.5 rounded bg-blue-50 border border-blue-200 flex flex-col gap-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-blue-950">Normal (06:00 - 17:00)</span>
                  <span className="font-mono font-bold text-[#00163d]">32% of Volume</span>
                </div>
                <div className="w-full h-2 rounded-full bg-blue-100 overflow-hidden">
                  <div className="h-full bg-[#00163d] w-[32%]"></div>
                </div>
                <div className="flex justify-between text-[10px] text-blue-800 font-mono">
                  <span>15,436 kWh</span>
                  <span>Rate: ₹6.80 / kWh</span>
                </div>
              </div>

              {/* Peak */}
              <div className="p-2.5 rounded bg-red-50 border border-red-200 flex flex-col gap-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-red-950">Peak (17:00 - 23:00)</span>
                  <span className="font-mono font-bold text-[#ba1a1a]">14% (Restricted)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-red-100 overflow-hidden">
                  <div className="h-full bg-[#ba1a1a] w-[14%]"></div>
                </div>
                <div className="flex justify-between text-[10px] text-red-800 font-mono">
                  <span>6,754 kWh</span>
                  <span>Rate: ₹11.50 / kWh</span>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown 2: Vehicle Readiness Distribution (% departed with >80%, 85%, 90% SOC) */}
          <div className="p-4 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col gap-3">
            <h3 className="text-[13px] font-bold text-[#00163d] uppercase tracking-wider">
              Departure Readiness Distribution
            </h3>

            <div className="flex flex-col gap-2 text-[12px]">
              <div className="flex justify-between items-center">
                <span className="text-[#44464f]">Departed with &ge; 90% SOC (Ideal Target)</span>
                <span className="font-mono font-bold text-[#006c4a]">92.6% (173 EVs)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-[#006c4a] w-[92.6%]"></div>
              </div>

              <div className="flex justify-between items-center mt-1">
                <span className="text-[#44464f]">Departed with 85%–89% SOC (Safe Buffer)</span>
                <span className="font-mono font-bold text-[#00163d]">6.8% (13 EVs)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-[#00163d] w-[6.8%]"></div>
              </div>

              <div className="flex justify-between items-center mt-1">
                <span className="text-[#44464f]">Departed with 80%–84% SOC (Short Route)</span>
                <span className="font-mono font-bold text-amber-700">0.6% (1 EV)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-500 w-[0.6%]"></div>
              </div>
            </div>
          </div>

          {/* Breakdown 3: Charger Utilization Rate by Bay */}
          <div className="p-4 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-[#00163d] uppercase tracking-wider">
                Charger Utilization by Bay
              </h3>
              <span className="text-[10px] text-[#747780] font-mono">12 Bays</span>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {bayUtilization.map((b) => (
                <div key={b.bay} className="p-2 rounded bg-[#eff4ff] border border-blue-100 flex flex-col">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-[#00163d]">{b.bay}</span>
                    <span className="font-mono font-bold text-[#00163d]">{b.util}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-blue-100 overflow-hidden mt-1">
                    <div className="h-full bg-[#00163d]" style={{ width: `${b.util}%` }}></div>
                  </div>
                  <span className="text-[9px] text-[#747780] mt-0.5">{b.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
