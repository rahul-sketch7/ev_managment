import React, { useState } from 'react';
import { useGridCharge } from '../context/GridChargeContext';
import { Vehicle } from '../types';

export const DataInspector: React.FC = () => {
  const {
    vehicles,
    chargers,
    gridConfig,
    optimizationResult,
    optimizationStatus,
    optimizationError,
    runOptimization,
    setCustomFleet,
    isOptimizing,
    showToast,
  } = useGridCharge();

  if (!optimizationResult) {
    return <div className="bg-white border border-[#c4c6d0]/50 rounded-xl p-5 shadow-xs"><h2 className="text-[18px] font-bold text-[#00163d]">Data & JSON Inspector</h2><p className="text-[13px] text-[#44464f] mt-2">Optimization status: <strong>{optimizationStatus}</strong>. No output is available until a successful optimizer response is received.</p>{optimizationError && <p className="text-[12px] text-[#ba1a1a] mt-2">{optimizationError}</p>}<button onClick={() => runOptimization()} disabled={isOptimizing} className="mt-4 px-4 py-2 bg-[#00163d] text-white text-[12px] font-semibold rounded-lg">{isOptimizing ? 'Optimizing...' : 'Run Optimization'}</button></div>;
  }

  const [activeTab, setActiveTab] = useState<'side-by-side' | 'input-table' | 'output-schedule'>('side-by-side');
  const [jsonInputText, setJsonInputText] = useState<string>('');
  const [isEditingInput, setIsEditingInput] = useState<boolean>(false);

  // Generate clean current input payload
  const currentInputPayload = {
    siteId: 'SITE-DEPOT-04',
    siteCapacityKw: gridConfig.siteCapacity,
    baseLoadKw: gridConfig.baseLoad,
    warningThresholdPercent: gridConfig.warningThresholdPercent,
    peakTariffWindow: {
      start: gridConfig.peakTariffStart,
      end: gridConfig.peakTariffEnd,
      peakRateRupees: gridConfig.tariffs.peak,
      normalRateRupees: gridConfig.tariffs.normal,
      offPeakRateRupees: gridConfig.tariffs.offPeak,
    },
    totalVehiclesGiven: vehicles.length,
    totalEnergyDemandKwh: Math.round(vehicles.reduce((acc, v) => acc + v.requiredEnergy, 0) * 10) / 10,
    vehicles: vehicles.map((v) => ({
      id: v.id,
      model: v.model,
      route: v.route,
      priority: v.routePriority,
      batteryCapacityKwh: v.batteryCapacity,
      currentSocPercent: v.currentSOC,
      targetSocPercent: v.targetSOC,
      requiredEnergyKwh: v.requiredEnergy,
      arrivalTime: v.arrivalTime,
      departureTime: v.departureTime,
      maxChargingPowerKw: v.maxChargingPower,
    })),
    chargers: chargers.map((c) => ({
      id: c.id,
      location: c.location,
      type: c.type,
      maxPowerKw: c.maxPower,
      status: c.status,
    })),
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`);
  };

  const handleStartEditing = () => {
    setJsonInputText(JSON.stringify(currentInputPayload, null, 2));
    setIsEditingInput(true);
  };

  const handleApplyCustomJson = () => {
    try {
      const parsed = JSON.parse(jsonInputText);
      if (parsed.vehicles && Array.isArray(parsed.vehicles)) {
        const convertedVehicles: Vehicle[] = parsed.vehicles.map((pv: any, idx: number) => ({
          id: pv.id || `EV-${String(idx + 1).padStart(3, '0')}`,
          model: pv.model || 'Commercial EV',
          type: 'Delivery Van',
          route: pv.route || `Urban Route #${idx + 1}`,
          routePriority: pv.priority || 'NORMAL',
          currentSOC: pv.currentSocPercent ?? 50,
          targetSOC: pv.targetSocPercent ?? 90,
          batteryCapacity: pv.batteryCapacityKwh ?? 30,
          requiredEnergy: pv.requiredEnergyKwh ?? 15,
          arrivalTime: pv.arrivalTime || '16:00',
          departureTime: pv.departureTime || '19:00',
          maxChargingPower: pv.maxChargingPowerKw ?? 22,
          chargingStatus: 'Scheduled',
          currentPower: 0,
        }));
        setCustomFleet(convertedVehicles);
        setIsEditingInput(false);
        showToast('Custom JSON applied to fleet! Running optimization...');
        runOptimization();
      } else {
        showToast('Invalid JSON: Must contain a "vehicles" array.');
      }
    } catch (e: any) {
      showToast(`JSON syntax error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Mode Selector */}
      <div className="bg-white border border-[#c4c6d0]/50 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-[#00163d] text-white material-symbols-outlined text-[20px]">
                data_object
              </span>
              <div>
                <h2 className="text-[18px] font-bold text-[#00163d] tracking-tight">
                  Data & JSON Inspector: What Was Given vs What Was Produced
                </h2>
                <p className="text-[13px] text-[#44464f]">
                  Complete transparent visibility into the exact input data delivered to the optimization engine and the schedule generated.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => runOptimization()}
              disabled={isOptimizing}
              className="flex items-center gap-2 px-4 py-2 bg-[#00163d] hover:bg-[#0f2b5c] text-white text-[13px] font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${isOptimizing ? 'animate-spin' : ''}`}>
                {isOptimizing ? 'refresh' : 'bolt'}
              </span>
              <span>{isOptimizing ? 'Optimizing...' : 'Re-Run Optimization'}</span>
            </button>
            <button
              onClick={() => copyToClipboard(JSON.stringify(currentInputPayload, null, 2), 'Input JSON')}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#eff4ff] hover:bg-[#dce9ff] text-[#00163d] text-[12px] font-semibold rounded-lg border border-[#c4c6d0]/40 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
              <span>Copy Input</span>
            </button>
            <button
              onClick={() => copyToClipboard(JSON.stringify(optimizationResult, null, 2), 'Output JSON')}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#eff4ff] hover:bg-[#dce9ff] text-[#00163d] text-[12px] font-semibold rounded-lg border border-[#c4c6d0]/40 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
              <span>Copy Output</span>
            </button>
          </div>
        </div>

        {/* View Switcher Chips */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#c4c6d0]/30">
          <button
            onClick={() => setActiveTab('side-by-side')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'side-by-side'
                ? 'bg-[#00163d] text-white'
                : 'bg-[#eff4ff] text-[#44464f] hover:text-[#0b1c30]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">compare</span>
            <span>Side-by-Side JSON Inspector</span>
          </button>
          <button
            onClick={() => setActiveTab('input-table')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'input-table'
                ? 'bg-[#00163d] text-white'
                : 'bg-[#eff4ff] text-[#44464f] hover:text-[#0b1c30]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">table_rows</span>
            <span>Inputs Table ({vehicles.length} EVs Given)</span>
          </button>
          <button
            onClick={() => setActiveTab('output-schedule')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'output-schedule'
                ? 'bg-[#00163d] text-white'
                : 'bg-[#eff4ff] text-[#44464f] hover:text-[#0b1c30]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>Output Schedule Details ({optimizationResult.shifts.length} Allocations)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SIDE-BY-SIDE JSON INSPECTOR */}
      {activeTab === 'side-by-side' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left Column: Input Given */}
          <div className="bg-white border border-[#c4c6d0]/50 rounded-xl overflow-hidden shadow-xs flex flex-col">
            <div className="bg-[#eff4ff] px-4 py-3 border-b border-[#c4c6d0]/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00163d]"></span>
                <span className="text-[13px] font-bold text-[#00163d]">INPUT GIVEN TO OPTIMIZER</span>
                <span className="px-2 py-0.5 rounded bg-white text-[#0b1c30] text-[11px] font-mono font-medium border border-[#c4c6d0]/40">
                  {vehicles.length} EVs • {gridConfig.siteCapacity} kW Feeder
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isEditingInput ? (
                  <>
                    <button
                      onClick={handleApplyCustomJson}
                      className="px-2.5 py-1 bg-[#006c4a] text-white rounded text-[11px] font-semibold hover:bg-[#005137] cursor-pointer"
                    >
                      Apply & Solve
                    </button>
                    <button
                      onClick={() => setIsEditingInput(false)}
                      className="px-2.5 py-1 bg-white border border-[#c4c6d0] text-[#44464f] rounded text-[11px] font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleStartEditing}
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 text-[#00163d] rounded text-[11px] font-semibold border border-[#c4c6d0] cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    <span>Edit JSON</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 bg-[#0b1329] flex-1 min-h-[500px] overflow-auto">
              {isEditingInput ? (
                <textarea
                  value={jsonInputText}
                  onChange={(e) => setJsonInputText(e.target.value)}
                  className="w-full h-full min-h-[500px] bg-transparent text-[#85f8c4] font-mono text-[11px] p-2 focus:outline-none resize-none leading-relaxed"
                  spellCheck={false}
                />
              ) : (
                <pre className="text-[#85f8c4] font-mono text-[11px] leading-relaxed select-text">
                  {JSON.stringify(currentInputPayload, null, 2)}
                </pre>
              )}
            </div>
          </div>

          {/* Right Column: Output Produced */}
          <div className="bg-white border border-[#c4c6d0]/50 rounded-xl overflow-hidden shadow-xs flex flex-col">
            <div className="bg-[#eff4ff] px-4 py-3 border-b border-[#c4c6d0]/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#006c4a]"></span>
                <span className="text-[13px] font-bold text-[#00163d]">OPTIMIZATION RESULT PRODUCED</span>
                <span className="px-2 py-0.5 rounded bg-[#85f8c4]/30 text-[#005137] text-[11px] font-semibold">
                  Solved in {optimizationResult.solvedInSeconds === null ? 'Not provided' : `${optimizationResult.solvedInSeconds}s`}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-[#006c4a] font-semibold">
                <span>Peak: {optimizationResult.optimizedPeakDemand} kW</span>
                <span>({optimizationResult.costSavings === null ? 'Savings not provided' : `Saved ₹${optimizationResult.costSavings.toLocaleString()}`})</span>
              </div>
            </div>

            <div className="p-3 bg-[#0b1329] flex-1 min-h-[500px] overflow-auto">
              <pre className="text-[#a8c7fa] font-mono text-[11px] leading-relaxed select-text">
                {JSON.stringify(optimizationResult, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INPUT TABLE VIEW */}
      {activeTab === 'input-table' && (
        <div className="bg-white border border-[#c4c6d0]/50 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#c4c6d0]/30 mb-4">
            <div>
              <h3 className="text-[15px] font-bold text-[#00163d]">Fleet Input Parameters</h3>
              <p className="text-[12px] text-[#44464f]">
                The exact parameters passed into the charging optimizer for each vehicle.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-[#eff4ff] text-[#00163d] font-semibold text-[12px]">
              Total Required: {Math.round(vehicles.reduce((acc, v) => acc + v.requiredEnergy, 0))} kWh
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="bg-[#eff4ff] text-[#00163d] font-semibold border-b border-[#c4c6d0]/40 text-[11px] uppercase">
                  <th className="py-2.5 px-3">Vehicle ID</th>
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-3">Assigned Route</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Battery (kWh)</th>
                  <th className="py-2.5 px-3">Current SOC</th>
                  <th className="py-2.5 px-3">Target SOC</th>
                  <th className="py-2.5 px-3">Energy Needed</th>
                  <th className="py-2.5 px-3">Arrival</th>
                  <th className="py-2.5 px-3">Departure</th>
                  <th className="py-2.5 px-3">Max Power</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c4c6d0]/20 font-mono">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#00163d]">{v.id}</td>
                    <td className="py-2.5 px-3 font-sans text-[#0b1c30]">{v.model}</td>
                    <td className="py-2.5 px-3 font-sans text-[#44464f]">{v.route}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
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
                    <td className="py-2.5 px-3">{v.batteryCapacity} kWh</td>
                    <td className="py-2.5 px-3 font-semibold">{v.currentSOC}%</td>
                    <td className="py-2.5 px-3 text-[#006c4a] font-semibold">{v.targetSOC}%</td>
                    <td className="py-2.5 px-3 text-[#00163d] font-semibold">{v.requiredEnergy} kWh</td>
                    <td className="py-2.5 px-3">{v.arrivalTime}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#ba1a1a]">{v.departureTime}</td>
                    <td className="py-2.5 px-3">{v.maxChargingPower} kW</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: OUTPUT SCHEDULE VIEW */}
      {activeTab === 'output-schedule' && (
        <div className="bg-white border border-[#c4c6d0]/50 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#c4c6d0]/30 mb-4">
            <div>
              <h3 className="text-[15px] font-bold text-[#00163d]">Generated Optimization Schedule</h3>
              <p className="text-[12px] text-[#44464f]">
                How the optimizer shifted and staggered charging to reduce peak demand from {optimizationResult.uncontrolledPeakDemand} kW to {optimizationResult.optimizedPeakDemand} kW.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-[#85f8c4]/30 text-[#005137] font-semibold text-[12px]">
              {optimizationResult.vehiclesReady} of {optimizationResult.totalVehicles} Vehicles Ready on Time
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="bg-[#eff4ff] text-[#00163d] font-semibold border-b border-[#c4c6d0]/40 text-[11px] uppercase">
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Route & Priority</th>
                  <th className="py-2.5 px-3">Previous (Uncontrolled)</th>
                  <th className="py-2.5 px-3">Optimized Start</th>
                  <th className="py-2.5 px-3">Departure SLA</th>
                  <th className="py-2.5 px-3">Schedule Shift</th>
                  <th className="py-2.5 px-3">Action Status</th>
                  <th className="py-2.5 px-3">Optimization Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c4c6d0]/20">
                {optimizationResult.shifts.map((s) => (
                  <tr key={s.vehicleId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-[#00163d]">{s.vehicleId}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-[#0b1c30]">{s.route}</div>
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold mt-0.5 ${
                          s.priority === 'CRITICAL'
                            ? 'bg-[#ffdad6] text-[#93000a]'
                            : s.priority === 'HIGH'
                            ? 'bg-[#ffdcc3] text-[#6e3900]'
                            : 'bg-[#e5eeff] text-[#00163d]'
                        }`}
                      >
                        {s.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#747780] line-through">{s.prevStart}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#00163d]">{s.optimizedStart}</td>
                    <td className="py-2.5 px-3 font-mono text-[#0b1c30]">{s.departure}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-[#006c4a]">{s.shiftDelta}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.status === 'PRIORITY'
                            ? 'bg-[#00163d] text-white'
                            : s.status === 'SHIFTED'
                            ? 'bg-[#d3e4fe] text-[#00163d]'
                            : s.status === 'DEFERRED'
                            ? 'bg-[#ffdcc3] text-[#6e3900]'
                            : 'bg-slate-100 text-slate-700'
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
      )}
    </div>
  );
};
