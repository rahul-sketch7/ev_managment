import React, { useState } from 'react';
import { useGridCharge } from '../context/GridChargeContext';
import { Charger } from '../types';

export const ChargingInfrastructure: React.FC = () => {
  const {
    chargers,
    selectedChargerId,
    setSelectedChargerId,
    setCurrentView,
    showToast,
  } = useGridCharge();

  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const selectedCharger =
    chargers.find((c) => c.id === selectedChargerId) ||
    chargers.find((c) => c.id === 'CS-08') ||
    chargers[0];

  const totalChargers = chargers.length;
  const inUseCount = chargers.filter((c) => c.status === 'Charging' || c.status === 'Priority Charging').length;
  const availableCount = chargers.filter((c) => c.status === 'Available').length;
  const faultedCount = chargers.filter(
    (c) => c.status === 'Unavailable' || c.status === 'Maintenance' || c.status === 'Fault'
  ).length;
  const onlineCount = totalChargers - faultedCount;

  const [activePowerLimit, setActivePowerLimit] = useState<number>(selectedCharger.maxPower);

  const filteredChargers = chargers.filter((c) => {
    const assignedVeh = c.connectedVehicleId || c.assignedVehicleId;
    const matchesSearch =
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (assignedVeh && assignedVeh.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesGroup = groupFilter === 'All' || c.group === groupFilter;
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Charging' && (c.status === 'Charging' || c.status === 'Priority Charging')) ||
      (statusFilter === 'Available' && c.status === 'Available') ||
      (statusFilter === 'Faulted' &&
        (c.status === 'Unavailable' || c.status === 'Maintenance' || c.status === 'Fault'));

    return matchesSearch && matchesGroup && matchesStatus;
  });

  const getConnectorType = (c: Charger) => {
    return c.type.includes('DC') ? 'CCS2' : 'Type 2';
  };

  const getStatusBadge = (status: Charger['status']) => {
    switch (status) {
      case 'Priority Charging':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#00163d] text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-[#85f8c4] animate-ping"></span>
            <span>Priority Boost</span>
          </span>
        );
      case 'Charging':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#00163d] text-[#85f8c4]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#85f8c4] animate-ping"></span>
            <span>Charging</span>
          </span>
        );
      case 'Available':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-[#85f8c4]/30 text-[#006c4a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#006c4a]"></span>
            <span>Available</span>
          </span>
        );
      case 'Maintenance':
      case 'Fault':
      case 'Unavailable':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#ffdad6] text-[#ba1a1a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>
            <span>Faulted</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-[#e5eeff] text-[#44464f]">
            <span>Scheduled</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col w-full gap-4">
      {/* 1. TOP HEADER SUB-BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex flex-col">
          <h1 className="text-[20px] font-bold text-[#00163d] tracking-tight">Charging Infrastructure</h1>
          <p className="text-[12px] text-[#44464f]">
            Depot charging stations, connectors, operational status, and transformer load distribution.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => showToast('Depot electrical topology exported as JSON schema.')}
            className="inline-flex items-center gap-1.5 px-3 h-8.5 rounded-md bg-white text-[#00163d] text-[12px] font-medium hover:bg-[#eff4ff] shadow-2xs transition-colors border border-[#c4c6d0] cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-[#747780]">share</span>
            <span>Export Topology</span>
          </button>
          <button
            onClick={() => setCurrentView('add-charger')}
            className="inline-flex items-center gap-1.5 px-3.5 h-8.5 rounded-md bg-[#00163d] text-white text-[12px] font-semibold hover:bg-[#0f2b5c] transition-colors shadow-xs cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-[#85f8c4]">add</span>
            <span>Add Charger</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY KPI CARDS (Matching specification: Total, Online, In Use, Available, Faulted) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Chargers */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#747780] font-semibold">Total Chargers</span>
            <span className="material-symbols-outlined text-[18px] text-[#00163d]">ev_station</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-mono font-bold text-[#00163d]">12</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#eff4ff] text-[#00163d] font-bold">
              3 Sub-Feeders
            </span>
          </div>
          <div className="text-[11px] text-[#44464f] mt-1 truncate">8 AC Level 2 • 4 DC Fast</div>
        </div>

        {/* Online Chargers */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#747780] font-semibold">Online</span>
            <span className="material-symbols-outlined text-[18px] text-[#006c4a]">wifi</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-mono font-bold text-[#006c4a]">11</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#85f8c4]/30 text-[#005137] font-bold">
              91.7% Uptime
            </span>
          </div>
          <div className="text-[11px] text-[#44464f] mt-1 truncate">OCPP 2.0.1 heartbeat active</div>
        </div>

        {/* In Use */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#747780] font-semibold">In Use</span>
            <span className="material-symbols-outlined text-[18px] text-[#00163d]">bolt</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-mono font-bold text-[#00163d]">8</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 font-bold">
              428 kW Draw
            </span>
          </div>
          <div className="text-[11px] text-[#44464f] mt-1 truncate">Actively dispensing power</div>
        </div>

        {/* Available */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#747780] font-semibold">Available</span>
            <span className="material-symbols-outlined text-[18px] text-[#006c4a]">check_circle</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-mono font-bold text-[#006c4a]">3</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#85f8c4]/30 text-[#005137] font-bold">
              Bays Ready
            </span>
          </div>
          <div className="text-[11px] text-[#44464f] mt-1 truncate">Staged for incoming shift</div>
        </div>

        {/* Faulted */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#747780] font-semibold">Faulted</span>
            <span className="material-symbols-outlined text-[18px] text-[#ba1a1a]">warning</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-mono font-bold text-[#ba1a1a]">1</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ffdad6] text-[#ba1a1a] font-bold">
              Bay 14
            </span>
          </div>
          <div className="text-[11px] text-[#44464f] mt-1 truncate">Cable interlock error</div>
        </div>
      </div>

      {/* 3. TRANSFORMER / FEEDER SECTION (Substation Transformer Capacity, Real-time load, Headroom, Phase balance) */}
      <div className="p-4 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#00163d]">electric_meter</span>
            <h2 className="text-[14px] font-bold text-[#00163d] uppercase tracking-wider">
              Substation Transformer & Feeder Distribution
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#85f8c4]/30 text-[#005137] text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#006c4a] animate-pulse"></span>
            <span>GRID STABLE • COINCIDENT DEMAND WITHIN SAFETY MARGIN</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-[#eff4ff] border border-blue-100">
            <div className="text-[10px] uppercase font-bold text-[#44464f]">Transformer Rated Capacity</div>
            <div className="font-mono text-[22px] font-bold text-[#00163d] mt-0.5">600 kW</div>
            <div className="text-[11px] text-[#44464f] mt-0.5">11kV / 415V 750 kVA Substation</div>
          </div>

          <div className="p-3 rounded-lg bg-[#eff4ff] border border-blue-100">
            <div className="text-[10px] uppercase font-bold text-[#44464f]">Real-time Site Load</div>
            <div className="font-mono text-[22px] font-bold text-[#00163d] mt-0.5">428 kW</div>
            <div className="text-[11px] font-bold text-[#0f2b5c] mt-0.5">71.3% Transformer Loading</div>
          </div>

          <div className="p-3 rounded-lg bg-[#eff4ff] border border-blue-100">
            <div className="text-[10px] uppercase font-bold text-[#44464f]">Available Dynamic Headroom</div>
            <div className="font-mono text-[22px] font-bold text-[#006c4a] mt-0.5">172 kW</div>
            <div className="text-[11px] text-[#006c4a] font-bold mt-0.5">Safe buffer before soft-cap</div>
          </div>

          <div className="p-3 rounded-lg bg-[#eff4ff] border border-blue-100 flex flex-col justify-between">
            <div className="text-[10px] uppercase font-bold text-[#44464f]">Feeder Phase Balance (L1 / L2 / L3)</div>
            <div className="flex items-center gap-2 font-mono text-[12px] font-bold text-[#00163d] mt-1">
              <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200">L1: 143 kW</span>
              <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200">L2: 141 kW</span>
              <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200">L3: 144 kW</span>
            </div>
            <div className="text-[11px] text-[#006c4a] font-bold mt-1">Phase Imbalance: 0.7% (Nominal &lt; 5%)</div>
          </div>
        </div>
      </div>

      {/* 3. FILTER & VIEW TOGGLE BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-lg bg-white border border-[#c4c6d0]/40 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-2.5 text-[16px] text-[#747780] pointer-events-none">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 lg:w-64 h-8 pl-8 pr-2.5 rounded bg-[#eff4ff] text-[#0b1c30] text-[12px] placeholder:text-[#747780] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#00163d] transition-all border border-slate-200"
              placeholder="Search charger ID, bay, EV..."
              type="text"
            />
          </div>

          {/* Group Filter */}
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="h-8 px-2.5 rounded bg-white text-[#0b1c30] text-[12px] font-medium border border-[#c4c6d0] focus:outline-none"
          >
            <option value="All">All Electrical Groups</option>
            <option value="Group A - North Wing">Group A - North Wing</option>
            <option value="Group B - South Wing">Group B - South Wing</option>
            <option value="Group C - DC Hub">Group C - DC Hub</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 px-2.5 rounded bg-white text-[#0b1c30] text-[12px] font-medium border border-[#c4c6d0] focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Charging">Charging</option>
            <option value="Available">Available</option>
            <option value="Offline">Offline / Maintenance</option>
          </select>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center rounded border border-[#c4c6d0] bg-[#eff4ff] p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded flex items-center justify-center transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-[#00163d]' : 'text-[#747780] hover:text-[#0b1c30]'
              }`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-[17px]">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded flex items-center justify-center transition-colors ${
                viewMode === 'table' ? 'bg-white shadow-xs text-[#00163d]' : 'text-[#747780] hover:text-[#0b1c30]'
              }`}
              title="Table View"
            >
              <span className="material-symbols-outlined text-[17px]">table_rows</span>
            </button>
          </div>
          <span className="text-[11px] text-[#747780] font-mono">
            {filteredChargers.length} Bays Active
          </span>
        </div>
      </div>

      {/* 4. MAIN SPLIT: BAYS DIRECTORY (COL-SPAN-8) & INSPECTION PANEL (COL-SPAN-4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT: CHARGER DIRECTORY */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {viewMode === 'grid' ? (
            /* Card Grid Layout */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredChargers.map((c) => {
                const isSelected = c.id === selectedCharger.id;
                const loadPercent = Math.round((c.currentPower / c.maxPower) * 100) || 0;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedChargerId(c.id)}
                    className={`p-3.5 rounded-lg bg-white border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#00163d] ring-1 ring-[#00163d] shadow-sm'
                        : 'border-[#c4c6d0]/40 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[14px] font-bold text-[#00163d]">{c.id}</span>
                          <span className="text-[11px] text-[#747780] font-medium">• Bay {c.location}</span>
                        </div>
                        {getStatusBadge(c.status)}
                      </div>

                      <div className="mt-2 text-[11px] text-[#44464f] flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span>{c.type}</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#eff4ff] border border-blue-200 font-mono text-[10px] font-bold text-[#00163d]">
                            {getConnectorType(c)}
                          </span>
                        </div>
                        <span className="font-mono font-medium text-[#0b1c30]">Max {c.maxPower} kW</span>
                      </div>

                      {/* Power Load Bar */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#747780] mb-0.5">
                          <span>Active Load: {c.currentPower} kW</span>
                          <span>{loadPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[#e5eeff] overflow-hidden">
                          <div
                            className={`h-full ${
                              c.status === 'Priority Charging'
                                ? 'bg-[#0f2b5c]'
                                : c.currentPower > 0
                                ? 'bg-[#00163d]'
                                : 'bg-transparent'
                            }`}
                            style={{ width: `${loadPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#c4c6d0]/25 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1">
                        <span className="text-[#747780]">EV:</span>
                        <span className="font-mono font-semibold text-[#0b1c30]">
                          {c.connectedVehicleId || c.assignedVehicleId || '— None'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[#006c4a]">
                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                        <span className="text-[10px] font-bold">OCPP 2.0</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="rounded-lg bg-white border border-[#c4c6d0]/40 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="h-8 bg-[#eff4ff] text-[11px] font-semibold text-[#747780] uppercase tracking-wider border-b border-[#c4c6d0]/30">
                      <th className="py-1 px-3">Charger</th>
                      <th className="py-1 px-3">Location</th>
                      <th className="py-1 px-3">Group</th>
                      <th className="py-1 px-3">Type</th>
                      <th className="py-1 px-3 text-right">Max kW</th>
                      <th className="py-1 px-3 text-right">Active kW</th>
                      <th className="py-1 px-3">Assigned Vehicle</th>
                      <th className="py-1 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[12px] text-[#0b1c30]">
                    {filteredChargers.map((c) => {
                      const isSelected = c.id === selectedCharger.id;
                      return (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedChargerId(c.id)}
                          className={`h-9 cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#eff4ff] font-medium' : 'hover:bg-[#eff4ff]/40'
                          }`}
                        >
                          <td className="py-1 px-3 font-mono font-bold text-[#00163d]">{c.id}</td>
                          <td className="py-1 px-3 text-[#44464f]">Bay {c.location}</td>
                          <td className="py-1 px-3 text-[#747780] text-[11px]">{c.group}</td>
                          <td className="py-1 px-3">{c.type}</td>
                          <td className="py-1 px-3 text-right font-mono">{c.maxPower} kW</td>
                          <td className="py-1 px-3 text-right font-mono font-semibold text-[#00163d]">
                            {c.currentPower} kW
                          </td>
                          <td className="py-1 px-3 font-mono text-[#0b1c30]">
                            {c.connectedVehicleId || c.assignedVehicleId || '—'}
                          </td>
                          <td className="py-1 px-3 text-center">{getStatusBadge(c.status)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: CHARGER BAY INSPECTION PANEL (COL-SPAN-4) */}
        <div className="lg:col-span-4 flex flex-col rounded-lg bg-white border border-[#c4c6d0]/40 shadow-xs overflow-hidden sticky top-16">
          {/* Header */}
          <div className="p-4 bg-[#eff4ff] border-b border-[#c4c6d0]/30 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#747780]">
                CHARGER TELEMETRY & BAY CONTROL
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-white border border-slate-200 text-[#00163d]">
                Bay {selectedCharger.location}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded bg-[#00163d] text-white flex items-center justify-center font-mono text-[16px] font-bold">
                  <span className="material-symbols-outlined text-[20px]">ev_station</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[17px] font-bold text-[#00163d] leading-tight">
                      {selectedCharger.id}
                    </span>
                    <span className="text-[12px] text-[#747780]">({selectedCharger.type})</span>
                  </div>
                  <span className="text-[11px] text-[#747780] font-medium">
                    {selectedCharger.group}
                  </span>
                </div>
              </div>
              {getStatusBadge(selectedCharger.status)}
            </div>
          </div>

          {/* Quick Specs */}
          <div className="p-4 grid grid-cols-2 gap-2 bg-white border-b border-[#c4c6d0]/30">
            <div className="p-2 rounded bg-[#eff4ff] flex flex-col">
              <span className="text-[10px] uppercase text-[#747780] font-semibold">Sub-Feeder Group</span>
              <span className="text-[12px] font-semibold text-[#0b1c30] mt-0.5 truncate">
                {selectedCharger.group}
              </span>
            </div>
            <div className="p-2 rounded bg-[#eff4ff] flex flex-col">
              <span className="text-[10px] uppercase text-[#747780] font-semibold">Hardware Limit</span>
              <span className="font-mono text-[13px] font-bold text-[#00163d] mt-0.5">
                {selectedCharger.maxPower} kW Peak
              </span>
            </div>
            <div className="p-2 rounded bg-[#eff4ff] flex flex-col">
              <span className="text-[10px] uppercase text-[#747780] font-semibold">Assigned Vehicle</span>
              <span className="font-mono text-[13px] font-bold text-[#0f2b5c] mt-0.5">
                {selectedCharger.connectedVehicleId || selectedCharger.assignedVehicleId || 'Idle / Queue'}
              </span>
            </div>
            <div className="p-2 rounded bg-[#eff4ff] flex flex-col">
              <span className="text-[10px] uppercase text-[#747780] font-semibold">Smart Charging</span>
              <span className="text-[12px] font-bold text-[#006c4a] mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                <span>OCPP 2.0.1 Enabled</span>
              </span>
            </div>
          </div>

          {/* Active Modulation Telemetry */}
          <div className="p-4 flex flex-col gap-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-semibold text-[#747780] tracking-wider">
                Active Power Delivery
              </span>
              <span className="font-mono text-[14px] font-bold text-[#00163d]">
                {selectedCharger.currentPower} / {selectedCharger.maxPower} kW
              </span>
            </div>

            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[#eff4ff]">
              <div className="flex justify-between text-[11px] text-[#747780]">
                <span>Power Modulation Setpoint</span>
                <span className="font-mono font-semibold text-[#0b1c30]">
                  {Math.round((selectedCharger.currentPower / selectedCharger.maxPower) * 100)}% Throttle
                </span>
              </div>
              <div className="w-full h-3 rounded bg-[#e5eeff] overflow-hidden">
                <div
                  className="h-full bg-[#00163d] rounded-l transition-all"
                  style={{
                    width: `${Math.round((selectedCharger.currentPower / selectedCharger.maxPower) * 100)}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-[#747780] font-mono">
                <span>0 kW</span>
                <span>Optimized Cap: {selectedCharger.currentPower} kW</span>
                <span>{selectedCharger.maxPower} kW</span>
              </div>
            </div>

            {/* Operator Control Actions (Start/Stop Session, Set Power Limit, Switch Priority Mode) */}
            <div className="p-3 bg-[#eff4ff] rounded-lg border border-blue-200 flex flex-col gap-2.5 text-[11px]">
              <div className="font-bold text-[#00163d] uppercase tracking-wider flex items-center justify-between">
                <span>Operator Controls</span>
                <span className="text-[10px] text-[#747780] font-mono">OCPP Live</span>
              </div>

              {/* 1. Start / Stop Session & 2. Switch Priority Mode */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (selectedCharger.status === 'Charging' || selectedCharger.status === 'Priority Charging') {
                      showToast(`Session stopped on ${selectedCharger.id}. Cable unlatched.`);
                    } else {
                      showToast(`Session started on ${selectedCharger.id}. Negotiating handshake...`);
                    }
                  }}
                  className={`flex-1 h-8.5 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs ${
                    selectedCharger.status === 'Charging' || selectedCharger.status === 'Priority Charging'
                      ? 'bg-[#ba1a1a] text-white hover:bg-red-800'
                      : 'bg-[#006c4a] text-white hover:bg-emerald-800'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {selectedCharger.status === 'Charging' || selectedCharger.status === 'Priority Charging' ? 'stop' : 'play_arrow'}
                  </span>
                  <span>
                    {selectedCharger.status === 'Charging' || selectedCharger.status === 'Priority Charging' ? 'Stop Session' : 'Start Session'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    const nextMode = selectedCharger.status === 'Priority Charging' ? 'Standard Smart Charging' : 'Priority DC Boost';
                    showToast(`${selectedCharger.id} switched to ${nextMode}`);
                  }}
                  className="flex-1 h-8.5 rounded-md bg-[#00163d] text-white hover:bg-[#0f2b5c] text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[15px] text-[#85f8c4]">bolt</span>
                  <span>{selectedCharger.status === 'Priority Charging' ? 'Standard Mode' : 'Priority Boost'}</span>
                </button>
              </div>

              {/* 3. Set Power Limit */}
              <div className="p-2 bg-white rounded-md border border-slate-200 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[#00163d]">Set Power Cap</span>
                  <span className="font-mono font-bold text-[#00163d]">{activePowerLimit} kW</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="7"
                    max={selectedCharger.maxPower}
                    value={activePowerLimit}
                    onChange={(e) => setActivePowerLimit(Number(e.target.value))}
                    className="flex-1 accent-[#00163d]"
                  />
                  <button
                    onClick={() => showToast(`${selectedCharger.id} power limit set to ${activePowerLimit} kW`)}
                    className="px-2.5 py-1 rounded bg-[#00163d] text-white text-[10px] font-bold hover:bg-[#0f2b5c] cursor-pointer shadow-2xs"
                    type="button"
                  >
                    Apply Cap
                  </button>
                </div>
              </div>
            </div>

            {/* Smart Governor Details */}
            <div className="p-3 rounded bg-[#eff4ff] border border-blue-100 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#0f2b5c] shrink-0 mt-0.5">
                tune
              </span>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#00163d] uppercase tracking-wide">
                  AUTOMATED LOAD BALANCING
                </span>
                <p className="text-[12px] text-[#44464f] mt-0.5 leading-snug">
                  {selectedCharger.status === 'Priority Charging'
                    ? 'Delivering maximum continuous DC boost. Sub-feeder group headroom was dynamically reserved from adjacent bays to maintain feeder stability.'
                    : selectedCharger.currentPower > 0
                    ? `Output capped at ${selectedCharger.currentPower} kW by the central optimizer to avoid exceeding the 600 kW site capacity during peak tariff hours.`
                    : 'Bay is idle in standby mode. Ready to receive incoming fleet units or emergency diversion.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-[#eff4ff] border-t border-[#c4c6d0]/30 flex items-center gap-2">
            <button
              onClick={() => showToast(`OCPP diagnostics pinged for ${selectedCharger.id}. Response latency: 18ms.`)}
              className="flex-1 h-9 rounded bg-white text-[#0b1c30] text-[12px] font-semibold hover:bg-slate-50 transition-colors shadow-xs flex items-center justify-center gap-1.5 border border-slate-200"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-[#747780]">sensors</span>
              <span>OCPP Diagnostic</span>
            </button>
            <button
              onClick={() => showToast(`Bay ${selectedCharger.location} set to Manual Calibration mode.`)}
              className="flex-1 h-9 rounded bg-[#0f2b5c] text-white text-[12px] font-semibold hover:bg-[#00163d] transition-colors shadow-xs flex items-center justify-center gap-1.5"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>Set Cap</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
