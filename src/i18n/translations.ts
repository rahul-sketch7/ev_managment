import { LanguageCode } from '../types';

export interface Translations {
  appName: string;
  appSubtitle: string;
  facilityName: string;
  systemOnline: string;
  dashboard: string;
  fleet: string;
  chargingInfrastructure: string;
  chargingSchedule: string;
  energyAndGrid: string;
  simulation: string;
  analytics: string;
  settings: string;
  runOptimization: string;
  addVehicle: string;
  addCharger: string;
  simulateScenario: string;
  peakDemand: string;
  projectedEnergyCost: string;
  vehiclesReady: string;
  chargersActive: string;
  gridCapacity: string;
  currentDemand: string;
  availableHeadroom: string;
  utilization: string;
  optimizationImpact: string;
  uncontrolledDemand: string;
  optimizedDemand: string;
  howItWorks: string;
  howItWorksDesc: string;
  operationalAlerts: string;
  fleetDispatch: string;
  whyThisSchedule: string;
  searchPlaceholder: string;
  saveChanges: string;
  cancel: string;
  applySchedule: string;
  optimizationComplete: string;
}

export const translations: Record<LanguageCode, Translations> = {
  en: {
    appName: 'GridCharge',
    appSubtitle: 'Depot Electrification v2.4',
    facilityName: 'Main Distribution Center',
    systemOnline: 'System Online',
    dashboard: 'Dashboard',
    fleet: 'Fleet Management',
    chargingInfrastructure: 'Charging Infrastructure',
    chargingSchedule: 'Charging Schedule',
    energyAndGrid: 'Energy & Grid',
    simulation: 'Simulation',
    analytics: 'Analytics',
    settings: 'Settings',
    runOptimization: 'Run Optimization',
    addVehicle: 'Add Vehicle',
    addCharger: 'Add Charger',
    simulateScenario: 'Simulate Scenario',
    peakDemand: 'Peak Demand',
    projectedEnergyCost: 'Projected Energy Cost',
    vehiclesReady: 'Vehicles Ready',
    chargersActive: 'Chargers Active',
    gridCapacity: 'Grid Capacity',
    currentDemand: 'Current Demand',
    availableHeadroom: 'Available Headroom',
    utilization: 'Grid Utilization',
    optimizationImpact: 'Optimization Impact',
    uncontrolledDemand: 'Uncontrolled Demand',
    optimizedDemand: 'Optimized Demand',
    howItWorks: 'How GridCharge Works',
    howItWorksDesc:
      'Charging is automatically staggered according to vehicle departure time, battery state, route priority, grid capacity and electricity price.',
    operationalAlerts: 'Operational Alerts',
    fleetDispatch: 'Fleet Dispatch & Telemetry',
    whyThisSchedule: 'Why This Schedule?',
    searchPlaceholder: 'Search vehicle ID, route, charger...',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    applySchedule: 'Apply Charging Schedule',
    optimizationComplete: 'Optimization Complete',
  },
  hi: {
    appName: 'GridCharge',
    appSubtitle: 'डिपो विद्युतीकरण v2.4',
    facilityName: 'मुख्य वितरण केंद्र (MDC)',
    systemOnline: 'सिस्टम ऑनलाइन',
    dashboard: 'डैशबोर्ड',
    fleet: 'फ्लीट प्रबंधन',
    chargingInfrastructure: 'चार्जिंग बुनियादी ढांचा',
    chargingSchedule: 'चार्जिंग अनुसूची',
    energyAndGrid: 'ऊर्जा और ग्रिड',
    simulation: 'सिमुलेशन',
    analytics: 'एनालिटिक्स',
    settings: 'सेटिंग्स',
    runOptimization: 'ऑप्टिमाइजेशन चलाएं',
    addVehicle: 'वाहन जोड़ें',
    addCharger: 'चार्जर जोड़ें',
    simulateScenario: 'परिदृश्य सिमुलेट करें',
    peakDemand: 'पीक डिमांड',
    projectedEnergyCost: 'अनुमानित ऊर्जा लागत',
    vehiclesReady: 'तैयार वाहन',
    chargersActive: 'सक्रिय चार्जर',
    gridCapacity: 'ग्रिड क्षमता',
    currentDemand: 'वर्तमान मांग',
    availableHeadroom: 'उपलब्ध हेडरूम',
    utilization: 'ग्रिड उपयोग',
    optimizationImpact: 'ऑप्टिमाइजेशन प्रभाव',
    uncontrolledDemand: 'अनियंत्रित मांग',
    optimizedDemand: 'अनुकूलित मांग',
    howItWorks: 'GridCharge कैसे कार्य करता है',
    howItWorksDesc:
      'वाहन प्रस्थान समय, बैटरी स्थिति, मार्ग प्राथमिकता, ग्रिड क्षमता और बिजली दर के अनुसार चार्जिंग स्वचालित रूप से प्रबंधित की जाती है।',
    operationalAlerts: 'परिचालन चेतावनी',
    fleetDispatch: 'फ्लीट प्रेषण और टेलीमेट्री',
    whyThisSchedule: 'यह अनुसूची क्यों चुनी गई?',
    searchPlaceholder: 'वाहन आईडी, मार्ग, चार्जर खोजें...',
    saveChanges: 'परिवर्तन सहेजें',
    cancel: 'रद्द करें',
    applySchedule: 'चार्जिंग अनुसूची लागू करें',
    optimizationComplete: 'ऑप्टिमाइजेशन पूर्ण',
  },
  de: {
    appName: 'GridCharge',
    appSubtitle: 'Depot-Elektrifizierung v2.4',
    facilityName: 'Hauptverteilzentrum',
    systemOnline: 'System Online',
    dashboard: 'Übersicht',
    fleet: 'Flottenmanagement',
    chargingInfrastructure: 'Ladeinfrastruktur',
    chargingSchedule: 'Ladezeitplan',
    energyAndGrid: 'Energie & Netz',
    simulation: 'Simulation',
    analytics: 'Analytik',
    settings: 'Einstellungen',
    runOptimization: 'Optimierung ausführen',
    addVehicle: 'Fahrzeug hinzufügen',
    addCharger: 'Ladegerät hinzufügen',
    simulateScenario: 'Szenario simulieren',
    peakDemand: 'Spitzenlast',
    projectedEnergyCost: 'Geschätzte Energiekosten',
    vehiclesReady: 'Fahrzeuge bereit',
    chargersActive: 'Aktive Ladestationen',
    gridCapacity: 'Netzkapazität',
    currentDemand: 'Aktueller Bedarf',
    availableHeadroom: 'Verfügbare Reserve',
    utilization: 'Netzauslastung',
    optimizationImpact: 'Optimierungswirkung',
    uncontrolledDemand: 'Ungesteuerter Bedarf',
    optimizedDemand: 'Optimierter Bedarf',
    howItWorks: 'So funktioniert GridCharge',
    howItWorksDesc:
      'Das Laden wird unter Berücksichtigung von Abfahrtszeiten, Akkuzustand, Routenpriorität, Netzkapazität und Stromtarifen automatisch zeitlich gestaffelt.',
    operationalAlerts: 'Betriebswarnungen',
    fleetDispatch: 'Flottendispatch & Telemetrie',
    whyThisSchedule: 'Warum dieser Zeitplan?',
    searchPlaceholder: 'Fahrzeug-ID, Route, Lader suchen...',
    saveChanges: 'Änderungen speichern',
    cancel: 'Abbrechen',
    applySchedule: 'Ladeplan anwenden',
    optimizationComplete: 'Optimierung abgeschlossen',
  },
  es: {
    appName: 'GridCharge',
    appSubtitle: 'Electrificación de Depósito v2.4',
    facilityName: 'Centro Principal de Distribución',
    systemOnline: 'Sistema En Línea',
    dashboard: 'Panel de Control',
    fleet: 'Gestión de Flota',
    chargingInfrastructure: 'Infraestructura de Carga',
    chargingSchedule: 'Cronograma de Carga',
    energyAndGrid: 'Energía y Red',
    simulation: 'Simulación',
    analytics: 'Analítica',
    settings: 'Configuración',
    runOptimization: 'Ejecutar Optimización',
    addVehicle: 'Añadir Vehículo',
    addCharger: 'Añadir Cargador',
    simulateScenario: 'Simular Escenario',
    peakDemand: 'Demanda Máxima',
    projectedEnergyCost: 'Costo Energético Proyectado',
    vehiclesReady: 'Vehículos Listos',
    chargersActive: 'Cargadores Activos',
    gridCapacity: 'Capacidad de Red',
    currentDemand: 'Demanda Actual',
    availableHeadroom: 'Margen Disponible',
    utilization: 'Utilización de Red',
    optimizationImpact: 'Impacto de Optimización',
    uncontrolledDemand: 'Demanda Sin Control',
    optimizedDemand: 'Demanda Optimizada',
    howItWorks: 'Cómo funciona GridCharge',
    howItWorksDesc:
      'La carga se escalona automáticamente según la hora de salida del vehículo, el estado de la batería, la prioridad de ruta, la capacidad de la red y el precio de la electricidad.',
    operationalAlerts: 'Alertas Operativas',
    fleetDispatch: 'Despacho de Flota y Telemetría',
    whyThisSchedule: '¿Por qué este cronograma?',
    searchPlaceholder: 'Buscar ID de vehículo, ruta, cargador...',
    saveChanges: 'Guardar Cambios',
    cancel: 'Cancelar',
    applySchedule: 'Aplicar Cronograma de Carga',
    optimizationComplete: 'Optimización Completada',
  },
  fr: {
    appName: 'GridCharge',
    appSubtitle: 'Électrification de Dépôt v2.4',
    facilityName: 'Centre Principal de Distribution',
    systemOnline: 'Système En Ligne',
    dashboard: 'Tableau de Bord',
    fleet: 'Gestion de Flotte',
    chargingInfrastructure: 'Infrastructure de Recharge',
    chargingSchedule: 'Planning de Recharge',
    energyAndGrid: 'Énergie & Réseau',
    simulation: 'Simulation',
    analytics: 'Analytique',
    settings: 'Paramètres',
    runOptimization: 'Lancer l’Optimisation',
    addVehicle: 'Ajouter un Véhicule',
    addCharger: 'Ajouter un Chargeur',
    simulateScenario: 'Simuler un Scénario',
    peakDemand: 'Puissance de Pointe',
    projectedEnergyCost: 'Coût Énergétique Estimé',
    vehiclesReady: 'Véhicules Prêts',
    chargersActive: 'Chargeurs Actifs',
    gridCapacity: 'Capacité Réseau',
    currentDemand: 'Demande Actuelle',
    availableHeadroom: 'Marge Disponible',
    utilization: 'Utilisation Réseau',
    optimizationImpact: 'Impact d’Optimisation',
    uncontrolledDemand: 'Demande Non Contrôlée',
    optimizedDemand: 'Demande Optimisée',
    howItWorks: 'Fonctionnement de GridCharge',
    howItWorksDesc:
      'La recharge est automatiquement échelonnée en fonction de l’heure de départ, de l’état de la batterie, de la priorité de livraison, de la capacité réseau et du tarif électrique.',
    operationalAlerts: 'Alertes Opérationnelles',
    fleetDispatch: 'Dispatch & Télémétrie',
    whyThisSchedule: 'Pourquoi ce planning ?',
    searchPlaceholder: 'Rechercher véhicule, itinéraire, chargeur...',
    saveChanges: 'Enregistrer les Modifications',
    cancel: 'Annuler',
    applySchedule: 'Appliquer le Planning',
    optimizationComplete: 'Optimisation Terminée',
  },
};
