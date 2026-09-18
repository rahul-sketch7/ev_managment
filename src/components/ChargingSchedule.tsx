import React, { useState } from 'react';
import { useGridCharge } from '../context/GridChargeContext';

type ViewMode = 'vehicle' | 'bay';
type TimeResolution = '15m' | '30m' | '1h';

export const ChargingSchedule: React.FC = () => {
  const {
    vehicles,
    chargers,
    gridConfig,
    optimizationResult,
    runOptimization,
    applySchedule,
    isOptimizing,
    setSelectedVehicleId,
    setCurrentView,
    showToast,
  } = useGridCharge();

  const [viewMode, setViewMode] = useState<ViewMode>('vehicle');
  const [resolution, setResolution] = useState<TimeResolution>('30m');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [showUncontrolled, setShowUncontrolled] = useState<boolean>(true);
  const [showCostOverlay, setShowCostOverlay] = useState<boolean>(true);
  const [hoveredVehicle, setHoveredVehicle] = useState<any | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100); // %

  const filteredVehicles = vehicles.filter((v) => {
    if (filterPriority === 'Critical') return v.routePriority === 'CRITICAL';
    if (filterPriority === 'High') return v.routePriority === 'HIGH';
    if (filterPriority === 'Normal') return v.routePriority === 'NORMAL';
    return true;
  });

  // 24-Hour Timeline Hours: 00:00 to 24:00 (every 2 hours labels)
  const timelineHours = [
    '00:00', '02:00', '04:00', '06:00', '08:00', '10:00',
    '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '24:00'
  ];

  // Helper to parse time string (HH:MM) to fraction of 24h day [0..100%]
  const timeToPercent = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    const totalMinutes = (h || 0) * 60 + (m || 0);
    return (totalMinutes / 1440) * 100;
  };

  // Coincident 24h load curve data (24 sample points 00:00 - 23:00)
  const loadProfilePoints = [
    { hour: 0, time: '00:00', optKw: 380, unctrlKw: 110, costInr: 1596, tariff: 'Off-Peak' },
    { hour: 1, time: '01:00', optKw: 420, unctrlKw: 90, costInr: 3360, tariff: 'Off-Peak' },
    { hour: 2, time: '02:00', optKw: 460, unctrlKw: 75, costInr: 5292, tariff: 'Off-Peak' },
    { hour: 3, time: '03:00', optKw: 472, unctrlKw: 60, costInr: 7274, tariff: 'Off-Peak' },
    { hour: 4, time: '04:00', optKw: 440, unctrlKw: 50, costInr: 9122, tariff: 'Off-Peak' },
    { hour: 5, time: '05:00', optKw: 390, unctrlKw: 40, costInr: 10760, tariff: 'Off-Peak' },
    { hour: 6, time: '06:00', optKw: 210, unctrlKw: 30, costInr: 12188, tariff: 'Normal' },
    { hour: 7, time: '07:00', optKw: 120, unctrlKw: 20, costInr: 13004, tariff: 'Normal' },
    { hour: 8, time: '08:00', optKw: 80, unctrlKw: 45, costInr: 13548, tariff: 'Normal' },
    { hour: 9, time: '09:00', optKw: 60, unctrlKw: 60, costInr: 13956, tariff: 'Normal' },
    { hour: 10, time: '10:00', optKw: 90, unctrlKw: 70, costInr: 14568, tariff: 'Normal' },
    { hour: 11, time: '11:00', optKw: 110, unctrlKw: 80, costInr: 15316, tariff: 'Normal' },
    { hour: 12, time: '12:00', optKw: 130, unctrlKw: 90, costInr: 16200, tariff: 'Normal' },
    { hour: 13, time: '13:00', optKw: 140, unctrlKw: 120, costInr: 17152, tariff: 'Normal' },
    { hour: 14, time: '14:00', optKw: 120, unctrlKw: 180, costInr: 17968, tariff: 'Normal' },
    { hour: 15, time: '15:00', optKw: 160, unctrlKw: 380, costInr: 19056, tariff: 'Normal' },
    { hour: 16, time: '16:00', optKw: 210, unctrlKw: 560, costInr: 20484, tariff: 'Normal' },
    { hour: 17, time: '17:00', optKw: 240, unctrlKw: 720, costInr: 23244, tariff: 'Peak' }, // Peak starts
    { hour: 18, time: '18:00', optKw: 220, unctrlKw: 680, costInr: 25774, tariff: 'Peak' },
    { hour: 19, time: '19:00', optKw: 180, unctrlKw: 620, costInr: 27844, tariff: 'Peak' },
    { hour: 20, time: '20:00', optKw: 160, unctrlKw: 540, costInr: 29684, tariff: 'Peak' },
    { hour: 21, time: '21:00', optKw: 190, unctrlKw: 420, costInr: 31869, tariff: 'Peak' },
    { hour: 22, time: '22:00', optKw: 280, unctrlKw: 290, costInr: 33045, tariff: 'Peak' },
    { hour: 23, time: '23:00', optKw: 340, unctrlKw: 180, costInr: 34473, tariff: 'Off-Peak' },
  ];

  // Helper to determine charging segment block positioning and color
  const getVehicleScheduleGeometry = (v: typeof vehicles[0]) => {
    const arrPercent = timeToPercent(v.arrivalTime || '18:00');
    const depPercent = timeToPercent(v.departureTime || '06:00');

    let startPercent = arrPercent;
    let powerKw = v.maxChargingPower || 22;

    if (v.routePriority === 'CRITICAL') {
      startPercent = arrPercent; // charges immediately
      powerKw = 44;
    } else if (v.id === 'EV-1048' || v.id === 'EV-1056' || v.routePriority === 'NORMAL') {
      // Shifted outside peak (starts at 23:15 off-peak)
      startPercent = timeToPercent('23:15');
    } else {
      startPercent = arrPercent + 2; // Staggered
    }

    const durationHours = Math.max(1.2, v.requiredEnergy / powerKw);
    const durationPercent = (durationHours / 24) * 100;

    // Color based on tariff period of startPercent
    let barColor = 'bg-[#00163d]'; // normal blue
    let tariffTag = 'Normal';
    const startHour = (startPercent / 100) * 24;
    if (startHour >= 23 || startHour < 6) {
      barColor = 'bg-[#006c4a]'; // Green off-peak
      tariffTag = 'Off-Peak (₹4.20/kWh)';
    } else if (startHour >= 17 && startHour < 23) {
      barColor = 'bg-amber-600'; // Amber peak
      tariffTag = 'Peak (₹11.50/kWh)';
    } else {
      barColor = 'bg-[#00163d]';
      tariffTag = 'Normal (₹6.80/kWh)';
    }

    return {
      arrPercent,
      depPercent,
      startPercent,
      durationPercent: Math.min(durationPercent, Math.max(4, 98 - startPercent)),
      powerKw,
      barColor,
      tariffTag,
      energyAddedKwh: v.requiredEnergy,
    };
  };

  const handleExport = (format: 'csv' | 'json') => {
    showToast(`Exported 24-hour charging schedule as ${format.toUpperCase()} for OCPP CSMS push.`);
  };

  return (
    <div className="flex flex-col w-full gap-4">
      {/* 1. TOP HEADER SUB-BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex flex-col">
          <h1 className="text-[20px] font-bold text-[#00163d] tracking-tight">Charging Schedule</h1>
          <p className="text-[12px] text-[#44464f]">
            24-hour optimized charging profiles per vehicle with power allocation and tariff overlay.
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {/* Export Schedule Buttons */}
          <button
            onClick={() => handleExport('json')}
            className="inline-flex items-center gap-1.5 px-3 h-8.5 rounded-md bg-white text-[#00163d] text-[12px] font-medium hover:bg-[#eff4ff] shadow-2xs transition-colors border border-[#c4c6d0] cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-[#747780]">send_and_archive</span>
            <span>Export OCPP JSON</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="inline-flex items-center gap-1.5 px-3 h-8.5 rounded-md bg-white text-[#00163d] text-[12px] font-medium hover:bg-[#eff4ff] shadow-2xs transition-colors border border-[#c4c6d0] cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-[#747780]">download</span>
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => showToast('Compiling high-resolution Gantt schedule PDF...')}
            className="inline-flex items-center gap-1.5 px-3 h-8.5 rounded-md bg-white text-[#00163d] text-[12px] font-medium hover:bg-[#eff4ff] shadow-2xs transition-colors border border-[#c4c6d0] cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-[#747780]">print</span>
            <span>Print / PDF</span>
          </button>

          {/* Re-optimize Schedule */}
          <button
            onClick={() => runOptimization(true)}
            disabled={isOptimizing}
            className="inline-flex items-center gap-1.5 px-3.5 h-8.5 rounded-md bg-[#00163d] text-white text-[12px] font-semibold hover:bg-[#0f2b5c] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            type="button"
          >
            <span className={`material-symbols-outlined text-[16px] text-[#85f8c4] ${isOptimizing ? 'animate-spin' : ''}`}>
              {isOptimizing ? 'progress_activity' : 'bolt'}
            </span>
            <span>{isOptimizing ? 'Solving (1.4s)...' : 'Re-optimize Schedule'}</span>
          </button>
        </div>
      </div>

      {/* 2. SCHEDULE ACTION & METRICS BANNER (Matching Product Spec) */}
      <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-wrap items-center justify-between gap-3 text-[12px]">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#006c4a] animate-pulse"></span>
          <div className="flex flex-col">
            <span className="font-bold text-[#005137] text-[13px]">
              OPTIMAL — Solution found in 1.4s by Java Spring Boot (CBC/OR-Tools)
            </span>
            <span className="text-[11px] text-[#44464f]">
              Global mathematical MILP convergence. All departure constraints satisfied.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[12px]">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-[#747780]">Peak Shaving:</span>
            <span className="font-bold text-[#006c4a] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              -34% vs uncontrolled (472 kW vs 720 kW)
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-[#747780]">Cost Savings:</span>
            <span className="font-bold text-[#006c4a] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ₹3,420 saved today (25.7%)
            </span>
          </div>
        </div>
      </div>

      {/* 3. TIMELINE HEADER CONTROLS (Resolution, Zoom, Views, Tariffs) */}
      <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: View Mode Toggle & Priority Filter */}
        <div className="flex items-center gap-3">
          {/* Vehicle vs Bay Toggle */}
          <div className="flex items-center rounded-lg border border-[#c4c6d0] bg-[#eff4ff] p-0.5 text-[12px]">
            <button
              onClick={() => setViewMode('vehicle')}
              className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                viewMode === 'vehicle' ? 'bg-white shadow-2xs text-[#00163d] font-bold' : 'text-[#44464f]'
              }`}
            >
              Vehicle View ({vehicles.length})
            </button>
            <button
              onClick={() => setViewMode('bay')}
              className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                viewMode === 'bay' ? 'bg-white shadow-2xs text-[#00163d] font-bold' : 'text-[#44464f]'
              }`}
            >
              Charger Bay View ({chargers.length})
            </button>
          </div>

          {/* Time Resolution Toggle */}
          <div className="flex items-center rounded-lg border border-[#c4c6d0] bg-[#eff4ff] p-0.5 text-[12px]">
            <button
              onClick={() => setResolution('15m')}
              className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                resolution === '15m' ? 'bg-white shadow-2xs text-[#00163d] font-bold' : 'text-[#44464f]'
              }`}
            >
              15 min
            </button>
            <button
              onClick={() => setResolution('30m')}
              className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                resolution === '30m' ? 'bg-white shadow-2xs text-[#00163d] font-bold' : 'text-[#44464f]'
              }`}
            >
              30 min
            </button>
            <button
              onClick={() => setResolution('1h')}
              className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                resolution === '1h' ? 'bg-white shadow-2xs text-[#00163d] font-bold' : 'text-[#44464f]'
              }`}
            >
              1 hour
            </button>
          </div>
        </div>

        {/* Center: Tariff Color Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="font-bold text-[#00163d] uppercase tracking-wider">Tariff Bands:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#006c4a]"></span>
            <span className="text-[#44464f]">Off-Peak (23:00–06:00: ₹4.20)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#00163d]"></span>
            <span className="text-[#44464f]">Normal (06:00–17:00: ₹6.80)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-600"></span>
            <span className="text-amber-900 font-bold">Peak (17:00–23:00: ₹11.50)</span>
          </div>
        </div>

        {/* Right: Zoom & Uncontrolled toggles */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#00163d] cursor-pointer">
            <input
              type="checkbox"
              checked={showUncontrolled}
              onChange={(e) => setShowUncontrolled(e.target.checked)}
              className="accent-[#ba1a1a]"
            />
            <span>Show Uncontrolled Baseline</span>
          </label>

          <div className="flex items-center rounded border border-[#c4c6d0] bg-[#eff4ff] p-0.5 text-[11px]">
            <button
              onClick={() => setZoomLevel(Math.max(80, zoomLevel - 10))}
              className="px-2 py-0.5 hover:bg-white rounded font-mono font-bold cursor-pointer"
              title="Zoom out"
            >
              -
            </button>
            <span className="px-1.5 font-mono text-[10px] text-[#44464f]">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel(Math.min(140, zoomLevel + 10))}
              className="px-2 py-0.5 hover:bg-white rounded font-mono font-bold cursor-pointer"
              title="Zoom in"
            >
              +
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="px-2 py-0.5 hover:bg-white rounded font-semibold cursor-pointer border-l border-slate-200 ml-0.5"
            >
              Fit 24h
            </button>
          </div>
        </div>
      </div>

      {/* 4. FLEET SCHEDULE GANTT CHART / TIMELINE */}
      <div className="p-4 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-[#c4c6d0]/30">
          <div>
            <h2 className="text-[16px] font-bold text-[#00163d]">
              {viewMode === 'vehicle' ? 'Vehicle Charging Schedule Gantt' : 'Charger Bay Allocation Gantt'}
            </h2>
            <p className="text-[12px] text-[#44464f]">
              Autonomous stepped power allocation (kW). Dashed lines show idle plugged-in periods before/after active charging.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-50 text-red-800 text-[11px] font-bold border border-red-200">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              <span>17:42 Depot Time Active</span>
            </span>
          </div>
        </div>

        {/* Master Gantt Container */}
        <div className="w-full overflow-x-auto mt-3">
          <div style={{ minWidth: `${zoomLevel > 100 ? zoomLevel * 10 : 980}px` }}>
            {/* 24-Hour Header with Tariff Background Bands */}
            <div className="grid grid-cols-12 gap-2 text-[11px] font-mono py-2 px-3 bg-[#eff4ff] rounded-t border-b border-[#c4c6d0]/40 text-[#44464f]">
              <div className="col-span-4 font-sans font-bold uppercase text-[#00163d]">
                {viewMode === 'vehicle' ? 'Vehicle • Route • SLA' : 'Bay • Power Rating • Current Status'}
              </div>
              <div className="col-span-8 relative flex justify-between">
                {/* 17:00 to 23:00 Peak Tariff Highlight Header Zone */}
                <div
                  className="absolute top-0 bottom-0 bg-amber-200/50 border-x border-amber-400 rounded-xs flex items-center justify-center text-[10px] font-bold text-amber-900 pointer-events-none"
                  style={{
                    left: `${(17 / 24) * 100}%`,
                    width: `${(6 / 24) * 100}%`,
                  }}
                >
                  PEAK TARIFF WINDOW (17:00–23:00)
                </div>

                {timelineHours.map((th) => (
                  <span key={th} className="z-10 font-bold">{th}</span>
                ))}
              </div>
            </div>

            {/* Vehicle Rows or Bay Rows */}
            <div className="divide-y divide-[#e5eeff] text-[12px]">
              {viewMode === 'vehicle' ? (
                filteredVehicles.map((v) => {
                  const geom = getVehicleScheduleGeometry(v);
                  const isCritical = v.routePriority === 'CRITICAL';
                  const isHigh = v.routePriority === 'HIGH';

                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        setSelectedVehicleId(v.id);
                        setCurrentView('fleet');
                      }}
                      onMouseEnter={() => setHoveredVehicle(v)}
                      onMouseLeave={() => setHoveredVehicle(null)}
                      className="grid grid-cols-12 gap-2 items-center py-2.5 px-3 hover:bg-[#eff4ff]/60 transition-colors cursor-pointer"
                    >
                      {/* Left Info Column */}
                      <div className="col-span-4 flex items-center justify-between pr-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            isCritical ? 'bg-[#ba1a1a]' : isHigh ? 'bg-amber-500' : 'bg-blue-600'
                          }`}></span>
                          <span className="font-mono font-bold text-[#00163d]">{v.id}</span>
                          <span className="text-[#0b1c30] truncate text-[12px] font-medium max-w-[110px]">
                            {v.route}
                          </span>
                        </div>
                        <div className="text-right font-mono text-[11px]">
                          <div className="font-bold text-[#00163d]">{v.currentSOC}% → {v.targetSOC}%</div>
                          <div className="text-[#ba1a1a] text-[10px] font-semibold flex items-center justify-end gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">flag</span>
                            <span>{v.departureTime}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Timeline Bar Column */}
                      <div className="col-span-8 relative h-8 bg-slate-50 rounded flex items-center">
                        {/* Peak Tariff Background Zone (17:00 to 23:00) */}
                        <div
                          className="absolute top-0 bottom-0 bg-amber-100/40 border-x border-amber-300 pointer-events-none"
                          style={{
                            left: `${(17 / 24) * 100}%`,
                            width: `${(6 / 24) * 100}%`,
                          }}
                        ></div>

                        {/* Current Time Indicator: Vertical RED DASHED line at 17:42 */}
                        <div
                          className="absolute top-0 bottom-0 w-0 border-r-2 border-dashed border-red-600 z-30 pointer-events-none"
                          style={{ left: `${(17.7 / 24) * 100}%` }}
                          title="Current Time: 17:42"
                        ></div>

                        {/* Idle / Plugged-in Period: Thin dashed line between arrival and departure */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-0 border-b border-dashed border-slate-400 z-10"
                          style={{
                            left: `${geom.arrPercent}%`,
                            width: `${Math.max(4, geom.depPercent > geom.arrPercent ? geom.depPercent - geom.arrPercent : 100 - geom.arrPercent + geom.depPercent)}%`,
                          }}
                        ></div>

                        {/* Arrival Time Marker (plug icon) */}
                        <div
                          className="absolute z-20 -translate-x-1/2 flex items-center justify-center text-[#00163d] bg-white rounded-full p-0.5 shadow-2xs border border-slate-300"
                          style={{ left: `${geom.arrPercent}%` }}
                          title={`Arrival at depot: ${v.arrivalTime}`}
                        >
                          <span className="material-symbols-outlined text-[13px]">power</span>
                        </div>

                        {/* Departure Deadline Marker (flag icon) */}
                        <div
                          className="absolute z-20 -translate-x-1/2 flex items-center justify-center text-[#ba1a1a] bg-white rounded-full p-0.5 shadow-2xs border border-red-300"
                          style={{ left: `${geom.depPercent}%` }}
                          title={`Departure deadline: ${v.departureTime}`}
                        >
                          <span className="material-symbols-outlined text-[13px]">flag</span>
                        </div>

                        {/* Target SOC Reached Marker (checkmark icon at estimated end) */}
                        <div
                          className="absolute z-20 -translate-x-1/2 flex items-center justify-center text-[#006c4a] bg-emerald-100 rounded-full p-0.5 shadow-2xs border border-emerald-400"
                          style={{ left: `${Math.min(98, geom.startPercent + geom.durationPercent)}%` }}
                          title={`Target ${v.targetSOC}% SOC reached`}
                        >
                          <span className="material-symbols-outlined text-[12px]">check</span>
                        </div>

                        {/* Active Charging Block Bar */}
                        <div
                          className={`absolute rounded h-6 text-white text-[10px] font-semibold flex items-center px-2 shadow-xs transition-all z-20 ${geom.barColor}`}
                          style={{
                            left: `${geom.startPercent}%`,
                            width: `${geom.durationPercent}%`,
                          }}
                        >
                          <span className="truncate">
                            {geom.powerKw} kW • {geom.energyAddedKwh} kWh
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Bay View */
                chargers.map((b) => (
                  <div
                    key={b.id}
                    className="grid grid-cols-12 gap-2 items-center py-2.5 px-3 hover:bg-[#eff4ff]/60 transition-colors"
                  >
                    <div className="col-span-4 flex items-center justify-between pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#00163d]">{b.id}</span>
                        <span className="text-[#0b1c30] text-[12px] font-medium">{b.location || b.type}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-[#eff4ff] text-[#00163d]">
                          {b.maxPower} kW
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'Charging'
                          ? 'bg-blue-100 text-blue-900'
                          : b.status === 'Available'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-red-100 text-red-900'
                      }`}>
                        {b.status}
                      </span>
                    </div>

                    <div className="col-span-8 relative h-8 bg-slate-50 rounded flex items-center">
                      <div
                        className="absolute top-0 bottom-0 bg-amber-100/40 border-x border-amber-300 pointer-events-none"
                        style={{ left: `${(17 / 24) * 100}%`, width: `${(6 / 24) * 100}%` }}
                      ></div>

                      <div
                        className="absolute top-0 bottom-0 w-0 border-r-2 border-dashed border-red-600 z-30"
                        style={{ left: `${(17.7 / 24) * 100}%` }}
                      ></div>

                      {/* Active Bay charging duration */}
                      {b.status === 'Charging' && (
                        <div
                          className="absolute rounded h-6 bg-[#00163d] text-white text-[10px] font-semibold flex items-center px-2 z-20"
                          style={{ left: `${(16 / 24) * 100}%`, width: `${(6 / 24) * 100}%` }}
                        >
                          <span className="truncate">{b.connectedVehicleId || b.assignedVehicleId || 'EV-1001'} • {b.maxPower} kW</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Hover Tooltip Card if vehicle hovered */}
        {hoveredVehicle && (
          <div className="p-3 rounded-lg bg-[#eff4ff] border border-blue-200 mt-3 flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-[#00163d]">{hoveredVehicle.id}</span>
              <span className="text-[#44464f]">Arrival: <strong>{hoveredVehicle.arrivalTime}</strong></span>
              <span className="text-[#ba1a1a]">Departure: <strong>{hoveredVehicle.departureTime}</strong></span>
              <span className="text-[#006c4a]">Target SOC: <strong>{hoveredVehicle.targetSOC}%</strong></span>
              <span className="text-[#00163d]">Energy Required: <strong>{hoveredVehicle.requiredEnergy} kWh</strong></span>
            </div>
            <span className="text-[11px] font-mono text-[#006c4a] font-bold">
              Assigned Bay: {hoveredVehicle.assignedBay || 'Bay 04'} • Rate: ₹4.20/kWh (Off-Peak)
            </span>
          </div>
        )}
      </div>

      {/* 5. COINCIDENT DEPOT POWER CURVE (ALIGNED BELOW GANTT) */}
      <div className="p-4 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-[15px] font-bold text-[#00163d] uppercase tracking-wider">
              Coincident Depot Power Demand Curve (24-Hour Profile)
            </h2>
            <p className="text-[12px] text-[#44464f]">
              Synchronized total depot load (kW) across all 12 bays. Shaded red zone indicates 450 kW warning threshold.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-[#00163d]">
              <span className="w-3 h-3 bg-[#00163d] rounded-xs"></span>
              <span>Optimized Load (kW)</span>
            </span>
            {showUncontrolled && (
              <span className="flex items-center gap-1.5 text-[#ba1a1a]">
                <span className="w-3 h-0.5 border-b border-dashed border-[#ba1a1a]"></span>
                <span>Unmanaged Baseline (~720 kW Peak)</span>
              </span>
            )}
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="w-3 h-0.5 bg-amber-600"></span>
              <span>500 kW Contract Ceiling</span>
            </span>
          </div>
        </div>

        {/* 24-Hour Aligned Area Chart Simulation */}
        <div className="relative w-full h-56 bg-[#eff4ff] rounded-lg p-3 flex flex-col justify-between overflow-hidden border border-blue-100">
          {/* Warning Zone: Shaded Area Above 450 kW (90% threshold) */}
          <div
            className="absolute left-0 right-0 top-0 bg-red-100/50 border-b border-red-300 pointer-events-none z-0"
            style={{ height: `${(1 - 450 / 800) * 100}%` }}
          >
            <span className="absolute right-3 top-1 text-[10px] font-bold text-red-700 font-mono">
              CRITICAL DEMAND WARNING ZONE (&gt; 450 kW)
            </span>
          </div>

          {/* Peak Limit Line: Horizontal Line at 500 kW */}
          <div
            className="absolute left-0 right-0 border-b-2 border-amber-600 z-10 pointer-events-none"
            style={{ top: `${(1 - 500 / 800) * 100}%` }}
          >
            <span className="absolute left-3 -top-4 text-[10px] font-bold text-amber-900 font-mono bg-amber-100 px-1.5 py-0.2 rounded">
              Contract Demand Limit: 500 kW
            </span>
          </div>

          {/* Current Time Line at 17:42 */}
          <div
            className="absolute top-0 bottom-0 w-0 border-r-2 border-dashed border-red-600 z-20 pointer-events-none"
            style={{ left: `${(17.7 / 24) * 100}%` }}
          ></div>

          {/* Bar Chart Columns per hour */}
          <div className="relative z-10 flex-1 grid grid-cols-24 gap-1 items-end pt-8">
            {loadProfilePoints.map((pt) => {
              const optHeight = Math.min(100, (pt.optKw / 800) * 100);
              const unctrlHeight = Math.min(100, (pt.unctrlKw / 800) * 100);

              return (
                <div key={pt.hour} className="relative h-full flex flex-col justify-end items-center group">
                  {/* Unmanaged Ghost Bar / Line */}
                  {showUncontrolled && (
                    <div
                      className="absolute bottom-0 w-full max-w-[12px] bg-red-200/60 border-t border-dashed border-red-600 rounded-t z-0"
                      style={{ height: `${unctrlHeight}%` }}
                    ></div>
                  )}

                  {/* Optimized Load Column */}
                  <div
                    className="w-full max-w-[14px] bg-[#00163d] group-hover:bg-[#0f2b5c] transition-all rounded-t z-10"
                    style={{ height: `${optHeight}%` }}
                  ></div>

                  {/* Hover Tag */}
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-[#00163d] text-white font-mono text-[9px] px-1.5 py-0.5 rounded shadow-xs z-30 whitespace-nowrap pointer-events-none">
                    {pt.time}: {pt.optKw} kW
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Hour Ticks */}
          <div className="relative z-10 grid grid-cols-12 text-[10px] font-mono text-[#44464f] border-t border-slate-300 pt-1">
            {timelineHours.map((th) => (
              <span key={th}>{th}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
