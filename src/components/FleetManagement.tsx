import React, { useState } from 'react';
import { useGridCharge } from '../context/GridChargeContext';
import { PriorityLevel } from '../types';

export const FleetManagement: React.FC = () => {
  const {
    vehicles,
    selectedVehicleId,
    setSelectedVehicleId,
    setCurrentView,
    updateVehicle,
    deleteVehicle,
    showToast,
  } = useGridCharge();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    currentSOC: number;
    targetSOC: number;
    departureTime: string;
    routePriority: PriorityLevel;
  }>({
    currentSOC: 30,
    targetSOC: 90,
    departureTime: '19:30',
    routePriority: 'NORMAL',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [routeFilter, setRouteFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'departure' | 'soc' | 'priority'>('departure');

  // Selected vehicle (or default to first / EV-002)
  const selectedVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) ||
    vehicles.find((v) => v.id === 'EV-002') ||
    vehicles[0];

  // Derived counts
  const totalCount = vehicles.length;
  const chargingCount = vehicles.filter(
    (v) => v.chargingStatus === 'Charging' || v.chargingStatus === 'Boost DC'
  ).length;
  const readyCount = vehicles.filter(
    (v) => v.chargingStatus === 'Ready' || v.currentSOC >= v.targetSOC
  ).length;
  const attentionCount = vehicles.filter(
    (v) => v.chargingStatus === 'Attention' || (v.routePriority === 'CRITICAL' && v.currentSOC < 50)
  ).length;

  // Filter & Sort
  const filteredVehicles = vehicles
    .filter((v) => {
      const matchesSearch =
        v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.assignedChargerId && v.assignedChargerId.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesRoute = routeFilter === 'All' || v.route === routeFilter;
      const matchesPriority = priorityFilter === 'All' || v.routePriority === priorityFilter;
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Charging' && (v.chargingStatus === 'Charging' || v.chargingStatus === 'Boost DC')) ||
        (statusFilter === 'Ready' && v.chargingStatus === 'Ready') ||
        (statusFilter === 'Scheduled' && v.chargingStatus === 'Scheduled');

      return matchesSearch && matchesRoute && matchesPriority && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'departure') return a.departureTime.localeCompare(b.departureTime);
      if (sortBy === 'soc') return a.currentSOC - b.currentSOC;
      if (sortBy === 'priority') {
        const pOrder: Record<PriorityLevel, number> = { CRITICAL: 0, HIGH: 1, NORMAL: 2 };
        return pOrder[a.routePriority] - pOrder[b.routePriority];
      }
      return 0;
    });

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#ffdad6] text-[#ba1a1a]">
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#ffdcc3] text-[#6e3900]">
            HIGH
          </span>
        );
      case 'NORMAL':
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase bg-[#dce9ff] text-[#44464f]">
            NORMAL
          </span>
        );
    }
  };

  const getStatusPill = (status: string) => {
    if (status === 'Boost DC' || status === 'Charging') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#0f2b5c] text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-[#82f5c1] animate-ping"></span>
          <span>{status === 'Boost DC' ? 'Boost DC' : 'Charging'}</span>
        </span>
      );
    }
    if (status === 'Ready') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#82f5c1]/40 text-[#005137]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#006c4a]"></span>
          <span>Ready</span>
        </span>
      );
    }
    if (status === 'Attention') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#ffdad6] text-[#ba1a1a]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>
          <span>Attention</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#e5eeff] text-[#44464f]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#747780]"></span>
        <span>Scheduled</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col w-full gap-4">
      {/* 1. TOP HEADER SUB-BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex flex-col">
          <h1 className="text-[20px] font-bold text-[#00163d] tracking-tight">Fleet Management</h1>
          <p className="text-[12px] text-[#44464f]">
            Operational overview of all depot delivery vehicles, charging readiness, and route requirements.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSearchQuery('')}
            className="inline-flex items-center justify-center p-1.5 h-8.5 w-8.5 rounded-md bg-white text-[#44464f] hover:text-[#00163d] hover:bg-[#eff4ff] shadow-2xs transition-colors border border-[#c4c6d0] cursor-pointer"
            title="Refresh Fleet Data"
            type="button"
          >
            <span className="material-symbols-outlined text-[17px]">refresh</span>
          </button>
          <button
            onClick={() => setCurrentView('add-vehicle')}
            className="inline-flex items-center gap-1.5 px-3.5 h-8.5 rounded-md bg-[#00163d] text-white text-[12px] font-semibold hover:bg-[#0f2b5c] transition-colors shadow-xs cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-[#85f8c4]">add</span>
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY KPI CARDS (4 compact metric cards matching spec) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Vehicles */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#747780] font-semibold">Total Vehicles</span>
            <span className="material-symbols-outlined text-[18px] text-[#00163d]">local_shipping</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-mono font-bold text-[#00163d]">{totalCount}</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#eff4ff] text-[#00163d] font-bold">
              27 Commercial EVs
            </span>
          </div>
          <div className="text-[11px] text-[#44464f] mt-1 truncate">Tata Ace, Zor Grand, Euler HiLoad</div>
        </div>

        {/* Card 2: Charging */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#747780] font-semibold">Actively Charging</span>
            <span className="material-symbols-outlined text-[18px] text-[#00163d]">bolt</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-mono font-bold text-[#00163d]">8</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 font-bold">
              Staggered Dispatch
            </span>
          </div>
          <div className="text-[11px] text-[#44464f] mt-1 truncate">6 AC Bays (22 kW) • 2 DC Fast (44 kW)</div>
        </div>

        {/* Card 3: Ready for Departure */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#747780] font-semibold">Ready for Departure</span>
            <span className="material-symbols-outlined text-[18px] text-[#006c4a]">check_circle</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-mono font-bold text-[#006c4a]">16</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#85f8c4]/30 text-[#005137] font-bold">
              Target SOC Met
            </span>
          </div>
          <div className="text-[11px] text-[#44464f] mt-1 truncate">Pre-trip staging verified</div>
        </div>

        {/* Card 4: Departure at Risk */}
        <div className="p-3.5 rounded-xl bg-white border border-[#c4c6d0]/50 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#747780] font-semibold">Departure at Risk</span>
            <span className="material-symbols-outlined text-[18px] text-[#ba1a1a]">warning</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-mono font-bold text-[#ba1a1a]">1</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#ffdad6] text-[#ba1a1a] font-bold">
              EV-1044 Tight Slack
            </span>
          </div>
          <div className="text-[11px] text-[#44464f] mt-1 truncate">Priority DC Boost bay allocated</div>
        </div>
      </div>

      {/* 3. FILTER & CONTROLS BAR */}
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
              className="w-60 lg:w-72 h-8 pl-8 pr-2.5 rounded bg-[#eff4ff] text-[#0b1c30] text-[12px] placeholder:text-[#747780] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#00163d] transition-all border border-slate-200"
              placeholder="Search vehicle ID, route, charger..."
              type="text"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="h-8 px-2.5 rounded bg-white text-[#0b1c30] text-[12px] font-medium border border-[#c4c6d0] focus:outline-none"
            >
              <option value="All">All Routes</option>
              <option value="North Hub">North Hub</option>
              <option value="Airport Route">Airport Route</option>
              <option value="City Route">City Route</option>
              <option value="East Logistics">East Logistics</option>
              <option value="Express Parcel">Express Parcel</option>
              <option value="South Industrial">South Industrial</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-8 px-2.5 rounded bg-white text-[#0b1c30] text-[12px] font-medium border border-[#c4c6d0] focus:outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Priority</option>
              <option value="NORMAL">Normal</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2.5 rounded bg-white text-[#0b1c30] text-[12px] font-medium border border-[#c4c6d0] focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Charging">Charging</option>
              <option value="Ready">Ready</option>
              <option value="Scheduled">Scheduled</option>
            </select>
          </div>
        </div>

        {/* Metadata & Sorter */}
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-[11px] text-[#747780] whitespace-nowrap">
            Showing {filteredVehicles.length} of {vehicles.length} Vehicles
          </span>
          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-8 px-2.5 rounded bg-white text-[#0b1c30] text-[12px] font-medium border border-[#c4c6d0] focus:outline-none"
          >
            <option value="departure">Sort: Departure (Soonest)</option>
            <option value="soc">Sort: SOC (Lowest)</option>
            <option value="priority">Sort: Route Priority</option>
          </select>
        </div>
      </div>

      {/* 4. MAIN WORKSPACE: SPLIT 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT: MAIN VEHICLE DATA TABLE (approx 68% -> col-span-8) */}
        <div className="lg:col-span-8 flex flex-col rounded-lg bg-white border border-[#c4c6d0]/40 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="h-8 bg-[#eff4ff] text-[11px] font-bold text-[#00163d] uppercase tracking-wider select-none border-b border-[#c4c6d0]/30">
                  <th className="py-2 px-3 whitespace-nowrap">Vehicle ID</th>
                  <th className="py-2 px-3 whitespace-nowrap">Model</th>
                  <th className="py-2 px-3 whitespace-nowrap">Assigned Route</th>
                  <th className="py-2 px-3 whitespace-nowrap">Current SOC</th>
                  <th className="py-2 px-3 whitespace-nowrap text-right">Target SOC</th>
                  <th className="py-2 px-3 whitespace-nowrap text-right">Required</th>
                  <th className="py-2 px-3 whitespace-nowrap font-mono">Arrival</th>
                  <th className="py-2 px-3 whitespace-nowrap font-mono">Departure</th>
                  <th className="py-2 px-3 whitespace-nowrap">Priority</th>
                  <th className="py-2 px-3 whitespace-nowrap text-center">Charging Status</th>
                  <th className="py-2 px-3 whitespace-nowrap text-center">Readiness Status</th>
                  <th className="py-2 px-3 whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[12px] text-[#0b1c30]">
                {filteredVehicles.map((v) => {
                  const isSelected = v.id === selectedVehicle.id;
                  const isReady = v.chargingStatus === 'Ready' || v.currentSOC >= v.targetSOC;
                  const isAtRisk = v.routePriority === 'CRITICAL' && (v.inspectionBufferMin !== undefined && v.inspectionBufferMin < 10);
                  const readinessLabel = isReady ? 'Ready' : isAtRisk ? 'Needs Attention' : 'On Schedule';

                  return (
                    <tr
                      key={v.id}
                      onClick={() => setSelectedVehicleId(v.id)}
                      className={`h-11 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#eff4ff] font-medium shadow-xs'
                          : 'hover:bg-[#eff4ff]/50'
                      }`}
                    >
                      <td className="py-1.5 px-3 font-mono font-bold text-[#00163d] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isSelected && <span className="w-1 h-4 rounded-r bg-[#00163d] -ml-3 mr-1"></span>}
                          <span className="material-symbols-outlined text-[16px] text-[#747780]">
                            {v.routePriority === 'CRITICAL' ? 'airport_shuttle' : 'local_shipping'}
                          </span>
                          <span>{v.id}</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-3 text-[#44464f] whitespace-nowrap font-medium">{v.model}</td>
                      <td className="py-1.5 px-3 whitespace-nowrap font-medium text-[#0b1c30]">{v.route}</td>
                      <td className="py-1.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-2 rounded bg-[#e5eeff] overflow-hidden">
                            <div
                              className={`h-full ${
                                v.currentSOC < 45
                                  ? 'bg-[#de7b0d]'
                                  : v.currentSOC >= v.targetSOC
                                  ? 'bg-[#006c4a]'
                                  : 'bg-[#0f2b5c]'
                              }`}
                              style={{ width: `${v.currentSOC}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-[11px] font-bold">{v.currentSOC}%</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-[#00163d]">{v.targetSOC}%</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-[#00163d]">
                        {v.requiredEnergy > 0 ? `${v.requiredEnergy} kWh` : '0 kWh'}
                      </td>
                      <td className="py-1.5 px-3 font-mono text-[11px] text-[#44464f] whitespace-nowrap">
                        {v.arrivalTime || '15:00'}
                      </td>
                      <td className="py-1.5 px-3 font-mono text-[11px] font-bold text-[#ba1a1a] whitespace-nowrap">
                        {v.departureTime}
                      </td>
                      <td className="py-1.5 px-3 whitespace-nowrap">{getPriorityBadge(v.routePriority)}</td>
                      <td className="py-1.5 px-3 whitespace-nowrap text-center">{getStatusPill(v.chargingStatus)}</td>
                      <td className="py-1.5 px-3 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            readinessLabel === 'Ready'
                              ? 'bg-[#85f8c4]/40 text-[#005137]'
                              : readinessLabel === 'Needs Attention'
                              ? 'bg-[#ffdad6] text-[#ba1a1a]'
                              : 'bg-blue-50 text-blue-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              readinessLabel === 'Ready'
                                ? 'bg-[#006c4a]'
                                : readinessLabel === 'Needs Attention'
                                ? 'bg-[#ba1a1a] animate-ping'
                                : 'bg-blue-600'
                            }`}
                          ></span>
                          <span>{readinessLabel}</span>
                        </span>
                      </td>
                      <td className="py-1.5 px-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedVehicleId(v.id)}
                            className="p-1 rounded hover:bg-slate-200 text-[#00163d]"
                            title="View Charging Details"
                          >
                            <span className="material-symbols-outlined text-[15px]">visibility</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedVehicleId(v.id);
                              setEditForm({
                                currentSOC: v.currentSOC,
                                targetSOC: v.targetSOC,
                                departureTime: v.departureTime,
                                routePriority: v.routePriority,
                              });
                              setIsEditModalOpen(true);
                            }}
                            className="p-1 rounded hover:bg-slate-200 text-[#00163d]"
                            title="Edit Route SLA"
                          >
                            <span className="material-symbols-outlined text-[15px]">edit</span>
                          </button>
                          <button
                            onClick={() => {
                              const nextPriority: Record<PriorityLevel, PriorityLevel> = {
                                NORMAL: 'HIGH',
                                HIGH: 'CRITICAL',
                                CRITICAL: 'NORMAL',
                              };
                              updateVehicle(v.id, { routePriority: nextPriority[v.routePriority] });
                              showToast(`${v.id} priority set to ${nextPriority[v.routePriority]}`);
                            }}
                            className="p-1 rounded hover:bg-slate-200 text-[#6e3900]"
                            title="Cycle Priority"
                          >
                            <span className="material-symbols-outlined text-[15px]">flag</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Note */}
          <div className="h-9 px-4 bg-[#eff4ff]/60 border-t border-[#c4c6d0]/30 flex items-center justify-between text-[11px] text-[#747780]">
            <span>Click any vehicle row to inspect real-time charging telemetry & staging buffer</span>
            <span className="font-mono">{filteredVehicles.length} units listed</span>
          </div>
        </div>

        {/* RIGHT: VEHICLE INSPECTION & CHARGING TELEMETRY PANEL (col-span-4) */}
        <div className="lg:col-span-4 flex flex-col rounded-lg bg-white border border-[#c4c6d0]/40 shadow-xs overflow-hidden sticky top-16">
          {/* Panel Header */}
          <div className="p-4 bg-[#eff4ff] border-b border-[#c4c6d0]/30 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#747780]">
                VEHICLE CHARGING DETAILS
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-white border border-slate-200 text-[#00163d]">
                Inspecting Node
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded bg-[#00163d] text-white flex items-center justify-center font-mono text-[16px] font-bold">
                  <span className="material-symbols-outlined text-[20px]">
                    {selectedVehicle.routePriority === 'CRITICAL' ? 'airport_shuttle' : 'directions_bus'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[17px] font-bold text-[#00163d] leading-tight">
                      {selectedVehicle.id}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-[#dce9ff] text-[#00163d]">
                      {selectedVehicle.chargingStatus}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#747780] font-medium">
                    {selectedVehicle.model} • {selectedVehicle.type}
                  </span>
                </div>
              </div>
              {getPriorityBadge(selectedVehicle.routePriority)}
            </div>
          </div>

          {/* Quick Specs Grid */}
          <div className="p-4 grid grid-cols-2 gap-2 bg-white border-b border-[#c4c6d0]/30">
            <div className="p-2 rounded bg-[#eff4ff] flex flex-col">
              <span className="text-[10px] uppercase text-[#747780] font-semibold">Route Assignment</span>
              <span className="text-[13px] font-semibold text-[#0b1c30] mt-0.5 truncate">
                {selectedVehicle.route}
              </span>
            </div>
            <div className="p-2 rounded bg-[#eff4ff] flex flex-col">
              <span className="text-[10px] uppercase text-[#747780] font-semibold">Priority Tier</span>
              <span
                className={`text-[13px] font-bold mt-0.5 ${
                  selectedVehicle.routePriority === 'CRITICAL' ? 'text-[#ba1a1a]' : 'text-[#00163d]'
                }`}
              >
                {selectedVehicle.routePriority}
              </span>
            </div>
            <div className="p-2 rounded bg-[#eff4ff] flex flex-col col-span-2">
              <span className="text-[10px] uppercase text-[#747780] font-semibold">Active Status</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-[#006c4a] animate-ping"></span>
                <span className="text-[12px] font-semibold text-[#00163d]">
                  {selectedVehicle.chargingStatus} Session ({selectedVehicle.currentPower} kW intake)
                </span>
              </div>
            </div>
            <div className="p-2 rounded bg-[#eff4ff] flex flex-col col-span-2">
              <span className="text-[10px] uppercase text-[#747780] font-semibold">Scheduled Departure</span>
              <span className="font-mono text-[14px] font-bold text-[#0b1c30] mt-0.5">
                {selectedVehicle.departureTime} (Target SLA)
              </span>
            </div>
          </div>

          {/* Charging & Energy Telemetry Box */}
          <div className="p-4 flex flex-col gap-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-semibold text-[#747780] tracking-wider">
                State of Charge Progress
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[13px] font-bold text-[#00163d]">
                <span className="material-symbols-outlined text-[15px] text-[#0f2b5c]">bolt</span>
                <span>{selectedVehicle.currentPower} kW Active Draw</span>
              </span>
            </div>

            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[#eff4ff]">
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[#747780]">Current SOC:</span>
                  <span className="font-mono text-[16px] font-bold text-[#de7b0d]">
                    {selectedVehicle.currentSOC}%
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#747780]">arrow_forward</span>
                  <span className="text-[11px] text-[#747780]">Target SOC:</span>
                  <span className="font-mono text-[15px] font-bold text-[#0b1c30]">
                    {selectedVehicle.targetSOC}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full h-3.5 rounded bg-[#e5eeff] overflow-hidden">
                <div
                  className="h-full bg-[#de7b0d] rounded-l transition-all"
                  style={{ width: `${selectedVehicle.currentSOC}%` }}
                ></div>
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-[#00163d] z-10"
                  style={{ left: `${selectedVehicle.targetSOC}%` }}
                  title="Target SOC"
                ></div>
                <div
                  className="absolute top-0 bottom-0 bg-[#0f2b5c]/25"
                  style={{
                    left: `${selectedVehicle.currentSOC}%`,
                    width: `${Math.max(0, selectedVehicle.targetSOC - selectedVehicle.currentSOC)}%`,
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#747780] pt-0.5 font-mono">
                <span>0%</span>
                <span>
                  Needed: +{Math.max(0, selectedVehicle.targetSOC - selectedVehicle.currentSOC)}% (
                  {selectedVehicle.requiredEnergy} kWh)
                </span>
                <span>100%</span>
              </div>
            </div>

            {/* 4 Telemetry Metrics */}
            <div className="grid grid-cols-2 gap-2 text-left font-mono">
              <div className="p-2 rounded bg-[#eff4ff]">
                <span className="text-[10px] text-[#747780] uppercase font-sans block">Assigned Charger</span>
                <span className="text-[13px] font-bold text-[#00163d]">
                  {selectedVehicle.assignedChargerId || 'Queue'}
                </span>
              </div>
              <div className="p-2 rounded bg-[#eff4ff]">
                <span className="text-[10px] text-[#747780] uppercase font-sans block">Max Intake</span>
                <span className="text-[13px] font-bold text-[#00163d]">
                  {selectedVehicle.maxChargingPower} kW
                </span>
              </div>
              <div className="p-2 rounded bg-[#eff4ff]">
                <span className="text-[10px] text-[#747780] uppercase font-sans block">Required Energy</span>
                <span className="text-[13px] font-bold text-[#0b1c30]">
                  {selectedVehicle.requiredEnergy} kWh
                </span>
              </div>
              <div className="p-2 rounded bg-[#eff4ff]">
                <span className="text-[10px] text-[#747780] uppercase font-sans block">Departure Slack</span>
                <span
                  className={`text-[13px] font-bold ${
                    (selectedVehicle.inspectionBufferMin || 0) < 0 ? 'text-[#ba1a1a]' : 'text-[#006c4a]'
                  }`}
                >
                  {selectedVehicle.inspectionBufferMin !== undefined
                    ? `${selectedVehicle.inspectionBufferMin} min`
                    : '+18 min'}
                </span>
              </div>
            </div>

            {/* Battery Specifications */}
            <div className="p-3 rounded bg-white border border-[#c4c6d0]/40 text-[11px] space-y-1">
              <div className="font-bold text-[#00163d] uppercase tracking-wide">Battery & Hardware Specs</div>
              <div className="grid grid-cols-2 gap-2 text-[#44464f] pt-1">
                <div>Capacity: <strong className="text-[#00163d]">{selectedVehicle.batteryCapacity || 75} kWh</strong></div>
                <div>Chemistry: <strong className="text-[#00163d]">LFP (Lithium Iron)</strong></div>
                <div>Max AC/DC: <strong className="text-[#00163d]">{selectedVehicle.maxChargingPower} kW</strong></div>
                <div>Assigned Bay: <strong className="text-[#00163d]">{selectedVehicle.assignedChargerId || 'Bay 04'}</strong></div>
              </div>
            </div>

            {/* Priority Toggle Buttons */}
            <div className="p-3 rounded bg-[#eff4ff] border border-blue-200">
              <span className="text-[10px] font-bold uppercase text-[#00163d] tracking-wider block mb-1.5">
                Quick Priority Override
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['CRITICAL', 'HIGH', 'NORMAL'] as PriorityLevel[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      updateVehicle(selectedVehicle.id, { routePriority: p });
                      showToast(`${selectedVehicle.id} priority set to ${p}`);
                    }}
                    className={`py-1 px-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      selectedVehicle.routePriority === p
                        ? p === 'CRITICAL'
                          ? 'bg-[#ba1a1a] text-white shadow-xs'
                          : p === 'HIGH'
                          ? 'bg-[#6e3900] text-white shadow-xs'
                          : 'bg-[#00163d] text-white shadow-xs'
                        : 'bg-white text-[#44464f] border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Staggering Logic Explanation Box */}
            <div className="p-3 rounded bg-[#eff4ff] border border-blue-100 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#0f2b5c] shrink-0 mt-0.5">
                psychology
              </span>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#00163d] uppercase tracking-wide">
                  SMART STAGGERING LOGIC
                </span>
                <p className="text-[12px] text-[#44464f] mt-0.5 leading-snug">
                  {selectedVehicle.routePriority === 'CRITICAL'
                    ? 'Charging was prioritized with high-power DC boost because this vehicle has a critical delivery route SLA, depleted SOC and an approaching departure window.'
                    : selectedVehicle.currentSOC > 80
                    ? 'Session was shifted past the evening peak window because sufficient battery energy buffer exists to safely delay top-up while preventing coincident demand surcharges.'
                    : 'Dispatched in coordinated rotation with neighbouring bays to level aggregate site load below the 600 kW threshold while honoring the delivery timetable.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons footer */}
          <div className="p-4 bg-[#eff4ff] border-t border-[#c4c6d0]/30 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditForm({
                    currentSOC: selectedVehicle.currentSOC,
                    targetSOC: selectedVehicle.targetSOC,
                    departureTime: selectedVehicle.departureTime,
                    routePriority: selectedVehicle.routePriority,
                  });
                  setIsEditModalOpen(true);
                }}
                className="flex-1 h-9 rounded bg-[#00163d] text-white text-[12px] font-semibold hover:bg-[#0f2b5c] transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px] text-[#85f8c4]">edit</span>
                <span>Edit Parameters</span>
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete ${selectedVehicle.id} from fleet?`)) {
                    deleteVehicle(selectedVehicle.id);
                    showToast(`Vehicle ${selectedVehicle.id} removed from fleet.`);
                  }
                }}
                className="h-9 px-3 rounded bg-white text-[#ba1a1a] hover:bg-[#ffdad6]/40 border border-[#ba1a1a]/30 text-[12px] font-semibold transition-colors flex items-center justify-center cursor-pointer"
                type="button"
                title="Delete Vehicle"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('charging-schedule')}
                className="flex-1 h-9 rounded bg-white text-[#0b1c30] text-[12px] font-semibold hover:bg-slate-50 transition-colors shadow-xs flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px] text-[#747780]">calendar_month</span>
                <span>View Charging Plan</span>
              </button>
              <button
                onClick={() => setCurrentView('add-vehicle')}
                className="flex-1 h-9 rounded bg-[#eff4ff] text-[#00163d] text-[12px] font-semibold hover:bg-[#e5eeff] transition-colors shadow-xs flex items-center justify-center gap-1.5 border border-[#c4c6d0]/40 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>New Vehicle</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00163d] text-[20px]">edit</span>
                <h3 className="text-[16px] font-bold text-[#00163d]">
                  Edit Vehicle: {selectedVehicle.id}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3.5 py-4 text-[13px]">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Current State of Charge (SOC %)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={editForm.currentSOC}
                    onChange={(e) => setEditForm({ ...editForm, currentSOC: Number(e.target.value) })}
                    className="flex-1 accent-[#00163d]"
                  />
                  <span className="font-mono font-bold text-[14px] w-12 text-right">
                    {editForm.currentSOC}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Target Departure SOC (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={editForm.targetSOC}
                    onChange={(e) => setEditForm({ ...editForm, targetSOC: Number(e.target.value) })}
                    className="flex-1 accent-[#00163d]"
                  />
                  <span className="font-mono font-bold text-[14px] w-12 text-right">
                    {editForm.targetSOC}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Scheduled Departure Time
                </label>
                <input
                  type="time"
                  value={editForm.departureTime}
                  onChange={(e) => setEditForm({ ...editForm, departureTime: e.target.value })}
                  className="w-full h-9 px-3 border border-slate-300 rounded font-mono text-[13px] focus:outline-none focus:border-[#00163d]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Route Delivery SLA Priority
                </label>
                <select
                  value={editForm.routePriority}
                  onChange={(e) => setEditForm({ ...editForm, routePriority: e.target.value as PriorityLevel })}
                  className="w-full h-9 px-3 border border-slate-300 rounded text-[13px] focus:outline-none focus:border-[#00163d]"
                >
                  <option value="CRITICAL">CRITICAL (e.g. Airport Express, Medical)</option>
                  <option value="HIGH">HIGH (e.g. Priority Logistics)</option>
                  <option value="NORMAL">NORMAL (Standard Route)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded text-slate-600 hover:bg-slate-100 text-[12px] font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const requiredEnergy = Math.max(
                    0,
                    Math.round(
                      ((editForm.targetSOC - editForm.currentSOC) / 100) * (selectedVehicle.batteryCapacity || 75)
                    )
                  );
                  updateVehicle(selectedVehicle.id, {
                    currentSOC: editForm.currentSOC,
                    targetSOC: editForm.targetSOC,
                    departureTime: editForm.departureTime,
                    routePriority: editForm.routePriority,
                    requiredEnergy,
                  });
                  setIsEditModalOpen(false);
                  showToast(`Updated parameters for ${selectedVehicle.id}`);
                }}
                className="px-4 py-2 rounded bg-[#00163d] hover:bg-[#0f2b5c] text-white text-[12px] font-semibold cursor-pointer shadow-xs"
              >
                Save Changes & Recompute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
