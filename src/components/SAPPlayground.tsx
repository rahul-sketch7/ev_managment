import React, { useState } from 'react';
import { useGridCharge } from '../context/GridChargeContext';

export const SAPPlayground: React.FC = () => {
  const { apiBaseUrl, vehicles, chargers, gridConfig, showToast, setCurrentView } = useGridCharge();

  const [requestPayload, setRequestPayload] = useState(
    JSON.stringify(
      {
        siteId: 'MDC-01',
        siteCapacityKw: gridConfig.siteCapacity,
        currentDemandKw: gridConfig.currentDemand,
        baseLoadKw: gridConfig.baseLoad,
        tariffs: gridConfig.tariffs,
        vehicleCount: vehicles.length,
        chargerCount: chargers.length,
        vehicles: vehicles.slice(0, 5).map((v) => ({
          id: v.id,
          model: v.model,
          route: v.route,
          priority: v.routePriority,
          currentSOC: v.currentSOC,
          targetSOC: v.targetSOC,
          batteryCapacityKwh: v.batteryCapacity,
          requiredEnergyKwh: v.requiredEnergy,
          departureTime: v.departureTime,
          maxPowerKw: v.maxChargingPower,
        })),
      },
      null,
      2
    )
  );

  const [responsePayload, setResponsePayload] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<string | null>(null);

  const handleExecuteRequest = async () => {
    setLoading(true);
    setResponseStatus(null);
    showToast('Dispatching payload to SAP eMobility Optimizer...');

    try {
      const parsed = JSON.parse(requestPayload);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${apiBaseUrl}/api/v1/OptimizeChargingProfiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(parsed),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setResponseStatus(`HTTP ${res.status} ${res.statusText}`);

      const data = await res.json();
      setResponsePayload(JSON.stringify(data, null, 2));
      showToast('Optimizer response received.');
    } catch (err: any) {
      setResponseStatus('REQUEST FAILED');
      setResponsePayload(JSON.stringify({ error: 'Optimization engine unavailable.', detail: err?.message || 'Request failed.' }, null, 2));
      showToast('Optimization engine unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-4">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] font-bold text-[#0b1c30] tracking-tight">
              SAP eMobility Optimizer Playground
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
              Legacy Harness
            </span>
          </div>
          <p className="text-[12px] text-[#747780]">
            Direct API payload sandbox for the Java Spring Boot Smart Charging Optimizer.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="inline-flex items-center gap-1.5 px-3 h-8 rounded bg-white text-[#0b1c30] text-[12px] font-medium hover:bg-[#eff4ff] shadow-xs transition-colors border border-slate-200"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-[#747780]">arrow_back</span>
            <span>Return to GridCharge</span>
          </button>
          <button
            onClick={handleExecuteRequest}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 h-8 rounded bg-[#0f2b5c] text-white text-[12px] font-semibold hover:bg-[#00163d] transition-colors shadow-xs disabled:opacity-50"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">
              {loading ? 'progress_activity' : 'send'}
            </span>
            <span>{loading ? 'Dispatching...' : 'POST to Optimizer'}</span>
          </button>
        </div>
      </div>

      {/* 2. NOTICE BANNER */}
      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-center justify-between text-[12px] text-amber-900">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-amber-700">info</span>
          <span>
            Target endpoint: <code className="font-mono font-bold">{apiBaseUrl}/api/v1/OptimizeChargingProfiles</code>
          </span>
        </div>
        <span className="text-[11px] text-amber-700">Configured in System Settings</span>
      </div>

      {/* 3. SPLIT EDITORS: REQUEST JSON & RESPONSE JSON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* REQUEST PAYLOAD */}
        <div className="p-4 bg-white rounded-lg border border-[#c4c6d0]/40 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-[#c4c6d0]/30 mb-2">
            <span className="text-[12px] font-bold text-[#00163d] uppercase tracking-wide">
              Request Payload (JSON)
            </span>
            <button
              onClick={() => {
                setRequestPayload(
                  JSON.stringify(
                    {
                      siteId: 'MDC-01',
                      siteCapacityKw: 600,
                      currentDemandKw: 428,
                      baseLoadKw: 80,
                      tariffs: { offPeak: 4.5, normal: 7.2, peak: 11.5 },
                      vehicles: vehicles.map((v) => ({
                        id: v.id,
                        route: v.route,
                        priority: v.routePriority,
                        currentSOC: v.currentSOC,
                        targetSOC: v.targetSOC,
                        requiredEnergyKwh: v.requiredEnergy,
                      })),
                    },
                    null,
                    2
                  )
                );
                showToast('Synchronized payload with current fleet roster.');
              }}
              className="text-[11px] text-blue-800 hover:underline"
            >
              Populate Full Fleet
            </button>
          </div>

          <textarea
            value={requestPayload}
            onChange={(e) => setRequestPayload(e.target.value)}
            className="w-full flex-1 min-h-[380px] p-3 font-mono text-[11px] bg-slate-900 text-emerald-400 rounded border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
            spellCheck={false}
          ></textarea>
        </div>

        {/* RESPONSE INSPECTOR */}
        <div className="p-4 bg-white rounded-lg border border-[#c4c6d0]/40 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-[#c4c6d0]/30 mb-2">
            <span className="text-[12px] font-bold text-[#00163d] uppercase tracking-wide">
              Optimizer Response (JSON)
            </span>
            {responseStatus && (
              <span className="text-[11px] font-mono font-bold text-[#00163d] bg-slate-100 px-2 py-0.5 rounded">
                {responseStatus}
              </span>
            )}
          </div>

          {responsePayload ? (
            <textarea
              readOnly
              value={responsePayload}
              className="w-full flex-1 min-h-[380px] p-3 font-mono text-[11px] bg-slate-900 text-sky-300 rounded border border-slate-700 focus:outline-none resize-none leading-relaxed"
              spellCheck={false}
            ></textarea>
          ) : (
            <div className="flex-1 min-h-[380px] flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded border border-dashed border-slate-200 text-[#747780]">
              <span className="material-symbols-outlined text-[36px] text-slate-400 mb-2">code</span>
              <p className="text-[13px] font-semibold text-slate-700">No Response Received Yet</p>
              <p className="text-[11px] mt-1 max-w-xs">
                Click "POST to Optimizer" above to dispatch the JSON request to the Spring Boot service or run
                the deterministic emulator.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
