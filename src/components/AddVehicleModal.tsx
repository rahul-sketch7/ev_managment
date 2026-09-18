import React, { useState } from 'react';
import { useGridCharge } from '../context/GridChargeContext';
import { Vehicle, PriorityLevel } from '../types';

export const AddVehicleModal: React.FC = () => {
  const { vehicles, chargers, addVehicle, setCurrentView } = useGridCharge();

  const [id, setId] = useState(`EV-0${vehicles.length + 1}`);
  const [model, setModel] = useState('Tata Ace EV');
  const [batteryCapacity, setBatteryCapacity] = useState('42');
  const [currentSOC, setCurrentSOC] = useState('35');
  const [targetSOC, setTargetSOC] = useState('90');
  const [maxChargingPower, setMaxChargingPower] = useState('22');
  const [route, setRoute] = useState('City Route');
  const [routePriority, setRoutePriority] = useState<PriorityLevel>('NORMAL');
  const [arrivalTime, setArrivalTime] = useState('17:00');
  const [departureTime, setDepartureTime] = useState('21:30');
  const [assignedChargerId, setAssignedChargerId] = useState('');

  const requiredEnergy = Math.max(
    0,
    Math.round(((Number(targetSOC) - Number(currentSOC)) / 100) * Number(batteryCapacity) * 10) / 10
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newVehicle: Vehicle = {
      id: id.trim() || `EV-${Date.now().toString().slice(-4)}`,
      model,
      type: 'Commercial Cargo',
      batteryCapacity: Number(batteryCapacity) || 40,
      currentSOC: Number(currentSOC) || 30,
      targetSOC: Number(targetSOC) || 90,
      requiredEnergy,
      maxChargingPower: Number(maxChargingPower) || 22,
      arrivalTime,
      departureTime,
      route,
      routePriority,
      chargingStatus: assignedChargerId ? 'Charging' : 'Scheduled',
      currentPower: assignedChargerId ? Math.min(Number(maxChargingPower), 22) : 0,
      assignedChargerId: assignedChargerId || undefined,
      scheduledStart: arrivalTime,
      scheduledEnd: departureTime,
      energyDelivered: 0,
      inspectionBufferMin: 15,
    };

    addVehicle(newVehicle);
    setCurrentView('fleet');
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto gap-4">
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between pb-2 border-b border-[#c4c6d0]/40">
        <div>
          <h1 className="text-[20px] font-bold text-[#0b1c30] tracking-tight">Add Commercial EV to Fleet</h1>
          <p className="text-[12px] text-[#747780]">
            Register a commercial delivery vehicle into the active depot pool and schedule queue.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCurrentView('fleet')}
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
              Vehicle Identification (ID) *
            </label>
            <input
              required
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-[#eff4ff] text-[#0b1c30] font-mono border border-[#c4c6d0] focus:outline-none focus:border-[#00163d]"
              placeholder="e.g. EV-028"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0b1c30] uppercase mb-1">
              Vehicle Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-[#eff4ff] text-[#0b1c30] border border-[#c4c6d0] focus:outline-none"
            >
              <option value="Tata Ace EV">Tata Ace EV (Delivery Van)</option>
              <option value="Mahindra Zor Grand">Mahindra Zor Grand (Cargo 3W)</option>
              <option value="Eicher Pro EV">Eicher Pro EV (Distribution Truck)</option>
              <option value="Piaggio Ape E-Xtra">Piaggio Ape E-Xtra</option>
              <option value="Euler HiLoad">Euler HiLoad EV</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0b1c30] uppercase mb-1">
              Battery Pack Capacity (kWh)
            </label>
            <input
              type="number"
              min="10"
              max="200"
              value={batteryCapacity}
              onChange={(e) => setBatteryCapacity(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-[#eff4ff] text-[#0b1c30] font-mono border border-[#c4c6d0] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0b1c30] uppercase mb-1">
              Max Charging Power (kW)
            </label>
            <select
              value={maxChargingPower}
              onChange={(e) => setMaxChargingPower(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-[#eff4ff] text-[#0b1c30] font-mono border border-[#c4c6d0] focus:outline-none"
            >
              <option value="7.4">7.4 kW (Single-Phase AC)</option>
              <option value="11">11 kW (Three-Phase AC)</option>
              <option value="22">22 kW (Standard AC Fast)</option>
              <option value="44">44 kW (DC Fast Boost)</option>
              <option value="50">50 kW (CCS2 DC Rapid)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0b1c30] uppercase mb-1">
              Current State of Charge (SOC %)
            </label>
            <input
              type="number"
              min="5"
              max="99"
              value={currentSOC}
              onChange={(e) => setCurrentSOC(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-[#eff4ff] text-[#0b1c30] font-mono border border-[#c4c6d0] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0b1c30] uppercase mb-1">
              Target State of Charge (SOC %)
            </label>
            <input
              type="number"
              min="50"
              max="100"
              value={targetSOC}
              onChange={(e) => setTargetSOC(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-[#eff4ff] text-[#0b1c30] font-mono border border-[#c4c6d0] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0b1c30] uppercase mb-1">
              Assigned Route
            </label>
            <input
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-[#eff4ff] text-[#0b1c30] border border-[#c4c6d0] focus:outline-none"
              placeholder="e.g. North Hub"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0b1c30] uppercase mb-1">
              Route Priority Tier
            </label>
            <select
              value={routePriority}
              onChange={(e) => setRoutePriority(e.target.value as PriorityLevel)}
              className="w-full h-8 px-2.5 rounded bg-[#eff4ff] text-[#0b1c30] border border-[#c4c6d0] focus:outline-none"
            >
              <option value="CRITICAL">CRITICAL (Express & Airport SLA)</option>
              <option value="HIGH">HIGH (Priority Cargo)</option>
              <option value="NORMAL">NORMAL (Standard Delivery)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0b1c30] uppercase mb-1">
              Depot Arrival Time
            </label>
            <input
              type="time"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-[#eff4ff] text-[#0b1c30] font-mono border border-[#c4c6d0] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#0b1c30] uppercase mb-1">
              Scheduled Departure Time
            </label>
            <input
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-[#eff4ff] text-[#0b1c30] font-mono border border-[#c4c6d0] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-[#0b1c30] uppercase mb-1">
              Initial Charger Bay (Optional)
            </label>
            <select
              value={assignedChargerId}
              onChange={(e) => setAssignedChargerId(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-[#eff4ff] text-[#0b1c30] font-mono border border-[#c4c6d0] focus:outline-none"
            >
              <option value="">None (Queue in Staging Yard)</option>
              {chargers
                .filter((c) => c.status === 'Available')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} (Bay {c.location} - {c.maxPower} kW {c.type})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Calculated Energy Summary */}
        <div className="p-3 rounded bg-[#eff4ff] border border-blue-100 flex items-center justify-between font-mono text-[12px]">
          <div>
            <span className="text-[#747780] font-sans text-[11px] block">Computed Energy Requirement:</span>
            <span className="text-[16px] font-bold text-[#00163d]">{requiredEnergy} kWh</span>
          </div>
          <div className="text-right">
            <span className="text-[#747780] font-sans text-[11px] block">Turnaround Window:</span>
            <span className="text-[14px] font-bold text-[#0b1c30]">{arrivalTime} → {departureTime}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setCurrentView('fleet')}
            className="px-4 h-9 rounded bg-white text-[#0b1c30] font-medium hover:bg-slate-50 border border-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 h-9 rounded bg-[#0f2b5c] text-white font-semibold hover:bg-[#00163d] transition-colors shadow-xs"
          >
            Save & Add to Fleet
          </button>
        </div>
      </form>
    </div>
  );
};
