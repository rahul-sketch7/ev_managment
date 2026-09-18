import React, { useState } from 'react';
import { useGridCharge } from '../context/GridChargeContext';
import { Charger } from '../types';

export const AddChargerModal: React.FC = () => {
  const { chargers, addCharger, setCurrentView } = useGridCharge();

  const [id, setId] = useState(`CS-${String(chargers.length + 1).padStart(2, '0')}`);
  const [location, setLocation] = useState(String(chargers.length + 1));
  const [group, setGroup] = useState('Group B - South Wing');
  const [type, setType] = useState('22 kW AC Fast');
  const [maxPower, setMaxPower] = useState('22');
  const [status, setStatus] = useState<Charger['status']>('Available');
  const [smartCharging, setSmartCharging] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newCharger: Charger = {
      id: id.trim() || `CS-${Date.now().toString().slice(-2)}`,
      type: type as any,
      maxPower: Number(maxPower) || 22,
      currentPower: 0,
      status,
      location,
      group,
      smartCharging,
    };

    addCharger(newCharger);
    setCurrentView('charging-infrastructure');
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto gap-4">
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between pb-2 border-b border-[#c4c6d0]/40">
        <div>
          <h1 className="text-[20px] font-bold text-[#0b1c30] tracking-tight">Add Charging Station Bay</h1>
          <p className="text-[12px] text-[#747780]">
            Provision a new EVSE charging point, assign electrical group, and configure OCPP parameters.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCurrentView('charging-infrastructure')}
          className="px-3 h-8 rounded bg-white text-[#0b1c30] text-[12px] font-medium hover:bg-[#eff4ff] border border-slate-200"
        >
          Cancel
        </button>
      </div>

      {/* 2. FORM CONTAINER */}
      <form onSubmit={handleSubmit} className="p-5 bg-white rounded-lg border border-[#c4c6d0]/40 shadow-xs flex flex-col gap-4 text-[12px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-[#0b1c30] uppercase mb-1">
              Charger Hardware ID *
            </label>
            <input
              required
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-[#eff4ff] text-[#0b1c30] font-mono border border-[#c4c6d0] focus:outline-none focus:border-[#00163d]"
              placeholder="e.g. CS-25"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0b1c30] uppercase mb-1">
              Bay Location Number
            </label>
            <input
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-[#eff4ff] text-[#0b1c30] font-mono border border-[#c4c6d0] focus:outline-none focus:border-[#00163d]"
              placeholder="e.g. 25"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0b1c30] uppercase mb-1">
              Sub-Feeder Electrical Group
            </label>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-[#eff4ff] text-[#0b1c30] border border-[#c4c6d0] focus:outline-none"
            >
              <option value="Group A - North Wing">Group A - North Wing (AC Slow/Standard)</option>
              <option value="Group B - South Wing">Group B - South Wing (AC Standard)</option>
              <option value="Group C - DC Hub">Group C - DC Hub (High-Power DC Boost)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0b1c30] uppercase mb-1">
              Charger Hardware Specification
            </label>
            <select
              value={type}
              onChange={(e) => {
                const val = e.target.value;
                setType(val);
                if (val.includes('7.4')) setMaxPower('7.4');
                else if (val.includes('11')) setMaxPower('11');
                else if (val.includes('22')) setMaxPower('22');
                else if (val.includes('50')) setMaxPower('50');
                else if (val.includes('120')) setMaxPower('120');
              }}
              className="w-full h-8 px-2.5 rounded bg-[#eff4ff] text-[#0b1c30] border border-[#c4c6d0] focus:outline-none"
            >
              <option value="7.4 kW AC Single">7.4 kW AC (Single Phase)</option>
              <option value="11 kW AC Standard">11 kW AC (Three Phase)</option>
              <option value="22 kW AC Fast">22 kW AC (Fast Three Phase)</option>
              <option value="50 kW DC Fast">50 kW DC (CCS2 Fast Boost)</option>
              <option value="120 kW DC Ultra-Fast">120 kW DC (High-Speed Dual-Port)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0b1c30] uppercase mb-1">
              Continuous Output Limit (kW)
            </label>
            <input
              type="number"
              step="0.1"
              value={maxPower}
              onChange={(e) => setMaxPower(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-[#eff4ff] text-[#0b1c30] font-mono border border-[#c4c6d0] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0b1c30] uppercase mb-1">
              Initial Operational Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full h-8 px-2.5 rounded bg-[#eff4ff] text-[#0b1c30] border border-[#c4c6d0] focus:outline-none"
            >
              <option value="Available">Available (Ready for session)</option>
              <option value="Maintenance">Maintenance / Offline</option>
              <option value="Standby">Standby (Testing mode)</option>
            </select>
          </div>

          <div className="sm:col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="font-bold text-[#0b1c30] block">OCPP 2.0.1 Smart Charging Control</span>
              <span className="text-[11px] text-[#747780]">
                Permit central optimizer to dynamically modulate charging profiles and set power limits.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={smartCharging}
                onChange={(e) => setSmartCharging(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00163d]"></div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setCurrentView('charging-infrastructure')}
            className="px-4 h-9 rounded bg-white text-[#0b1c30] font-medium hover:bg-slate-50 border border-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 h-9 rounded bg-[#0f2b5c] text-white font-semibold hover:bg-[#00163d] transition-colors shadow-xs"
          >
            Provision Bay
          </button>
        </div>
      </form>
    </div>
  );
};
