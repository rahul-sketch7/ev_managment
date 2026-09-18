import React, { useState } from 'react';
import { useGridCharge } from '../context/GridChargeContext';
import { PageView } from '../types';

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, t } = useGridCharge();
  const [showDevTools, setShowDevTools] = useState(false);

  // Exactly the 8 required primary navigation items
  const navItems: { path: PageView; label: string; icon: string }[] = [
    { path: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: 'fleet', label: 'Fleet Management', icon: 'local_shipping' },
    { path: 'charging-infrastructure', label: 'Charging Infrastructure', icon: 'ev_station' },
    { path: 'charging-schedule', label: 'Charging Schedule', icon: 'schedule' },
    { path: 'energy-and-grid', label: 'Energy & Grid', icon: 'electric_meter' },
    { path: 'simulation', label: 'Simulation', icon: 'tune' },
    { path: 'analytics', label: 'Analytics', icon: 'analytics' },
    { path: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-[#c4c6d0]/40 z-50 flex flex-col justify-between shadow-[0_1px_4px_rgba(11,28,48,0.03)] select-none">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div
          onClick={() => setCurrentView('dashboard')}
          className="h-14 px-4 flex items-center gap-2.5 border-b border-[#c4c6d0]/30 cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-[#00163d] flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[#82f5c1] text-[20px]">bolt</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[16px] font-bold tracking-tight text-[#00163d] leading-none">
                Grid<span className="text-blue-700">Charge</span>
              </span>
            </div>
            <span className="text-[10px] text-[#747780] tracking-tight mt-1 font-medium">
              EV Fleet Operations & Smart Charging
            </span>
          </div>
        </div>

        {/* Primary Operator Navigation Items */}
        <nav className="flex flex-col gap-0.5 p-2.5">
          {navItems.map((item) => {
            const isActive =
              currentView === item.path ||
              (item.path === 'charging-schedule' && currentView === 'optimization-result') ||
              (item.path === 'fleet' && currentView === 'add-vehicle') ||
              (item.path === 'charging-infrastructure' && currentView === 'add-charger');

            return (
              <button
                key={item.path}
                onClick={() => setCurrentView(item.path)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] transition-colors text-left w-full cursor-pointer ${
                  isActive
                    ? 'bg-[#dce9ff] text-[#00163d] font-semibold border-l-2 border-[#00163d]'
                    : 'text-[#44464f] hover:bg-[#eff4ff] hover:text-[#0b1c30] font-medium'
                }`}
              >
                <span className={`material-symbols-outlined text-[19px] ${isActive ? 'text-[#00163d]' : 'text-[#747780]'}`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Operational Status & Secondary Diagnostics */}
      <div className="p-3 border-t border-[#c4c6d0]/30 bg-[#eff4ff] flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006c4a] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006c4a]"></span>
            </span>
            <span className="text-[11px] font-bold text-[#006c4a] uppercase tracking-wider">
              SYSTEM ONLINE
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#747780]">Live Depot</span>
        </div>

        <div className="bg-white p-2 rounded border border-[#c4c6d0]/40">
          <div className="text-[10px] uppercase font-semibold text-[#747780]">Depot Facility</div>
          <div className="text-[12px] text-[#0b1c30] font-semibold truncate">
            Main Distribution Center
          </div>
        </div>

        {/* Discreet Secondary Developer/Debug Accordion (kept out of primary operator navigation) */}
        <div className="pt-1">
          <button
            onClick={() => setShowDevTools(!showDevTools)}
            className="flex items-center justify-between w-full text-[10px] text-[#747780] hover:text-[#00163d] px-1 py-0.5"
            type="button"
          >
            <span>Diagnostics & Technical</span>
            <span className="material-symbols-outlined text-[14px]">
              {showDevTools ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          {showDevTools && (
            <div className="flex flex-col gap-1 mt-1 p-1 bg-white/80 rounded border border-slate-200 text-[11px]">
              <button
                onClick={() => setCurrentView('data-inspector')}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-left hover:bg-slate-100 ${
                  currentView === 'data-inspector' ? 'font-bold text-blue-900 bg-blue-50' : 'text-slate-600'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">data_object</span>
                <span>Data & JSON Inspector</span>
              </button>
              <button
                onClick={() => setCurrentView('playground')}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-left hover:bg-slate-100 ${
                  currentView === 'playground' ? 'font-bold text-amber-900 bg-amber-50' : 'text-slate-600'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">terminal</span>
                <span>SAP eMobility (Legacy)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
