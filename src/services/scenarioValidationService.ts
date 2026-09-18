import { ExtractedVehicleSchedule, ValidationIssue } from '../types/scenario';

export interface ScheduleValidationResult { errors: ValidationIssue[]; warnings: ValidationIssue[]; validRows: ExtractedVehicleSchedule[]; invalidRows: ExtractedVehicleSchedule[]; }
export const validateSchedule = (rows: ExtractedVehicleSchedule[]): ScheduleValidationResult => {
  const errors: ValidationIssue[] = []; const warnings: ValidationIssue[] = []; const ids = new Set<string>(); const invalid = new Set<number>();
  const error = (index: number, row: ExtractedVehicleSchedule, field: string, message: string) => { invalid.add(index); errors.push({ vehicleId: row.vehicleId || undefined, field, message }); };
  rows.forEach((row, index) => {
    if (index === 0) console.log('[Schedule validation] EV-1001 normalized object:', row);
    if (!row.vehicleId) error(index, row, 'vehicleId', 'Vehicle ID is required.'); else if (ids.has(row.vehicleId)) error(index, row, 'vehicleId', 'Duplicate vehicle ID.'); else ids.add(row.vehicleId);
    if (!row.arrivalTime) error(index, row, 'arrivalTime', 'Arrival time is required.'); if (!row.departureTime) error(index, row, 'departureTime', 'Departure time is required.');
    // A departure earlier than arrival is an overnight operating window.
    if (row.currentSOC === null || row.currentSOC < 0 || row.currentSOC > 100) error(index, row, 'currentSOC', 'Current SOC must be 0–100.');
    if (row.targetSOC === null || row.targetSOC < 0 || row.targetSOC > 100) error(index, row, 'targetSOC', 'Target SOC must be 0–100.');
    if (row.currentSOC !== null && row.targetSOC !== null && row.targetSOC < row.currentSOC) error(index, row, 'targetSOC', 'Target SOC cannot be below current SOC.');
    if (row.batteryCapacityKwh === null || row.batteryCapacityKwh <= 0) error(index, row, 'batteryCapacityKwh', 'Battery capacity must be positive.');
    if (row.requiredEnergyKwh === null || row.requiredEnergyKwh < 0) error(index, row, 'requiredEnergyKwh', 'Required energy cannot be negative.');
    if (row.maxPowerKw === null || row.maxPowerKw <= 0) error(index, row, 'maxPowerKw', 'Maximum charging power must be positive.');
    if (!row.priority) error(index, row, 'priority', 'Priority must be CRITICAL, HIGH, or NORMAL.');
    if (!row.model || !row.route) warnings.push({ vehicleId: row.vehicleId || undefined, field: !row.model ? 'model' : 'route', message: 'Missing descriptive field; operator review recommended.' });
  });
  console.log('[Schedule validation] result:', { rows: rows.length, valid: rows.length - invalid.size, errors: errors.length, warnings: warnings.length, errorsByField: errors.reduce<Record<string, number>>((counts, issue) => ({ ...counts, [issue.field]: (counts[issue.field] || 0) + 1 }), {}) });
  if (errors.length) console.log('[Schedule validation] exact errors:', errors);
  return { errors, warnings, validRows: rows.filter((_, index) => !invalid.has(index)), invalidRows: rows.filter((_, index) => invalid.has(index)) };
};
