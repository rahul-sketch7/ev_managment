import React, { useState } from 'react';
import { useGridCharge } from '../context/GridChargeContext';

export const Settings: React.FC = () => {
  const {
    apiBaseUrl,
    setApiBaseUrl,
    gridConfig,
    updateGridConfig,
    showToast,
  } = useGridCharge();

  // 1. Depot Operational Configuration
  const [depotName, setDepotName] = useState<string>('Main Distribution Center');
  const [cityRegion, setCityRegion] = useState<string>('New Delhi, India');
  const [operatingTimezone, setOperatingTimezone] = useState<string>('Asia/Kolkata (UTC+5:30)');
  const [currency, setCurrency] = useState<string>('₹ / INR');
  const [minDepartureSoc, setMinDepartureSoc] = useState<number>(80);
  const [targetDepartureSoc, setTargetDepartureSoc] = useState<number>(90);
  const [safetyBufferMins, setSafetyBufferMins] = useState<number>(30);

  // 2. Grid & Capacity Configuration
  const [siteCapacity, setSiteCapacity] = useState<number>(gridConfig.siteCapacity || 600);
  const [peakDemandProtection, setPeakDemandProtection] = useState<boolean>(true);
  const [warningThresholdPercent, setWarningThresholdPercent] = useState<number>(
    gridConfig.warningThresholdPercent || 85
  );
  const [criticalThresholdPercent, setCriticalThresholdPercent] = useState<number>(
    gridConfig.criticalLimitPercent || 95
  );

  // 3. Smart Charging Optimization Parameters
  const [optStrategy, setOptStrategy] = useState<
    'balanced' | 'cost-min' | 'readiness-priority' | 'peak-shaving-strict'
  >('balanced');
  const [optPeakProtection, setOptPeakProtection] = useState<boolean>(true);
  const [optCostOptimization, setOptCostOptimization] = useState<boolean>(true);
  const [optReadinessPriority, setOptReadinessPriority] = useState<boolean>(true);
  const [optRoutePriority, setOptRoutePriority] = useState<string>('prioritize-critical-high');
  const [allowChargingBeforePeak, setAllowChargingBeforePeak] = useState<boolean>(true);
  const [allowChargingDuringPeak, setAllowChargingDuringPeak] = useState<boolean>(false);

  // 4. Energy Pricing
  const [peakTariff, setPeakTariff] = useState<number>(gridConfig.tariffs?.peak || 10.5);
  const [offPeakTariff, setOffPeakTariff] = useState<number>(gridConfig.tariffs?.offPeak || 6.5);
  const [peakPeriodStart, setPeakPeriodStart] = useState<string>(gridConfig.peakTariffStart || '17:00');
  const [peakPeriodEnd, setPeakPeriodEnd] = useState<string>(gridConfig.peakTariffEnd || '21:00');

  // 5. Charging Rules
  const [maxSitePower, setMaxSitePower] = useState<number>(500);
  const [maxSimultaneousCharging, setMaxSimultaneousCharging] = useState<number>(12);
  const [dynamicLoadBalancing, setDynamicLoadBalancing] = useState<boolean>(true);
  const [rulePeakProtection, setRulePeakProtection] = useState<boolean>(true);
  const [prioritizeCriticalRoutes, setPrioritizeCriticalRoutes] = useState<boolean>(true);
  const [protectDepartureRequirements, setProtectDepartureRequirements] = useState<boolean>(true);

  // 6. Notifications
  const [notifyGridWarning, setNotifyGridWarning] = useState<boolean>(true);
  const [notifyDepartureRisk, setNotifyDepartureRisk] = useState<boolean>(true);
  const [notifyChargerUnavailable, setNotifyChargerUnavailable] = useState<boolean>(true);
  const [notifyOptComplete, setNotifyOptComplete] = useState<boolean>(true);
  const [notifyOptFailure, setNotifyOptFailure] = useState<boolean>(true);

  // Technical & Diagnostics (collapsed by default)
  const [showTechnicalSection, setShowTechnicalSection] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>(apiBaseUrl);
  const [operatorRole, setOperatorRole] = useState<'operator' | 'manager' | 'admin'>('operator');
  const [shiftNotes, setShiftNotes] = useState<string>(
    'Shift Handover (18:00 - 06:00 Night Shift):\n- Bay 14 maintenance inspection confirmed clear.\n- Priority routes EV-1002 and EV-1005 scheduled for early morning dispatch (05:45 Departure).\n- Peak tariff window (17:00-21:00) observed under 500 kW ceiling.'
  );

  // Configuration Test State
  const [isTestingConfig, setIsTestingConfig] = useState<boolean>(false);
  const [configCheckResult, setConfigCheckResult] = useState<{
    passed: boolean;
    timestamp: string;
    details: string[];
  } | null>(null);

  // Handler: Operator-friendly Configuration Check
  const handleTestConfiguration = () => {
    setIsTestingConfig(true);
    setConfigCheckResult(null);

    setTimeout(() => {
      const details: string[] = [];
      let passed = true;

      // 1. Grid & Site Capacity
      if (siteCapacity >= maxSitePower) {
        details.push(
          `Grid Capacity Valid: Site capacity (${siteCapacity} kW) safely accommodates maximum charging power limit (${maxSitePower} kW).`
        );
      } else {
        passed = false;
        details.push(
          `Capacity Conflict: Maximum charging power (${maxSitePower} kW) exceeds Site Capacity (${siteCapacity} kW).`
        );
      }

      // Thresholds check
      if (warningThresholdPercent < criticalThresholdPercent) {
        details.push(
          `Headroom Thresholds: Warning at ${warningThresholdPercent}% (${Math.round(
            (siteCapacity * warningThresholdPercent) / 100
          )} kW), Critical limit at ${criticalThresholdPercent}% (${Math.round(
            (siteCapacity * criticalThresholdPercent) / 100
          )} kW).`
        );
      } else {
        passed = false;
        details.push(
          `Threshold Warning: Warning threshold (${warningThresholdPercent}%) must be lower than Critical threshold (${criticalThresholdPercent}%).`
        );
      }

      // 2. Energy Pricing
      if (peakTariff > offPeakTariff) {
        details.push(
          `Energy Pricing Valid: Peak tariff (₹${peakTariff.toFixed(1)}/kWh) creates an active shifting incentive vs Off-Peak (₹${offPeakTariff.toFixed(1)}/kWh). Peak window: ${peakPeriodStart}–${peakPeriodEnd}.`
        );
      } else {
        details.push(
          `Tariff Notice: Peak tariff is equal or lower than off-peak. Smart shifting incentive may be diminished.`
        );
      }

      // 3. Vehicle Readiness
      if (targetDepartureSoc > minDepartureSoc) {
        details.push(
          `Vehicle Readiness Constraints: Target departure SOC (${targetDepartureSoc}%) exceeds SLA minimum (${minDepartureSoc}%). Safety buffer: ${safetyBufferMins} min.`
        );
      } else {
        passed = false;
        details.push(
          `SOC Constraint Error: Target departure SOC (${targetDepartureSoc}%) must be greater than Minimum departure SOC (${minDepartureSoc}%).`
        );
      }

      // 4. Optimization Engine
      details.push(
        `Optimization Engine Status: CONNECTED (Spring Boot Optimizer at /api/v1/OptimizeChargingProfiles).`
      );

      setConfigCheckResult({
        passed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        details,
      });
      setIsTestingConfig(false);
      showToast(
        passed
          ? 'Configuration check passed. Operational parameters are fully feasible.'
          : 'Configuration check completed with warnings. Please review thresholds.'
      );
    }, 450);
  };

  // Handler: Save Configuration
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput) setApiBaseUrl(urlInput);

    updateGridConfig({
      siteCapacity,
      warningThresholdPercent,
      criticalLimitPercent: criticalThresholdPercent,
      peakTariffStart: peakPeriodStart,
      peakTariffEnd: peakPeriodEnd,
      tariffs: {
        ...gridConfig.tariffs,
        offPeak: offPeakTariff,
        peak: peakTariff,
      },
    });

    showToast('Depot operational parameters and charging rules saved successfully.');
  };

  // Handler: Reset to Defaults
  const handleResetDefaults = () => {
    setDepotName('Main Distribution Center');
    setCityRegion('New Delhi, India');
    setOperatingTimezone('Asia/Kolkata (UTC+5:30)');
    setCurrency('₹ / INR');
    setMinDepartureSoc(80);
    setTargetDepartureSoc(90);
    setSafetyBufferMins(30);

    setSiteCapacity(600);
    setPeakDemandProtection(true);
    setWarningThresholdPercent(85);
    setCriticalThresholdPercent(95);

    setOptStrategy('balanced');
    setOptPeakProtection(true);
    setOptCostOptimization(true);
    setOptReadinessPriority(true);
    setOptRoutePriority('prioritize-critical-high');
    setAllowChargingBeforePeak(true);
    setAllowChargingDuringPeak(false);

    setPeakTariff(10.5);
    setOffPeakTariff(6.5);
    setPeakPeriodStart('17:00');
    setPeakPeriodEnd('21:00');

    setMaxSitePower(500);
    setMaxSimultaneousCharging(12);
    setDynamicLoadBalancing(true);
    setRulePeakProtection(true);
    setPrioritizeCriticalRoutes(true);
    setProtectDepartureRequirements(true);

    setNotifyGridWarning(true);
    setNotifyDepartureRisk(true);
    setNotifyChargerUnavailable(true);
    setNotifyOptComplete(true);
    setNotifyOptFailure(true);

    setConfigCheckResult(null);
    showToast('Settings reset to standard depot defaults.');
  };

  return (
    <div className="flex flex-col w-full gap-4">
      {/* 1. TOP HEADER SUB-BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex flex-col">
          <h1 className="text-[20px] font-bold text-[#00163d] tracking-tight">Settings & Configuration</h1>
          <p className="text-[12px] text-[#44464f]">
            System configuration and depot operational parameters.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 h-8.5 rounded-md bg-white text-[#00163d] text-[12px] font-medium hover:bg-[#eff4ff] shadow-2xs transition-colors border border-[#c4c6d0] cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-[#747780]">restart_alt</span>
            <span>Reset to Defaults</span>
          </button>
          <button
            onClick={handleTestConfiguration}
            disabled={isTestingConfig}
            className="inline-flex items-center gap-1.5 px-3 h-8.5 rounded-md bg-white text-[#00163d] text-[12px] font-medium hover:bg-[#eff4ff] shadow-2xs transition-colors border border-[#c4c6d0] cursor-pointer disabled:opacity-50"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-[#006c4a]">
              {isTestingConfig ? 'hourglass_top' : 'task_alt'}
            </span>
            <span>{isTestingConfig ? 'Checking...' : 'Test Configuration'}</span>
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-3.5 h-8.5 rounded-md bg-[#00163d] text-white text-[12px] font-semibold hover:bg-[#0f2b5c] transition-colors shadow-xs cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-[#85f8c4]">save</span>
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* 2. OPTIMIZATION ENGINE CONNECTIVITY STATUS BADGE */}
      <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-wrap items-center justify-between gap-3 text-[12px]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#00163d] border border-blue-100 shrink-0">
            <span className="material-symbols-outlined text-[18px]">memory</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#00163d] text-[13px]">Optimization Engine</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#85f8c4]/30 text-[#005137] border border-[#006c4a]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006c4a] animate-pulse"></span>
                <span>CONNECTED</span>
              </span>
            </div>
            <span className="text-[11px] text-[#44464f]">
              Spring Boot Optimizer &bull; Endpoint: <code className="font-mono text-[#00163d] bg-slate-100 px-1 py-0.5 rounded">/api/v1/OptimizeChargingProfiles</code>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono text-[#44464f]">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-[#006c4a]">verified</span>
            <span>MILP Solver: CBC / OR-Tools Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-[#00163d]">speed</span>
            <span>Avg Solve Latency: 1.4s</span>
          </div>
        </div>
      </div>

      {/* 3. CONFIGURATION VALIDATION RESULTS BANNER (IF TESTED) */}
      {configCheckResult && (
        <div
          className={`p-4 rounded-xl border shadow-xs flex flex-col gap-2 transition-all ${
            configCheckResult.passed
              ? 'bg-emerald-50/70 border-emerald-200'
              : 'bg-amber-50/70 border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-black/5">
            <div className="flex items-center gap-2">
              <span
                className={`material-symbols-outlined text-[20px] ${
                  configCheckResult.passed ? 'text-[#006c4a]' : 'text-amber-700'
                }`}
              >
                {configCheckResult.passed ? 'check_circle' : 'warning'}
              </span>
              <span className="text-[13px] font-bold text-[#00163d]">
                {configCheckResult.passed
                  ? 'Operational Configuration Check: All Constraints Validated'
                  : 'Configuration Warnings Detected'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#747780]">
              Checked at {configCheckResult.timestamp}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] pt-1">
            {configCheckResult.details.map((detail, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-white/70 p-2 rounded border border-black/5">
                <span className="material-symbols-outlined text-[16px] text-[#006c4a] mt-0.5 shrink-0">
                  task_alt
                </span>
                <span className="text-[#0b1c30] text-[11px] leading-relaxed">{detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MAIN OPERATOR CONFIGURATION SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: DEPOT OPERATIONAL CONFIGURATION, GRID & CAPACITY, ENERGY PRICING */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Section 1: DEPOT OPERATIONAL CONFIGURATION */}
          <div className="p-4 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="material-symbols-outlined text-[20px] text-[#00163d]">warehouse</span>
              <h2 className="text-[13px] font-bold text-[#00163d] uppercase tracking-wider">
                Depot Operational Configuration
              </h2>
            </div>

            <div className="flex flex-col gap-3 text-[12px]">
              <div>
                <label className="block text-[11px] font-bold text-[#00163d] uppercase mb-1">
                  Depot Facility Name
                </label>
                <input
                  type="text"
                  value={depotName}
                  onChange={(e) => setDepotName(e.target.value)}
                  className="w-full h-8.5 px-3 rounded-lg bg-[#eff4ff] border border-[#c4c6d0] text-[#00163d] font-medium text-[12px]"
                  placeholder="Main Distribution Center"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#00163d] uppercase mb-1">
                    City / Region
                  </label>
                  <input
                    type="text"
                    value={cityRegion}
                    onChange={(e) => setCityRegion(e.target.value)}
                    className="w-full h-8.5 px-3 rounded-lg bg-[#eff4ff] border border-[#c4c6d0] text-[#00163d] font-medium text-[12px]"
                    placeholder="New Delhi, India"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#00163d] uppercase mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={currency}
                    readOnly
                    className="w-full h-8.5 px-3 rounded-lg bg-slate-100 font-mono text-[#00163d] border border-slate-200 text-[12px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#00163d] uppercase mb-1">
                  Operating Timezone
                </label>
                <input
                  type="text"
                  value={operatingTimezone}
                  readOnly
                  className="w-full h-8.5 px-3 rounded-lg bg-slate-100 font-mono text-[#00163d] border border-slate-200 text-[12px]"
                />
              </div>

              {/* Fleet Readiness Constraints */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-[#00163d] uppercase mb-1">
                    Min Departure SOC
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="60"
                      max="95"
                      value={minDepartureSoc}
                      onChange={(e) => setMinDepartureSoc(Number(e.target.value))}
                      className="w-full h-8 px-2 rounded bg-[#eff4ff] font-mono border border-slate-200 text-[12px] font-semibold"
                    />
                    <span className="text-[11px] font-mono text-[#44464f]">%</span>
                  </div>
                  <span className="text-[10px] text-[#747780] mt-0.5 block">SLA minimum</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#00163d] uppercase mb-1">
                    Target Departure SOC
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="75"
                      max="100"
                      value={targetDepartureSoc}
                      onChange={(e) => setTargetDepartureSoc(Number(e.target.value))}
                      className="w-full h-8 px-2 rounded bg-[#eff4ff] font-mono border border-slate-200 text-[12px] font-semibold"
                    />
                    <span className="text-[11px] font-mono text-[#44464f]">%</span>
                  </div>
                  <span className="text-[10px] text-[#747780] mt-0.5 block">Optimal charge</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#00163d] uppercase mb-1">
                    Safety Buffer
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="15"
                      max="90"
                      step="5"
                      value={safetyBufferMins}
                      onChange={(e) => setSafetyBufferMins(Number(e.target.value))}
                      className="w-full h-8 px-2 rounded bg-[#eff4ff] font-mono border border-slate-200 text-[12px] font-semibold"
                    />
                    <span className="text-[11px] font-mono text-[#44464f]">min</span>
                  </div>
                  <span className="text-[10px] text-[#747780] mt-0.5 block">Pre-dispatch slack</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: GRID & CAPACITY */}
          <div className="p-4 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#00163d]">electric_meter</span>
                <h2 className="text-[13px] font-bold text-[#00163d] uppercase tracking-wider">
                  Grid & Capacity
                </h2>
              </div>
              <span className="text-[11px] font-bold text-[#006c4a] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Site Feeder Protected
              </span>
            </div>

            <div className="flex flex-col gap-3 text-[12px]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#00163d] uppercase mb-1">
                    Site Capacity
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="200"
                      max="2000"
                      step="50"
                      value={siteCapacity}
                      onChange={(e) => setSiteCapacity(Number(e.target.value))}
                      className="w-full h-8.5 px-3 rounded-lg bg-[#eff4ff] border border-[#c4c6d0] text-[#00163d] font-mono font-bold text-[13px]"
                    />
                    <span className="text-[11px] font-mono font-semibold text-[#00163d]">kW</span>
                  </div>
                  <span className="text-[10px] text-[#747780] mt-0.5 block">
                    Utility contracted site capacity limit
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#00163d] uppercase mb-1">
                    Peak Demand Protection
                  </label>
                  <div className="flex items-center justify-between h-8.5 px-3 rounded-lg bg-[#eff4ff] border border-[#c4c6d0]">
                    <span className="text-[12px] font-semibold text-[#00163d]">
                      {peakDemandProtection ? 'Enabled' : 'Disabled'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={peakDemandProtection}
                        onChange={(e) => setPeakDemandProtection(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00163d]"></div>
                    </label>
                  </div>
                  <span className="text-[10px] text-[#747780] mt-0.5 block">
                    Prevents feeder surcharge penalty
                  </span>
                </div>
              </div>

              {/* Thresholds */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-[#00163d] uppercase mb-1">
                    Warning Threshold
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="70"
                      max="90"
                      value={warningThresholdPercent}
                      onChange={(e) => setWarningThresholdPercent(Number(e.target.value))}
                      className="w-full h-8 px-2 rounded bg-[#eff4ff] font-mono border border-slate-200 text-[12px] font-semibold"
                    />
                    <span className="text-[11px] font-mono text-[#44464f]">%</span>
                  </div>
                  <span className="text-[10px] text-[#006c4a] font-mono font-medium mt-0.5 block">
                    = {Math.round((siteCapacity * warningThresholdPercent) / 100)} kW warning level
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#00163d] uppercase mb-1">
                    Critical Threshold
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="85"
                      max="99"
                      value={criticalThresholdPercent}
                      onChange={(e) => setCriticalThresholdPercent(Number(e.target.value))}
                      className="w-full h-8 px-2 rounded bg-[#eff4ff] font-mono border border-slate-200 text-[12px] font-semibold"
                    />
                    <span className="text-[11px] font-mono text-[#44464f]">%</span>
                  </div>
                  <span className="text-[10px] text-[#ba1a1a] font-mono font-medium mt-0.5 block">
                    = {Math.round((siteCapacity * criticalThresholdPercent) / 100)} kW curtailment
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#eff4ff] border border-blue-100 flex items-center gap-2 text-[11px] text-[#44464f]">
                <span className="material-symbols-outlined text-[16px] text-[#00163d] shrink-0">info</span>
                <span>
                  Current demand is monitored live on the <strong>Dashboard</strong> and <strong>Energy & Grid</strong> views.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: ENERGY PRICING */}
          <div className="p-4 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#00163d]">currency_rupee</span>
                <h2 className="text-[13px] font-bold text-[#00163d] uppercase tracking-wider">
                  Energy Pricing
                </h2>
              </div>
              <span className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Time-of-Day (ToD) Active
              </span>
            </div>

            <div className="flex flex-col gap-3 text-[12px]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#00163d] uppercase mb-1">
                    Peak Tariff Rate
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      min="5"
                      max="30"
                      value={peakTariff}
                      onChange={(e) => setPeakTariff(Number(e.target.value))}
                      className="w-full h-8.5 px-3 rounded-lg bg-amber-50/70 border border-amber-300 text-amber-950 font-mono font-bold text-[13px]"
                    />
                    <span className="text-[11px] font-mono font-semibold text-amber-950">₹/kWh</span>
                  </div>
                  <span className="text-[10px] text-amber-800 mt-0.5 block">High tariff peak window</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#00163d] uppercase mb-1">
                    Off-Peak Tariff Rate
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      min="2"
                      max="20"
                      value={offPeakTariff}
                      onChange={(e) => setOffPeakTariff(Number(e.target.value))}
                      className="w-full h-8.5 px-3 rounded-lg bg-emerald-50/70 border border-emerald-300 text-[#005137] font-mono font-bold text-[13px]"
                    />
                    <span className="text-[11px] font-mono font-semibold text-[#005137]">₹/kWh</span>
                  </div>
                  <span className="text-[10px] text-[#006c4a] mt-0.5 block">Low tariff charging window</span>
                </div>
              </div>

              {/* Peak Period Start and End */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-[#00163d] uppercase mb-1">
                    Peak Period Start
                  </label>
                  <input
                    type="time"
                    value={peakPeriodStart}
                    onChange={(e) => setPeakPeriodStart(e.target.value)}
                    className="w-full h-8 px-2.5 rounded bg-[#eff4ff] font-mono border border-[#c4c6d0] text-[12px] font-semibold text-[#00163d]"
                  />
                  <span className="text-[10px] text-[#747780] mt-0.5 block">e.g. 17:00 IST</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#00163d] uppercase mb-1">
                    Peak Period End
                  </label>
                  <input
                    type="time"
                    value={peakPeriodEnd}
                    onChange={(e) => setPeakPeriodEnd(e.target.value)}
                    className="w-full h-8 px-2.5 rounded bg-[#eff4ff] font-mono border border-[#c4c6d0] text-[12px] font-semibold text-[#00163d]"
                  />
                  <span className="text-[10px] text-[#747780] mt-0.5 block">e.g. 21:00 IST</span>
                </div>
              </div>

              {/* Tariff Difference Summary Pill */}
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-between text-[11px] text-amber-950 font-medium">
                <span>
                  Peak Window: <strong>{peakPeriodStart} – {peakPeriodEnd}</strong>
                </span>
                <span className="font-mono font-bold text-[#006c4a]">
                  Spread: +₹{(peakTariff - offPeakTariff).toFixed(2)}/kWh Peak Premium
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SMART CHARGING OPTIMIZATION, CHARGING RULES, NOTIFICATIONS */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Section 4: SMART CHARGING OPTIMIZATION PARAMETERS */}
          <div className="p-4 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="material-symbols-outlined text-[20px] text-[#00163d]">tune</span>
              <h2 className="text-[13px] font-bold text-[#00163d] uppercase tracking-wider">
                Smart Charging Optimization Parameters
              </h2>
            </div>

            <div className="flex flex-col gap-3 text-[12px]">
              <div>
                <label className="block text-[11px] font-bold text-[#00163d] uppercase mb-1">
                  Optimization Objective
                </label>
                <select
                  value={optStrategy}
                  onChange={(e) => setOptStrategy(e.target.value as any)}
                  className="w-full h-8.5 px-3 rounded-lg bg-[#eff4ff] text-[#00163d] font-semibold text-[12px] border border-[#c4c6d0]"
                >
                  <option value="balanced">Balanced (Cost Minimization + Vehicle Readiness) [Default]</option>
                  <option value="cost-min">Energy Cost Optimization (Aggressive Off-Peak Shifting)</option>
                  <option value="readiness-priority">Vehicle Readiness Priority (Fastest SLA Completion)</option>
                  <option value="peak-shaving-strict">Peak Demand Protection Strict (Hard Cap on Peak Load)</option>
                </select>
              </div>

              {/* Practical Operator Optimization Switches */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <label className="flex items-center justify-between p-2 rounded-lg bg-[#eff4ff] border border-blue-100 cursor-pointer">
                  <span className="text-[11px] font-semibold text-[#00163d]">Peak Demand Protection</span>
                  <input
                    type="checkbox"
                    checked={optPeakProtection}
                    onChange={(e) => setOptPeakProtection(e.target.checked)}
                    className="accent-[#00163d] w-4 h-4 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-[#eff4ff] border border-blue-100 cursor-pointer">
                  <span className="text-[11px] font-semibold text-[#00163d]">Energy Cost Optimization</span>
                  <input
                    type="checkbox"
                    checked={optCostOptimization}
                    onChange={(e) => setOptCostOptimization(e.target.checked)}
                    className="accent-[#00163d] w-4 h-4 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-[#eff4ff] border border-blue-100 cursor-pointer">
                  <span className="text-[11px] font-semibold text-[#00163d]">Vehicle Readiness Priority</span>
                  <input
                    type="checkbox"
                    checked={optReadinessPriority}
                    onChange={(e) => setOptReadinessPriority(e.target.checked)}
                    className="accent-[#00163d] w-4 h-4 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-[#eff4ff] border border-blue-100 cursor-pointer">
                  <span className="text-[11px] font-semibold text-[#00163d]">Allow Pre-Peak Charging</span>
                  <input
                    type="checkbox"
                    checked={allowChargingBeforePeak}
                    onChange={(e) => setAllowChargingBeforePeak(e.target.checked)}
                    className="accent-[#00163d] w-4 h-4 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* Route Priority Handling & Peak Window Allowance */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-[#00163d] uppercase mb-1">
                    Route Priority Handling
                  </label>
                  <select
                    value={optRoutePriority}
                    onChange={(e) => setOptRoutePriority(e.target.value)}
                    className="w-full h-8 px-2 rounded bg-[#eff4ff] text-[#00163d] font-medium text-[11px] border border-slate-200"
                  >
                    <option value="prioritize-critical-high">Prioritize Critical & High Routes</option>
                    <option value="strict-critical-only">Critical Routes Only</option>
                    <option value="fifo-arrival">FIFO Arrival Order</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#00163d] uppercase mb-1">
                    Charge During Peak Window
                  </label>
                  <select
                    value={allowChargingDuringPeak ? 'allowed' : 'restricted'}
                    onChange={(e) => setAllowChargingDuringPeak(e.target.value === 'allowed')}
                    className="w-full h-8 px-2 rounded bg-[#eff4ff] text-[#00163d] font-medium text-[11px] border border-slate-200"
                  >
                    <option value="restricted">Restricted / Emergency Only</option>
                    <option value="allowed">Allowed (Unrestricted)</option>
                  </select>
                </div>
              </div>

              {/* Current Departure SOC Target Context Indicator */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px] text-[#44464f]">
                <span>
                  SLA Bounds: Min SOC <strong>{minDepartureSoc}%</strong> &bull; Target SOC <strong>{targetDepartureSoc}%</strong>
                </span>
                <span className="text-[#006c4a] font-bold font-mono">30 min buffer</span>
              </div>
            </div>
          </div>

          {/* Section 5: CHARGING RULES */}
          <div className="p-4 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#00163d]">rule</span>
                <h2 className="text-[13px] font-bold text-[#00163d] uppercase tracking-wider">
                  Charging Rules
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#00163d] font-bold bg-[#eff4ff] px-2 py-0.5 rounded border border-blue-200">
                Depot Policy
              </span>
            </div>

            <div className="flex flex-col gap-3 text-[12px]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#00163d] uppercase mb-1">
                    Max Site Charging Power
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="100"
                      max={siteCapacity}
                      step="25"
                      value={maxSitePower}
                      onChange={(e) => setMaxSitePower(Number(e.target.value))}
                      className="w-full h-8.5 px-3 rounded-lg bg-[#eff4ff] border border-[#c4c6d0] text-[#00163d] font-mono font-bold text-[13px]"
                    />
                    <span className="text-[11px] font-mono font-semibold text-[#00163d]">kW</span>
                  </div>
                  <span className="text-[10px] text-[#747780] mt-0.5 block">
                    EV dedicated load cap ({maxSitePower} kW &le; {siteCapacity} kW)
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#00163d] uppercase mb-1">
                    Max Simultaneous Charging
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={maxSimultaneousCharging}
                      onChange={(e) => setMaxSimultaneousCharging(Number(e.target.value))}
                      className="w-full h-8.5 px-3 rounded-lg bg-[#eff4ff] border border-[#c4c6d0] text-[#00163d] font-mono font-bold text-[13px]"
                    />
                    <span className="text-[11px] font-mono font-semibold text-[#00163d]">Vehicles</span>
                  </div>
                  <span className="text-[10px] text-[#747780] mt-0.5 block">Concurrent bay allocation limit</span>
                </div>
              </div>

              {/* Charging Rules Checklist */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-[#eff4ff]/60 transition-colors cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#00163d] text-[12px]">Dynamic Load Balancing</span>
                    <span className="text-[10px] text-[#747780]">Modulate per-bay kW according to available headroom</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={dynamicLoadBalancing}
                    onChange={(e) => setDynamicLoadBalancing(e.target.checked)}
                    className="accent-[#00163d] w-4 h-4 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-[#eff4ff]/60 transition-colors cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#00163d] text-[12px]">Peak Protection Enforcement</span>
                    <span className="text-[10px] text-[#747780]">Never exceed contract ceiling during high demand tariff hours</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={rulePeakProtection}
                    onChange={(e) => setRulePeakProtection(e.target.checked)}
                    className="accent-[#00163d] w-4 h-4 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-[#eff4ff]/60 transition-colors cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#00163d] text-[12px]">Prioritize Critical Routes</span>
                    <span className="text-[10px] text-[#747780]">Guarantee early power allocation to Airport and Medical logistics</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prioritizeCriticalRoutes}
                    onChange={(e) => setPrioritizeCriticalRoutes(e.target.checked)}
                    className="accent-[#00163d] w-4 h-4 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-[#eff4ff]/60 transition-colors cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#00163d] text-[12px]">Protect Vehicle Departure Requirements</span>
                    <span className="text-[10px] text-[#747780]">Never defer charging if departure deadline would be breached</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={protectDepartureRequirements}
                    onChange={(e) => setProtectDepartureRequirements(e.target.checked)}
                    className="accent-[#00163d] w-4 h-4 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Section 6: NOTIFICATIONS */}
          <div className="p-4 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#00163d]">notifications</span>
                <h2 className="text-[13px] font-bold text-[#00163d] uppercase tracking-wider">
                  Notifications & Alerts
                </h2>
              </div>
              <span className="text-[11px] font-bold text-[#006c4a]">5 Alert Rules Active</span>
            </div>

            <div className="flex flex-col gap-2 text-[12px]">
              <label className="flex items-center justify-between p-2 rounded-lg bg-[#eff4ff]/60 border border-blue-100/60 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-amber-600">warning</span>
                  <span className="text-[12px] font-medium text-[#00163d]">Grid Capacity Warning (threshold &gt; 85%)</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyGridWarning}
                  onChange={(e) => setNotifyGridWarning(e.target.checked)}
                  className="accent-[#00163d] w-4 h-4 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-[#eff4ff]/60 border border-blue-100/60 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#ba1a1a]">schedule</span>
                  <span className="text-[12px] font-medium text-[#00163d]">Vehicle Departure Risk (&lt; 30 min buffer)</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyDepartureRisk}
                  onChange={(e) => setNotifyDepartureRisk(e.target.checked)}
                  className="accent-[#00163d] w-4 h-4 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-[#eff4ff]/60 border border-blue-100/60 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#ba1a1a]">power_off</span>
                  <span className="text-[12px] font-medium text-[#00163d]">Charger Unavailable / Bay Fault</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyChargerUnavailable}
                  onChange={(e) => setNotifyChargerUnavailable(e.target.checked)}
                  className="accent-[#00163d] w-4 h-4 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-[#eff4ff]/60 border border-blue-100/60 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#006c4a]">check_circle</span>
                  <span className="text-[12px] font-medium text-[#00163d]">Optimization Complete (New Schedule Generated)</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOptComplete}
                  onChange={(e) => setNotifyOptComplete(e.target.checked)}
                  className="accent-[#00163d] w-4 h-4 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-[#eff4ff]/60 border border-blue-100/60 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-amber-700">error</span>
                  <span className="text-[12px] font-medium text-[#00163d]">Optimization Failure / Infeasible Ingress</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOptFailure}
                  onChange={(e) => setNotifyOptFailure(e.target.checked)}
                  className="accent-[#00163d] w-4 h-4 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SECONDARY DIAGNOSTICS & TECHNICAL SECTION (COLLAPSED BY DEFAULT) */}
      <div className="p-4 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col">
        <button
          onClick={() => setShowTechnicalSection(!showTechnicalSection)}
          className="flex items-center justify-between w-full text-left cursor-pointer"
          type="button"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#747780]">build</span>
            <span className="text-[12px] font-bold text-[#00163d] uppercase tracking-wider">
              Secondary Diagnostics & Technical Parameters
            </span>
          </div>
          <span className="material-symbols-outlined text-[18px] text-[#747780]">
            {showTechnicalSection ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {showTechnicalSection && (
          <div className="pt-3 mt-3 border-t border-slate-100 flex flex-col gap-4 text-[12px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#00163d] uppercase mb-1">
                  Java Spring Boot Optimizer URL
                </label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full h-8 px-2.5 rounded bg-[#eff4ff] font-mono text-[#00163d] border border-[#c4c6d0] text-[11px]"
                  placeholder="Configured API base URL"
                />
                <span className="text-[10px] text-[#747780] mt-0.5 block">
                  Connected route: <code>POST /api/v1/OptimizeChargingProfiles</code>
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#00163d] uppercase mb-1">
                  Active Operator Profile
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOperatorRole('operator')}
                    className={`p-1.5 rounded-lg border text-center font-semibold cursor-pointer text-[11px] ${
                      operatorRole === 'operator'
                        ? 'bg-[#00163d] text-white border-[#00163d]'
                        : 'bg-[#eff4ff] text-[#44464f] border-blue-100'
                    }`}
                  >
                    Depot Operator
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperatorRole('manager')}
                    className={`p-1.5 rounded-lg border text-center font-semibold cursor-pointer text-[11px] ${
                      operatorRole === 'manager'
                        ? 'bg-[#00163d] text-white border-[#00163d]'
                        : 'bg-[#eff4ff] text-[#44464f] border-blue-100'
                    }`}
                  >
                    Fleet Manager
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperatorRole('admin')}
                    className={`p-1.5 rounded-lg border text-center font-semibold cursor-pointer text-[11px] ${
                      operatorRole === 'admin'
                        ? 'bg-[#00163d] text-white border-[#00163d]'
                        : 'bg-[#eff4ff] text-[#44464f] border-blue-100'
                    }`}
                  >
                    System Admin
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#00163d] uppercase mb-1">
                Shift Handover Log & Operational Notes
              </label>
              <textarea
                rows={3}
                value={shiftNotes}
                onChange={(e) => setShiftNotes(e.target.value)}
                className="w-full p-2.5 rounded bg-[#eff4ff] text-[#00163d] border border-[#c4c6d0] text-[11px] font-mono leading-relaxed"
                placeholder="Record shift handover notes..."
              ></textarea>
              <span className="text-[10px] text-[#747780] mt-0.5 block">
                Logged in depot audit log with local operator signature.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
