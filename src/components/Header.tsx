import React, { useState } from 'react';
import { useGridCharge } from '../context/GridChargeContext';
import { LanguageCode } from '../types';

export const Header: React.FC = () => {
  const {
    currentView,
    language,
    setLanguage,
    alerts,
    isOptimizing,
    runOptimization,
    vehicles,
    gridConfig,
    optimizationResult,
    t,
  } = useGridCharge();

  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);

  const viewTitles: Record<string, string> = {
    dashboard: t.dashboard,
    fleet: t.fleet,
    'charging-infrastructure': t.chargingInfrastructure,
    'charging-schedule': t.chargingSchedule,
    'energy-and-grid': t.energyAndGrid,
    simulation: t.simulation,
    analytics: t.analytics,
    settings: t.settings,
    'optimization-result': t.optimizationComplete,
    'add-vehicle': t.addVehicle,
    'add-charger': t.addCharger,
    playground: 'SAP eMobility Playground',
    'data-inspector': 'Data & JSON Inspector',
  };

  const languages: { code: LanguageCode; label: string; flag: string }[] = [
    { code: 'en', label: 'English (US)', flag: 'EN' },
    { code: 'hi', label: 'हिंदी (Hindi)', flag: 'HI' },
    { code: 'de', label: 'Deutsch (German)', flag: 'DE' },
    { code: 'es', label: 'Español (Spanish)', flag: 'ES' },
    { code: 'fr', label: 'Français (French)', flag: 'FR' },
  ];

  return (
    <header className="fixed top-0 left-64 right-0 h-14 bg-white border-b border-[#c4c6d0]/40 z-40 px-6 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Breadcrumb Context & Product Branding */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-bold text-[#00163d] tracking-tight">
            GridCharge
          </span>
          <span className="text-[#747780] text-[12px] font-medium">•</span>
          <span className="text-[13px] font-medium text-[#44464f] hidden sm:inline">
            EV Fleet Operations
          </span>
          <span className="text-[#747780] text-[12px]">/</span>
          <span className="px-2 py-0.5 rounded bg-[#e5eeff] text-[11px] text-[#00163d] font-semibold">
            {viewTitles[currentView] || 'Overview'}
          </span>
        </div>
      </div>

      {/* Right Toolbar */}
      <div className="flex items-center gap-3">
        {/* Facility Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 bg-[#eff4ff] border border-[#c4c6d0]/40 rounded-md px-2.5 py-1 text-[12px] font-medium text-[#0b1c30]">
          <span className="material-symbols-outlined text-[#00163d] text-[15px]">warehouse</span>
          <span>Main Distribution Center</span>
        </div>

        {/* System Online Status Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-md text-[11px] font-bold text-emerald-800">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006c4a] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006c4a]"></span>
          </span>
          <span>SYSTEM ONLINE</span>
        </div>

        {/* Quick Optimize Action */}
        <button
          onClick={() => runOptimization(true)}
          disabled={isOptimizing}
          className="flex items-center gap-1.5 px-3 py-1 bg-[#00163d] hover:bg-[#0f2b5c] text-white text-[12px] font-semibold rounded-md shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[15px] text-[#85f8c4] ${isOptimizing ? 'animate-spin' : ''}`}>
            {isOptimizing ? 'refresh' : 'bolt'}
          </span>
          <span>{isOptimizing ? 'Solving...' : 'Run Smart Optimization'}</span>
        </button>

        {/* Real-time Depot Clock (Local Depot Time) */}
        <div className="hidden md:flex items-center gap-1.5 text-[#44464f] font-mono text-[11px] bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
          <span className="material-symbols-outlined text-[14px] text-[#747780]">schedule</span>
          <span>18 Sep 2026, 17:42 Depot Time</span>
        </div>

        {/* Language Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#eff4ff] border border-[#c4c6d0]/40 hover:bg-[#e5eeff] text-[12px] font-medium text-[#0b1c30] transition-colors"
            title="Select Language"
          >
            <span className="material-symbols-outlined text-[16px] text-blue-800">translate</span>
            <span className="font-semibold uppercase text-[11px]">{language}</span>
            <span className="material-symbols-outlined text-[14px] text-slate-400">expand_more</span>
          </button>

          {isLangOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Interface Language
              </div>
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code);
                    setIsLangOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-[12px] flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    language === l.code ? 'font-bold text-blue-900 bg-blue-50/70' : 'text-slate-700'
                  }`}
                >
                  <span>{l.label}</span>
                  {language === l.code && (
                    <span className="material-symbols-outlined text-[15px] text-blue-800">check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-[#c4c6d0]/40 hidden md:block"></div>

        {/* Operational Alerts Bell with Live Counter */}
        <div className="relative">
          <button
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className="relative p-1.5 rounded hover:bg-[#e5eeff] text-[#44464f] hover:text-[#0b1c30] transition-colors"
            type="button"
            title="Operational Alerts"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#ba1a1a] ring-2 ring-white"></span>
          </button>

          {isAlertsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-red-600 text-[18px]">warning</span>
                  <span className="font-semibold text-slate-900 text-[13px]">
                    Operational Alerts ({alerts.length})
                  </span>
                </div>
                <button
                  onClick={() => setIsAlertsOpen(false)}
                  className="text-slate-400 hover:text-slate-700 text-[11px]"
                >
                  Close
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    className={`p-2.5 rounded border text-[12px] flex flex-col gap-1 ${
                      a.type === 'critical'
                        ? 'bg-red-50/70 border-red-200 text-slate-900'
                        : a.type === 'warning'
                        ? 'bg-amber-50/70 border-amber-200 text-slate-900'
                        : 'bg-blue-50/70 border-blue-200 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                          a.type === 'critical'
                            ? 'bg-red-600 text-white'
                            : a.type === 'warning'
                            ? 'bg-amber-600 text-white'
                            : 'bg-blue-800 text-white'
                        }`}
                      >
                        {a.type}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{a.timestamp}</span>
                    </div>
                    <div className="font-semibold text-slate-900">{a.title}</div>
                    <div className="text-slate-600 text-[11px] leading-tight">{a.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-[#00163d] flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-white text-[18px]">person</span>
          </div>
          <span className="text-[12px] font-semibold text-[#0b1c30] hidden md:inline">Admin</span>
        </div>
      </div>
    </header>
  );
};
