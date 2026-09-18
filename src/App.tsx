/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GridChargeProvider, useGridCharge } from './context/GridChargeContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { FleetManagement } from './components/FleetManagement';
import { ChargingInfrastructure } from './components/ChargingInfrastructure';
import { ChargingSchedule } from './components/ChargingSchedule';
import { EnergyAndGrid } from './components/EnergyAndGrid';
import { Simulation } from './components/Simulation';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { OptimizationResult } from './components/OptimizationResult';
import { AddVehicleModal } from './components/AddVehicleModal';
import { AddChargerModal } from './components/AddChargerModal';
import { SAPPlayground } from './components/SAPPlayground';
import { DataInspector } from './components/DataInspector';
import { PdfScheduleWorkflow } from './components/PdfScheduleWorkflow';

const MainLayout: React.FC = () => {
  const { currentView, toastMessage, hideToast } = useGridCharge();

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'data-inspector':
        return <DataInspector />;
      case 'fleet':
        return <FleetManagement />;
      case 'charging-infrastructure':
        return <ChargingInfrastructure />;
      case 'charging-schedule':
        return <ChargingSchedule />;
      case 'energy-and-grid':
        return <EnergyAndGrid />;
      case 'simulation':
        return <Simulation />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      case 'optimization-result':
        return <OptimizationResult />;
      case 'add-vehicle':
        return <AddVehicleModal />;
      case 'add-charger':
        return <AddChargerModal />;
      case 'playground':
        return <SAPPlayground />;
      case 'pdf-schedule-import':
        return <PdfScheduleWorkflow />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col font-sans antialiased">
      {/* Persistent Left Navigation Sidebar */}
      <Sidebar />

      {/* Fixed Header Toolbar */}
      <Header />

      {/* Main Content Area */}
      <main className="ml-64 mt-14 p-6 flex-1 flex flex-col">
        <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col">
          {renderActiveView()}
        </div>
      </main>

      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-[#00163d] text-white px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 animate-slide-up text-[13px]">
          <span className="material-symbols-outlined text-[18px] text-[#82f5c1]">info</span>
          <span className="font-medium">{toastMessage}</span>
          <button
            onClick={hideToast}
            className="ml-2 text-slate-400 hover:text-white p-0.5"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <GridChargeProvider>
      <MainLayout />
    </GridChargeProvider>
  );
}
