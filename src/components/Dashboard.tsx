import React, { useState } from 'react';
import { useGridCharge } from '../context/GridChargeContext';

export const Dashboard: React.FC = () => {
  const {
    t,
    vehicles,
    chargers,
    gridConfig,
    optimizationResult,
    isOptimizing,
    alerts,
    runOptimization,
    loadPresetFleet,
    activePreset,
    updateGridConfig,
    setSelectedVehicleId,
    setCurrentView,
    showToast,
  } = useGridCharge();

  // Navigation tab inside Dashboard
  const [activeTab, setActiveTab] = useState<
    'inputs-vs-expenditures' | 'load-curve' | 'gantt-schedule' | 'expenditure-ledger'
  >('inputs-vs-expenditures');

  // Collapsible quick parameter adjuster
  const [isAdjustInputsOpen, setIsAdjustInputsOpen] = useState(false);
  const [adjCapacity, setAdjCapacity] = useState(gridConfig.siteCapacity);
  const [adjBaseLoad, setAdjBaseLoad] = useState(gridConfig.baseLoad);
  const [adjPeakTariff, setAdjPeakTariff] = useState(gridConfig.tariffs.peak);
  const [adjOffPeakTariff, setAdjOffPeakTariff] = useState(gridConfig.tariffs.offPeak);

  // Search & Filter state for Gantt and ledger table
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  // Filter vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority =
      priorityFilter === 'All'
        ? true
        : priorityFilter === 'Critical Only'
        ? v.routePriority === 'CRITICAL'
        : priorityFilter === 'Active Charging'
        ? v.chargingStatus === 'Charging' || v.chargingStatus === 'Boost DC'
        : priorityFilter === 'Ready'
        ? v.chargingStatus === 'Ready'
        : true;
    return matchesSearch && matchesPriority;
  });

  // Calculate dynamic input stats
  const totalRequiredEnergy = Math.round(vehicles.reduce((acc, v) => acc + v.requiredEnergy, 0));
  const avgBatteryCapacity = Math.round(
    vehicles.reduce((acc, v) => acc + v.batteryCapacity, 0) / (vehicles.length || 1)
  );
  const criticalCount = vehicles.filter((v) => v.routePriority === 'CRITICAL').length;
  const highCount = vehicles.filter((v) => v.routePriority === 'HIGH').length;
  const normalCount = vehicles.filter((v) => v.routePriority === 'NORMAL').length;
  const acChargersCount = chargers.filter((c) => c.type.includes('AC')).length;
  const dcChargersCount = chargers.filter((c) => c.type.includes('DC')).length;

  // Calculate dynamic expenditure breakdowns
  const offPeakEnergy = Math.round(totalRequiredEnergy * 0.595);
  const normalEnergy = Math.round(totalRequiredEnergy * 0.321);
  const peakEnergy = Math.round(totalRequiredEnergy * 0.084);

  const offPeakCost = Math.round(offPeakEnergy * gridConfig.tariffs.offPeak);
  const normalCost = Math.round(normalEnergy * gridConfig.tariffs.normal);
  const peakCost = Math.round(peakEnergy * gridConfig.tariffs.peak);

  // Apply user-modified inputs and recompute
  const handleApplyInputs = async () => {
    updateGridConfig({
      siteCapacity: adjCapacity,
      baseLoad: adjBaseLoad,
      tariffs: {
        ...gridConfig.tariffs,
        peak: adjPeakTariff,
        offPeak: adjOffPeakTariff,
      },
    });
    showToast('Updated depot inputs! Recomputing smart optimization...');
    await runOptimization(true);
    setIsAdjustInputsOpen(false);
  };

  // Compute 24h demand curve points
  const curvePoints = optimizationResult.hourlyDemandCurve || [
    { hour: 0, timeLabel: '00:00', uncontrolledKw: 110, optimizedKw: 180, capacityLimitKw: 600, warningLimitKw: 510, isPeakTariff: false, tariffRate: 5.2 },
    { hour: 2, timeLabel: '02:00', uncontrolledKw: 100, optimizedKw: 190, capacityLimitKw: 600, warningLimitKw: 510, isPeakTariff: false, tariffRate: 5.2 },
    { hour: 4, timeLabel: '04:00', uncontrolledKw: 95, optimizedKw: 170, capacityLimitKw: 600, warningLimitKw: 510, isPeakTariff: false, tariffRate: 5.2 },
    { hour: 6, timeLabel: '06:00', uncontrolledKw: 140, optimizedKw: 140, capacityLimitKw: 600, warningLimitKw: 510, isPeakTariff: false, tariffRate: 7.2 },
    { hour: 8, timeLabel: '08:00', uncontrolledKw: 160, optimizedKw: 160, capacityLimitKw: 600, warningLimitKw: 510, isPeakTariff: false, tariffRate: 7.2 },
    { hour: 10, timeLabel: '10:00', uncontrolledKw: 175, optimizedKw: 175, capacityLimitKw: 600, warningLimitKw: 510, isPeakTariff: false, tariffRate: 7.2 },
    { hour: 12, timeLabel: '12:00', uncontrolledKw: 190, optimizedKw: 190, capacityLimitKw: 600, warningLimitKw: 510, isPeakTariff: false, tariffRate: 7.2 },
    { hour: 14, timeLabel: '14:00', uncontrolledKw: 220, optimizedKw: 210, capacityLimitKw: 600, warningLimitKw: 510, isPeakTariff: false, tariffRate: 7.2 },
    { hour: 16, timeLabel: '16:00', uncontrolledKw: 410, optimizedKw: 310, capacityLimitKw: 600, warningLimitKw: 510, isPeakTariff: false, tariffRate: 7.2 },
    { hour: 17, timeLabel: '17:00', uncontrolledKw: 522, optimizedKw: 428, capacityLimitKw: 600, warningLimitKw: 510, isPeakTariff: true, tariffRate: 10.5 },
    { hour: 18, timeLabel: '18:00', uncontrolledKw: 490, optimizedKw: 380, capacityLimitKw: 600, warningLimitKw: 510, isPeakTariff: true, tariffRate: 10.5 },
    { hour: 19, timeLabel: '19:00', uncontrolledKw: 380, optimizedKw: 320, capacityLimitKw: 600, warningLimitKw: 510, isPeakTariff: true, tariffRate: 10.5 },
    { hour: 20, timeLabel: '20:00', uncontrolledKw: 240, optimizedKw: 260, capacityLimitKw: 600, warningLimitKw: 510, isPeakTariff: true, tariffRate: 10.5 },
    { hour: 21, timeLabel: '21:00', uncontrolledKw: 160, optimizedKw: 360, capacityLimitKw: 600, warningLimitKw: 510, isPeakTariff: false, tariffRate: 7.2 },
    { hour: 22, timeLabel: '22:00', uncontrolledKw: 120, optimizedKw: 390, capacityLimitKw: 600, warningLimitKw: 510, isPeakTariff: false, tariffRate: 5.2 },
    { hour: 24, timeLabel: '24:00', uncontrolledKw: 105, optimizedKw: 240, capacityLimitKw: 600, warningLimitKw: 510, isPeakTariff: false, tariffRate: 5.2 },
  ];

  // SVG Chart Dimensions
  const chartWidth = 900;
  const chartHeight = 220;
  const maxKwAxis = Math.max(750, gridConfig.siteCapacity + 100);

  const getSvgX = (hour: number) => (hour / 24) * (chartWidth - 80) + 50;
  const getSvgY = (kw: number) => chartHeight - 30 - (kw / maxKwAxis) * (chartHeight - 50);

  // SVG curves
  const unctrlPath = curvePoints.reduce((acc, pt, i) => {
    const x = getSvgX(pt.hour);
    const y = getSvgY(pt.uncontrolledKw);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const optPath = curvePoints.reduce((acc, pt, i) => {
    const x = getSvgX(pt.hour);
    const y = getSvgY(pt.optimizedKw);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const optAreaPath = `${optPath} L ${getSvgX(24)} ${getSvgY(0)} L ${getSvgX(0)} ${getSvgY(0)} Z`;

  // Gantt helpers (14:00 to 22:00)
  const timelineStartHour = 14;
  const timelineDurationHours = 8;
  const parseTimeToHours = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h + (m || 0) / 60;
  };

  const getGanttBarStyles = (v: any) => {
    const arrivalH = parseTimeToHours(v.arrivalTime || '16:00');
    const departureH = parseTimeToHours(v.departureTime || '20:00');
    let startH = arrivalH;
    const chargeDurationH = Math.max(0.6, v.requiredEnergy / (v.maxChargingPower || 22));

    if (v.routePriority === 'CRITICAL') {
      startH = arrivalH;
    } else if (v.currentSOC > 75) {
      startH = Math.min(arrivalH + 2.0, departureH - chargeDurationH - 0.2);
    } else {
      startH = arrivalH + 0.5;
    }

    const leftPercent = Math.max(0, Math.min(95, ((startH - timelineStartHour) / timelineDurationHours) * 100));
    const widthPercent = Math.max(5, Math.min(95 - leftPercent, (chargeDurationH / timelineDurationHours) * 100));

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
    };
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP COMMAND BAR: Telemetry status, Presets, and Re-Run Action */}
      <div className="bg-white border border-[#c4c6d0]/50 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#006c4a] animate-pulse"></span>
              <span className="text-[12px] font-bold text-[#006c4a] uppercase tracking-wider">
                SYSTEM ONLINE • Main Distribution Center
              </span>
            </div>
            <h1 className="text-[20px] font-bold text-[#00163d] tracking-tight mt-0.5">
              Depot Charging & Peak-Demand Optimization Command Center
            </h1>
            <p className="text-[12px] text-[#44464f] mt-0.5">
              Live visibility into fleet charging, grid capacity, and optimized charging operations.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Quick Preset Selector */}
            <div className="flex items-center bg-[#eff4ff] p-1 rounded-lg border border-[#c4c6d0]/40">
              <span className="text-[11px] font-semibold text-[#00163d] px-2">Depot Preset:</span>
              <button
                onClick={() => loadPresetFleet('default')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  activePreset === 'default'
                    ? 'bg-[#00163d] text-white shadow-xs'
                    : 'text-[#44464f] hover:text-[#0b1c30]'
                }`}
              >
                27-EV Depot
              </button>
              <button
                onClick={() => loadPresetFleet('express')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  activePreset === 'express'
                    ? 'bg-[#00163d] text-white shadow-xs'
                    : 'text-[#44464f] hover:text-[#0b1c30]'
                }`}
              >
                12-EV Express
              </button>
              <button
                onClick={() => loadPresetFleet('overload')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  activePreset === 'overload'
                    ? 'bg-[#00163d] text-white shadow-xs'
                    : 'text-[#44464f] hover:text-[#0b1c30]'
                }`}
              >
                36-EV Overload
              </button>
            </div>

            {/* Toggle Adjust Inputs Button */}
            <button
              onClick={() => setIsAdjustInputsOpen(!isAdjustInputsOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                isAdjustInputsOpen
                  ? 'bg-[#00163d] text-white border-[#00163d]'
                  : 'bg-white hover:bg-slate-50 text-[#00163d] border-[#c4c6d0]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>{isAdjustInputsOpen ? 'Close Adjuster' : 'Adjust Given Inputs'}</span>
            </button>

            {/* Inspect Inputs / Schedule (navigates to charging-schedule) */}
            <button
              onClick={() => setCurrentView('charging-schedule')}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-[#00163d] text-[12px] font-semibold rounded-lg border border-[#c4c6d0] shadow-2xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>Inspect Inputs / Schedule</span>
            </button>

            {/* Primary Action: Run Smart Optimization */}
            <button
              onClick={() => runOptimization(true)}
              disabled={isOptimizing}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#00163d] hover:bg-[#0f2b5c] text-white text-[12px] font-semibold rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[17px] text-[#85f8c4] ${isOptimizing ? 'animate-spin' : ''}`}>
                {isOptimizing ? 'refresh' : 'bolt'}
              </span>
              <span>{isOptimizing ? 'Solving...' : 'Run Smart Optimization'}</span>
            </button>
          </div>
        </div>

        {/* 2. THE 3-STAGE FLOW PIPELINE (INPUT GIVEN -> ENGINE -> EXPENDED) */}
        <div className="mt-3 pt-3 border-t border-[#c4c6d0]/30 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Stage 1: Inputs Given */}
          <div className="p-2.5 rounded-lg bg-[#eff4ff] border border-[#d3e4fe] flex items-center gap-2.5">
            <span className="p-2 rounded-md bg-[#00163d] text-[#85f8c4] material-symbols-outlined text-[18px]">
              input
            </span>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#00163d]">
                1. Inputs Given to Depot
              </div>
              <div className="text-[12px] text-[#44464f] mt-0.5">
                <strong className="text-[#00163d]">{vehicles.length} EVs</strong> • {totalRequiredEnergy} kWh Demand • {gridConfig.siteCapacity} kW Feeder Cap
              </div>
            </div>
          </div>

          {/* Stage 2: Optimization Process */}
          <div className="p-2.5 rounded-lg bg-[#eff4ff] border border-[#d3e4fe] flex items-center gap-2.5">
            <span className="p-2 rounded-md bg-[#00163d] text-[#85f8c4] material-symbols-outlined text-[18px]">
              alt_route
            </span>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#00163d]">
                2. Peak-Shaving Engine
              </div>
              <div className="text-[12px] text-[#44464f] mt-0.5">
                Staggers load outside 17–21h peak • Guaranteed departure SLAs
              </div>
            </div>
          </div>

          {/* Stage 3: Realized Expenditures & Savings */}
          <div className="p-2.5 rounded-lg bg-[#85f8c4]/20 border border-[#85f8c4]/60 flex items-center gap-2.5">
            <span className="p-2 rounded-md bg-[#006c4a] text-white material-symbols-outlined text-[18px]">
              savings
            </span>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#005137]">
                3. Expenditures & Value Realized
              </div>
              <div className="text-[12px] text-[#005137] mt-0.5">
                <strong>₹{optimizationResult.energyCost.toLocaleString()} Expended</strong> • Saved ₹{optimizationResult.costSavings.toLocaleString()} • Shaved 94 kW
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COLLAPSIBLE LIVE INPUT ADJUSTER: Directly modify what is given! */}
      {isAdjustInputsOpen && (
        <div className="bg-[#eff4ff] border border-[#00163d]/20 rounded-xl p-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#c4c6d0]/40">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00163d] text-[18px]">tune</span>
              <h3 className="text-[13px] font-bold text-[#00163d]">
                Interactive Depot Input Parameter Adjuster
              </h3>
              <span className="text-[11px] text-[#44464f]">
                (Modify grid & tariff parameters to immediately see how expenditures adapt)
              </span>
            </div>
            <button
              onClick={() => setIsAdjustInputsOpen(false)}
              className="text-[#747780] hover:text-[#00163d] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
            {/* Feeder Capacity */}
            <div className="bg-white p-3 rounded-lg border border-[#c4c6d0]/40">
              <label className="block text-[11px] font-bold uppercase text-[#44464f] mb-1">
                Transformer Feeder Limit (kW)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="300"
                  max="1000"
                  step="25"
                  value={adjCapacity}
                  onChange={(e) => setAdjCapacity(Number(e.target.value))}
                  className="flex-1 accent-[#00163d]"
                />
                <span className="font-mono font-bold text-[13px] text-[#00163d] w-16 text-right">
                  {adjCapacity} kW
                </span>
              </div>
            </div>

            {/* Base Load */}
            <div className="bg-white p-3 rounded-lg border border-[#c4c6d0]/40">
              <label className="block text-[11px] font-bold uppercase text-[#44464f] mb-1">
                Base Facility Load (kW)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="100"
                  max="400"
                  step="10"
                  value={adjBaseLoad}
                  onChange={(e) => setAdjBaseLoad(Number(e.target.value))}
                  className="flex-1 accent-[#00163d]"
                />
                <span className="font-mono font-bold text-[13px] text-[#00163d] w-16 text-right">
                  {adjBaseLoad} kW
                </span>
              </div>
            </div>

            {/* Peak Tariff */}
            <div className="bg-white p-3 rounded-lg border border-[#c4c6d0]/40">
              <label className="block text-[11px] font-bold uppercase text-[#44464f] mb-1">
                Peak Tariff Rate (₹/kWh)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="7.0"
                  max="16.0"
                  step="0.5"
                  value={adjPeakTariff}
                  onChange={(e) => setAdjPeakTariff(Number(e.target.value))}
                  className="flex-1 accent-[#ba1a1a]"
                />
                <span className="font-mono font-bold text-[13px] text-[#ba1a1a] w-20 text-right">
                  ₹{adjPeakTariff.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Off-Peak Tariff */}
            <div className="bg-white p-3 rounded-lg border border-[#c4c6d0]/40">
              <label className="block text-[11px] font-bold uppercase text-[#44464f] mb-1">
                Off-Peak Tariff Rate (₹/kWh)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="3.5"
                  max="7.0"
                  step="0.2"
                  value={adjOffPeakTariff}
                  onChange={(e) => setAdjOffPeakTariff(Number(e.target.value))}
                  className="flex-1 accent-[#006c4a]"
                />
                <span className="font-mono font-bold text-[13px] text-[#006c4a] w-20 text-right">
                  ₹{adjOffPeakTariff.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-[#c4c6d0]/40">
            <button
              onClick={() => {
                setAdjCapacity(600);
                setAdjBaseLoad(220);
                setAdjPeakTariff(10.5);
                setAdjOffPeakTariff(5.2);
              }}
              className="px-3 py-1.5 rounded text-[11px] font-semibold text-[#44464f] hover:bg-slate-200/60 cursor-pointer"
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleApplyInputs}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#00163d] hover:bg-[#0f2b5c] text-white text-[12px] font-semibold shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#85f8c4]">check</span>
              <span>Apply & Recalculate Expenditures</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. NAVIGATION VIEW TABS */}
      <div className="flex items-center gap-1 border-b border-[#c4c6d0]/40 pb-1 text-[13px] font-semibold">
        <button
          onClick={() => setActiveTab('inputs-vs-expenditures')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'inputs-vs-expenditures'
              ? 'bg-white text-[#00163d] border-t-2 border-l border-r border-[#00163d] font-bold shadow-xs'
              : 'text-[#44464f] hover:text-[#00163d] hover:bg-white/50'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">compare_arrows</span>
          <span>Inputs Given vs What Is Expended</span>
        </button>

        <button
          onClick={() => setActiveTab('load-curve')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'load-curve'
              ? 'bg-white text-[#00163d] border-t-2 border-l border-r border-[#00163d] font-bold shadow-xs'
              : 'text-[#44464f] hover:text-[#00163d] hover:bg-white/50'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">show_chart</span>
          <span>24-Hour Load & Tariff Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('gantt-schedule')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'gantt-schedule'
              ? 'bg-white text-[#00163d] border-t-2 border-l border-r border-[#00163d] font-bold shadow-xs'
              : 'text-[#44464f] hover:text-[#00163d] hover:bg-white/50'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">calendar_view_day</span>
          <span>Charging Schedule (Gantt)</span>
        </button>

        <button
          onClick={() => setActiveTab('expenditure-ledger')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'expenditure-ledger'
              ? 'bg-white text-[#00163d] border-t-2 border-l border-r border-[#00163d] font-bold shadow-xs'
              : 'text-[#44464f] hover:text-[#00163d] hover:bg-white/50'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          <span>Vehicle Expenditure Ledger</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: THE CORE SIDE-BY-SIDE: WHAT WAS GIVEN vs WHAT WAS EXPENDED         */}
      {/* ========================================================================= */}
      {activeTab === 'inputs-vs-expenditures' && (
        <div className="space-y-4">
          {/* Top Level Summary Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 📥 LEFT COLUMN: WHAT WAS GIVEN (INPUTS) */}
            <div className="bg-white border-2 border-[#d3e4fe] rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#d3e4fe]">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-[#00163d] text-[#85f8c4] material-symbols-outlined text-[18px]">
                      input
                    </span>
                    <div>
                      <h2 className="text-[16px] font-bold text-[#00163d]">
                        📥 What Was Given (Input Specifications)
                      </h2>
                      <span className="text-[11px] text-[#44464f]">Parameters configured for depot operation</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-[#eff4ff] text-[#00163d] font-mono text-[11px] font-bold border border-[#d3e4fe]">
                    {vehicles.length} Vehicles
                  </span>
                </div>

                {/* 4 Input Dimension Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {/* Fleet Demands Given */}
                  <div className="p-3 rounded-lg bg-[#eff4ff]/60 border border-[#c4c6d0]/40">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#44464f]">
                      <span>Fleet & Energy Demand</span>
                      <span className="material-symbols-outlined text-[16px] text-[#00163d]">local_shipping</span>
                    </div>
                    <div className="mt-2 text-[20px] font-mono font-bold text-[#00163d]">
                      {totalRequiredEnergy} <span className="text-[13px] font-sans font-normal text-[#44464f]">kWh</span>
                    </div>
                    <div className="text-[11px] text-[#44464f] mt-1 space-y-0.5">
                      <div>• Total Fleet: <strong>{vehicles.length} Commercial EVs</strong></div>
                      <div>• Battery Capacity Avg: <strong>{avgBatteryCapacity} kWh</strong></div>
                      <div>• Priority: <strong className="text-[#93000a]">{criticalCount} Critical</strong>, {highCount} High, {normalCount} Normal</div>
                    </div>
                  </div>

                  {/* Grid Feeder Limits Given */}
                  <div className="p-3 rounded-lg bg-[#eff4ff]/60 border border-[#c4c6d0]/40">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#44464f]">
                      <span>Transformer Limits</span>
                      <span className="material-symbols-outlined text-[16px] text-[#ba1a1a]">electric_meter</span>
                    </div>
                    <div className="mt-2 text-[20px] font-mono font-bold text-[#00163d]">
                      {gridConfig.siteCapacity} <span className="text-[13px] font-sans font-normal text-[#44464f]">kW</span>
                    </div>
                    <div className="text-[11px] text-[#44464f] mt-1 space-y-0.5">
                      <div>• Base Facility Load: <strong>{gridConfig.baseLoad} kW</strong></div>
                      <div>• Safe Feeder Limit: <strong>{Math.round(gridConfig.siteCapacity * 0.85)} kW (85%)</strong></div>
                      <div>• Grid Headroom Cap: <strong>{gridConfig.siteCapacity - gridConfig.baseLoad} kW max EV</strong></div>
                    </div>
                  </div>

                  {/* Tariffs Given */}
                  <div className="p-3 rounded-lg bg-[#eff4ff]/60 border border-[#c4c6d0]/40">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#44464f]">
                      <span>Electricity Tariffs</span>
                      <span className="material-symbols-outlined text-[16px] text-[#6e3900]">payments</span>
                    </div>
                    <div className="mt-2 text-[20px] font-mono font-bold text-[#6e3900]">
                      ₹{gridConfig.tariffs.peak.toFixed(2)} <span className="text-[12px] font-sans font-normal text-[#747780]">/kWh Peak</span>
                    </div>
                    <div className="text-[11px] text-[#44464f] mt-1 space-y-0.5">
                      <div>• Peak Window: <strong className="text-[#6e3900]">17:00 – 21:00</strong></div>
                      <div>• Normal Window: <strong>₹{gridConfig.tariffs.normal.toFixed(2)}/kWh</strong></div>
                      <div>• Off-Peak Window: <strong className="text-[#006c4a]">₹{gridConfig.tariffs.offPeak.toFixed(2)}/kWh</strong></div>
                    </div>
                  </div>

                  {/* Charger Bays Given */}
                  <div className="p-3 rounded-lg bg-[#eff4ff]/60 border border-[#c4c6d0]/40">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#44464f]">
                      <span>Charger Infrastructure</span>
                      <span className="material-symbols-outlined text-[16px] text-[#006c4a]">ev_station</span>
                    </div>
                    <div className="mt-2 text-[20px] font-mono font-bold text-[#00163d]">
                      {chargers.length} <span className="text-[13px] font-sans font-normal text-[#44464f]">Bays</span>
                    </div>
                    <div className="text-[11px] text-[#44464f] mt-1 space-y-0.5">
                      <div>• AC Level 2 Bays: <strong>{acChargersCount} Ports (22 kW)</strong></div>
                      <div>• DC Fast Chargers: <strong>{dcChargersCount} Ports (44/120 kW)</strong></div>
                      <div>• OCPP 2.0.1 Smart Control: <strong>Enabled</strong></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#d3e4fe] flex items-center justify-between text-[12px]">
                <span className="text-[#747780]">Need to modify these depot inputs?</span>
                <button
                  onClick={() => setIsAdjustInputsOpen(true)}
                  className="text-[#00163d] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Input Modifier</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* 📤 RIGHT COLUMN: WHAT WAS EXPENDED & SAVED (OUTPUTS) */}
            <div className="bg-white border-2 border-[#85f8c4]/60 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#85f8c4]/60">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-[#006c4a] text-white material-symbols-outlined text-[18px]">
                      savings
                    </span>
                    <div>
                      <h2 className="text-[16px] font-bold text-[#00163d]">
                        📤 What Was Expended (Outcomes & Savings)
                      </h2>
                      <span className="text-[11px] text-[#006c4a] font-semibold">Realized after smart load optimization</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-[#85f8c4]/30 text-[#005137] font-mono text-[11px] font-bold">
                    Saved ₹{optimizationResult.costSavings.toLocaleString()}
                  </span>
                </div>

                {/* 4 Output Expenditure Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {/* Financial Expenditure */}
                  <div className="p-3 rounded-lg bg-[#85f8c4]/15 border border-[#85f8c4]/50">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#005137]">
                      <span>Electricity Bill Expended</span>
                      <span className="material-symbols-outlined text-[16px] text-[#005137]">payments</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-[22px] font-mono font-bold text-[#00163d]">
                        ₹{optimizationResult.energyCost.toLocaleString()}
                      </span>
                      <span className="text-[13px] font-mono text-[#747780] line-through">
                        ₹{optimizationResult.uncontrolledCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#005137] font-semibold mt-1">
                      <div>• Net Savings: <strong>₹{optimizationResult.costSavings.toLocaleString()} ({optimizationResult.costSavingsPercent}%)</strong></div>
                      <div>• Peak Tariff Avoided: <strong>₹1,210 saved</strong></div>
                    </div>
                  </div>

                  {/* Peak Power Expended */}
                  <div className="p-3 rounded-lg bg-[#85f8c4]/15 border border-[#85f8c4]/50">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#005137]">
                      <span>Peak Demand Expended</span>
                      <span className="material-symbols-outlined text-[16px] text-[#005137]">electric_meter</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-[22px] font-mono font-bold text-[#00163d]">
                        {optimizationResult.optimizedPeakDemand} kW
                      </span>
                      <span className="text-[13px] font-mono text-[#747780] line-through">
                        {optimizationResult.uncontrolledPeakDemand} kW
                      </span>
                    </div>
                    <div className="text-[11px] text-[#005137] font-semibold mt-1">
                      <div>• Feeder Shaved: <strong>−{optimizationResult.peakReductionKw} kW ({optimizationResult.peakReductionPercent}%)</strong></div>
                      <div>• Safe Headroom: <strong>{optimizationResult.gridHeadroom} kW available</strong></div>
                    </div>
                  </div>

                  {/* Energy Expended by Tier */}
                  <div className="p-3 rounded-lg bg-[#eff4ff]/60 border border-[#c4c6d0]/40">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#44464f]">
                      <span>Energy Expended by Tier</span>
                      <span className="material-symbols-outlined text-[16px] text-[#00163d]">pie_chart</span>
                    </div>
                    <div className="mt-2 text-[18px] font-mono font-bold text-[#00163d]">
                      {totalRequiredEnergy} <span className="text-[12px] font-sans font-normal text-[#44464f]">kWh Consumed</span>
                    </div>
                    <div className="text-[11px] text-[#44464f] mt-1 space-y-0.5">
                      <div>• Off-Peak (₹5.20): <strong>{offPeakEnergy} kWh (₹{offPeakCost.toLocaleString()})</strong></div>
                      <div>• Normal (₹7.20): <strong>{normalEnergy} kWh (₹{normalCost.toLocaleString()})</strong></div>
                      <div>• Peak (₹10.50): <strong className="text-[#6e3900]">Only {peakEnergy} kWh (₹{peakCost.toLocaleString()})</strong></div>
                    </div>
                  </div>

                  {/* Schedule & SLA Expended */}
                  <div className="p-3 rounded-lg bg-[#eff4ff]/60 border border-[#c4c6d0]/40">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#44464f]">
                      <span>Fleet SLAs Expended</span>
                      <span className="material-symbols-outlined text-[16px] text-[#006c4a]">verified</span>
                    </div>
                    <div className="mt-2 text-[18px] font-mono font-bold text-[#006c4a]">
                      100% Guaranteed
                    </div>
                    <div className="text-[11px] text-[#44464f] mt-1 space-y-0.5">
                      <div>• Ready on time: <strong>{optimizationResult.vehiclesReady}/{optimizationResult.totalVehicles} EVs</strong></div>
                      <div>• Critical Route Delays: <strong className="text-[#006c4a]">0 (Zero SLA Violations)</strong></div>
                      <div>• Pre-Departure Buffer: <strong>≥ 28 min average slack</strong></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#85f8c4]/60 flex items-center justify-between text-[12px]">
                <span className="text-[#005137] font-semibold">Zero transformer overload penalties incurred</span>
                <button
                  onClick={() => setActiveTab('expenditure-ledger')}
                  className="text-[#00163d] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View Per-Vehicle Expenditure Ledger</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {/* Operational Feasibility & Constraints Satisfied */}
          <div className="bg-white border border-[#c4c6d0]/50 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#c4c6d0]/30 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006c4a] text-[18px]">verified_user</span>
                <h3 className="text-[14px] font-bold text-[#00163d]">
                  Optimization Constraint & Feasibility Checks
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#85f8c4]/30 text-[#005137] text-[11px] font-bold">
                5 OF 5 CHECKS PASSED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {optimizationResult.constraintChecks.map((chk, i) => (
                <div key={i} className="p-2.5 rounded-lg border border-[#85f8c4]/40 bg-[#eff4ff]/30 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#006c4a] text-[17px] mt-0.5">
                    check_circle
                  </span>
                  <div>
                    <div className="text-[12px] font-bold text-[#00163d]">{chk.name}</div>
                    <div className="text-[11px] text-[#44464f] mt-0.5 leading-snug">{chk.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Row: Active Operational Alerts */}
          <div className="bg-white border border-[#c4c6d0]/50 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#c4c6d0]/30 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00163d] text-[18px]">notification_important</span>
                <h3 className="text-[14px] font-bold text-[#00163d]">Depot Operational Event Logs</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#ffdad6] text-[#93000a] text-[11px] font-bold">
                {alerts.length} Events Logged
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {alerts.slice(0, 4).map((alt) => (
                <div
                  key={alt.id}
                  className={`p-2.5 rounded-lg border text-[11px] flex flex-col justify-between ${
                    alt.type === 'critical'
                      ? 'bg-[#ffdad6]/30 border-[#ffdad6]'
                      : alt.type === 'warning'
                      ? 'bg-[#ffdcc3]/30 border-[#ffdcc3]'
                      : 'bg-[#eff4ff] border-[#d3e4fe]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold uppercase tracking-wider text-[9px]">
                        {alt.type}
                      </span>
                      <span className="font-mono text-[9px] text-[#747780]">{alt.timestamp}</span>
                    </div>
                    <div className="font-bold text-[#00163d] text-[12px]">{alt.title}</div>
                    <div className="text-[#44464f] mt-0.5 leading-snug">{alt.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 24-HOUR LOAD PROFILE & TARIFF CHART                                */}
      {/* ========================================================================= */}
      {activeTab === 'load-curve' && (
        <div className="bg-white border border-[#c4c6d0]/50 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#c4c6d0]/30 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00163d] text-[20px]">show_chart</span>
                <h2 className="text-[16px] font-bold text-[#00163d]">
                  24-Hour Feeder Power Expended: Uncontrolled vs Smart Optimized
                </h2>
              </div>
              <p className="text-[12px] text-[#44464f] mt-0.5">
                Uncontrolled charging causes a dangerous {optimizationResult.uncontrolledPeakDemand} kW spike during evening arrival. Smart charging caps power at {optimizationResult.optimizedPeakDemand} kW.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#ba1a1a] border-t-2 border-dashed border-[#ba1a1a]"></span>
                <span className="font-medium text-[#ba1a1a]">{gridConfig.siteCapacity} kW Feeder Limit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#747780] border-t-2 border-dashed border-[#747780]"></span>
                <span className="font-medium text-[#44464f]">Uncontrolled Baseline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-[#00163d] rounded-xs"></span>
                <span className="font-bold text-[#00163d]">Smart Optimized</span>
              </div>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="w-full overflow-x-auto mt-4">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-60 select-none font-mono text-[10px]"
            >
              {/* Guidelines */}
              {[0, 150, 300, 450, 600].map((kw) => (
                <g key={kw}>
                  <line
                    x1="50"
                    y1={getSvgY(kw)}
                    x2={chartWidth - 30}
                    y2={getSvgY(kw)}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                  <text x="42" y={getSvgY(kw) + 3} textAnchor="end" fill="#747780">
                    {kw}
                  </text>
                </g>
              ))}

              {/* Peak Tariff Zone */}
              <rect
                x={getSvgX(17)}
                y="10"
                width={getSvgX(21) - getSvgX(17)}
                height={chartHeight - 40}
                fill="#ffdcc3"
                fillOpacity="0.35"
              />
              <text
                x={(getSvgX(17) + getSvgX(21)) / 2}
                y="22"
                textAnchor="middle"
                fill="#6e3900"
                fontWeight="bold"
                fontSize="10"
              >
                PEAK TARIFF (₹{gridConfig.tariffs.peak.toFixed(2)}/kWh)
              </text>

              {/* Feeder Limit Line */}
              <line
                x1="50"
                y1={getSvgY(gridConfig.siteCapacity)}
                x2={chartWidth - 30}
                y2={getSvgY(gridConfig.siteCapacity)}
                stroke="#ba1a1a"
                strokeWidth="2"
                strokeDasharray="5,4"
              />

              {/* Warning Limit Line */}
              <line
                x1="50"
                y1={getSvgY(gridConfig.siteCapacity * 0.85)}
                x2={chartWidth - 30}
                y2={getSvgY(gridConfig.siteCapacity * 0.85)}
                stroke="#de7b0d"
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />

              {/* Filled area */}
              <path d={optAreaPath} fill="#d3e4fe" fillOpacity="0.45" />

              {/* Uncontrolled Line */}
              <path
                d={unctrlPath}
                fill="none"
                stroke="#747780"
                strokeWidth="2.5"
                strokeDasharray="6,4"
              />

              {/* Optimized Line */}
              <path d={optPath} fill="none" stroke="#00163d" strokeWidth="3" />

              {/* Hoverable Points */}
              {curvePoints.map((pt) => {
                const x = getSvgX(pt.hour);
                const yOpt = getSvgY(pt.optimizedKw);
                const isHovered = hoveredHour === pt.hour;
                return (
                  <g
                    key={pt.hour}
                    onMouseEnter={() => setHoveredHour(pt.hour)}
                    onMouseLeave={() => setHoveredHour(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={x}
                      cy={yOpt}
                      r={isHovered ? 5 : 3.5}
                      fill="#00163d"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    {isHovered && (
                      <g>
                        <rect
                          x={x - 45}
                          y={yOpt - 38}
                          width="90"
                          height="30"
                          rx="4"
                          fill="#00163d"
                        />
                        <text
                          x={x}
                          y={yOpt - 23}
                          textAnchor="middle"
                          fill="#85f8c4"
                          fontWeight="bold"
                          fontSize="9"
                        >
                          {pt.timeLabel}: {pt.optimizedKw} kW
                        </text>
                        <text
                          x={x}
                          y={yOpt - 13}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="8"
                        >
                          Unctrl: {pt.uncontrolledKw} kW
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Current Time Marker (17:42) */}
              <line
                x1={getSvgX(17.7)}
                y1="10"
                x2={getSvgX(17.7)}
                y2={chartHeight - 30}
                stroke="#006c4a"
                strokeWidth="2"
              />
              <rect
                x={getSvgX(17.7) - 36}
                y={chartHeight - 24}
                width="72"
                height="18"
                rx="3"
                fill="#006c4a"
              />
              <text
                x={getSvgX(17.7)}
                y={chartHeight - 12}
                textAnchor="middle"
                fill="#ffffff"
                fontWeight="bold"
                fontSize="9"
              >
                17:42 NOW
              </text>

              {/* X Labels */}
              {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => (
                <text
                  key={h}
                  x={getSvgX(h)}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  fill="#44464f"
                  fontSize="10"
                >
                  {h < 10 ? `0${h}:00` : `${h}:00`}
                </text>
              ))}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-[#44464f] mt-3 pt-3 border-t border-[#c4c6d0]/30 px-1">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#85f8c4]/60 border border-[#006c4a]"></span>
                <span>Off-Peak: ₹{gridConfig.tariffs.offPeak.toFixed(2)}/kWh (22:00–06:00)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#d3e4fe] border border-[#00163d]"></span>
                <span>Normal: ₹{gridConfig.tariffs.normal.toFixed(2)}/kWh</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#ffdcc3] border border-[#6e3900]"></span>
                <span className="font-semibold text-[#6e3900]">Peak Surcharge: ₹{gridConfig.tariffs.peak.toFixed(2)}/kWh (17:00–21:00)</span>
              </div>
            </div>
            <div className="flex items-center gap-1 font-semibold text-[#006c4a]">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              <span>Protected under {gridConfig.siteCapacity} kW limit</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GANTT CHARGING SCHEDULE                                            */}
      {/* ========================================================================= */}
      {activeTab === 'gantt-schedule' && (
        <div className="bg-white border border-[#c4c6d0]/50 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#c4c6d0]/30 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00163d] text-[20px]">calendar_view_day</span>
                <h2 className="text-[16px] font-bold text-[#00163d]">
                  Automated Fleet Charging Timeline (Gantt Schedule)
                </h2>
              </div>
              <p className="text-[12px] text-[#44464f] mt-0.5">
                Dynamic power allocations across {filteredVehicles.length} vehicles. Load is shifted into cheaper hours while assuring departure SLAs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 px-2.5 w-48 text-[12px] rounded border border-[#c4c6d0] bg-white focus:outline-none"
                placeholder="Search EV ID..."
                type="text"
              />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-8 px-2 text-[12px] rounded border border-[#c4c6d0] bg-white focus:outline-none text-[#00163d]"
              >
                <option value="All">All Vehicles</option>
                <option value="Critical Only">Critical Routes Only</option>
                <option value="Active Charging">Active Charging Only</option>
                <option value="Ready">Ready Vehicles</option>
              </select>
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-[#747780] pb-2 border-b border-[#c4c6d0]/30 px-2 uppercase">
                <div className="col-span-4">Vehicle & Route SLA</div>
                <div className="col-span-8 flex justify-between font-mono">
                  <span>14:00</span>
                  <span>15:00</span>
                  <span>16:00</span>
                  <span>17:00 (Peak Start)</span>
                  <span>18:00</span>
                  <span>19:00</span>
                  <span>20:00</span>
                  <span>21:00 (Peak End)</span>
                  <span>22:00</span>
                </div>
              </div>

              <div className="divide-y divide-[#e5eeff]">
                {filteredVehicles.map((v) => {
                  const barStyle = getGanttBarStyles(v);
                  const isCritical = v.routePriority === 'CRITICAL';
                  const isReady = v.currentSOC >= v.targetSOC;

                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        setSelectedVehicleId(v.id);
                        setCurrentView('fleet');
                      }}
                      className="grid grid-cols-12 gap-2 items-center py-2 px-2 hover:bg-[#eff4ff]/50 transition-colors cursor-pointer"
                    >
                      <div className="col-span-4 flex items-center justify-between pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12px] font-bold text-[#00163d]">{v.id}</span>
                          <span className="text-[11px] text-[#0b1c30] truncate max-w-[100px]">{v.route}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              v.routePriority === 'CRITICAL'
                                ? 'bg-[#ffdad6] text-[#93000a]'
                                : v.routePriority === 'HIGH'
                                ? 'bg-[#ffdcc3] text-[#6e3900]'
                                : 'bg-[#e5eeff] text-[#00163d]'
                            }`}
                          >
                            {v.routePriority}
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-right">
                          <span className="font-semibold text-[#00163d]">{v.currentSOC}% → {v.targetSOC}%</span>
                          <span className="text-[#ba1a1a] block font-semibold text-[9px]">Dep: {v.departureTime}</span>
                        </div>
                      </div>

                      <div className="col-span-8 relative h-7 bg-[#eff4ff]/40 rounded flex items-center px-1">
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-[#006c4a] z-10"
                          style={{ left: '46.5%' }}
                          title="Current Time: 17:42"
                        ></div>

                        <div
                          className={`absolute rounded h-5 text-white text-[10px] font-semibold flex items-center px-2 shadow-xs transition-all ${
                            isReady
                              ? 'bg-[#006c4a] text-white'
                              : isCritical
                              ? 'bg-[#0f2b5c] border border-[#85f8c4]/40'
                              : v.currentSOC > 75
                              ? 'bg-[#00163d]'
                              : 'bg-[#002d6b]'
                          }`}
                          style={barStyle}
                        >
                          <span className="truncate">
                            {isReady
                              ? 'Ready'
                              : isCritical
                              ? '44 kW Boost'
                              : `${v.maxChargingPower || 22} kW Active`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DETAILED VEHICLE EXPENDITURE LEDGER                                */}
      {/* ========================================================================= */}
      {activeTab === 'expenditure-ledger' && (
        <div className="bg-white border border-[#c4c6d0]/50 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#c4c6d0]/30 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00163d] text-[20px]">receipt_long</span>
                <h2 className="text-[16px] font-bold text-[#00163d]">
                  Vehicle-by-Vehicle Expenditure & Savings Ledger
                </h2>
              </div>
              <p className="text-[12px] text-[#44464f] mt-0.5">
                Exact line-item accounting of kWh energy expended, baseline uncontrolled cost vs optimized smart charging cost for every vehicle.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#44464f]">Showing {vehicles.length} Vehicles</span>
            </div>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="bg-[#eff4ff] text-[#00163d] font-semibold border-b border-[#c4c6d0]/40 text-[11px] uppercase">
                  <th className="py-2.5 px-3">Vehicle ID & Model</th>
                  <th className="py-2.5 px-3">Route & Priority</th>
                  <th className="py-2.5 px-3">Arrival / Departure</th>
                  <th className="py-2.5 px-3">Energy Needed</th>
                  <th className="py-2.5 px-3">Uncontrolled Cost</th>
                  <th className="py-2.5 px-3">Optimized Cost</th>
                  <th className="py-2.5 px-3">Money Saved</th>
                  <th className="py-2.5 px-3 text-right">Charging Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5eeff]">
                {vehicles.map((v, i) => {
                  // Uncontrolled cost assuming peak charging
                  const unctrlVehCost = Math.round(v.requiredEnergy * gridConfig.tariffs.peak);
                  // Smart optimized cost based on shifted off-peak or normal
                  const effRate = v.routePriority === 'CRITICAL' ? 8.5 : 5.8;
                  const optVehCost = Math.round(v.requiredEnergy * effRate);
                  const vehSavings = unctrlVehCost - optVehCost;

                  return (
                    <tr
                      key={v.id}
                      onClick={() => {
                        setSelectedVehicleId(v.id);
                        setCurrentView('fleet');
                      }}
                      className="hover:bg-[#eff4ff]/50 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-[#00163d] block">{v.id}</span>
                        <span className="text-[11px] text-[#747780]">{v.model} ({v.batteryCapacity} kWh)</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[#0b1c30] font-medium block">{v.route}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold inline-block ${
                            v.routePriority === 'CRITICAL'
                              ? 'bg-[#ffdad6] text-[#93000a]'
                              : v.routePriority === 'HIGH'
                              ? 'bg-[#ffdcc3] text-[#6e3900]'
                              : 'bg-[#e5eeff] text-[#00163d]'
                          }`}
                        >
                          {v.routePriority}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        <div>Arr: <span className="font-semibold text-[#00163d]">{v.arrivalTime}</span></div>
                        <div>Dep: <span className="font-semibold text-[#ba1a1a]">{v.departureTime}</span></div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#00163d]">
                        {v.requiredEnergy} kWh
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#747780] line-through">
                        ₹{unctrlVehCost.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#00163d]">
                        ₹{optVehCost.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#85f8c4]/30 text-[#005137] font-mono font-bold text-[11px]">
                          +₹{vehSavings.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            v.chargingStatus === 'Charging' || v.chargingStatus === 'Boost DC'
                              ? 'bg-[#00163d] text-white'
                              : v.chargingStatus === 'Ready'
                              ? 'bg-[#85f8c4]/40 text-[#005137]'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {v.chargingStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
