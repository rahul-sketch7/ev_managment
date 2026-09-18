import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { ExtractedVehicleSchedule, ExtractionResult, ScenarioDocument } from '../types/scenario';
import { PriorityLevel } from '../types';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
const clean = (value: string) => value.replace(/\s+/g, ' ').trim();
const number = (value: string | undefined) => { const match = value?.replace(',', '.').match(/-?\d+(?:\.\d+)?/); return match ? Number(match[0]) : null; };
const time = (value: string | undefined) => {
  if (!value) return null; const match = clean(value).match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i); if (!match) return null;
  let hour = Number(match[1]); let minutes = Number(match[2]); if (match[3]) { if (match[3].toUpperCase() === 'PM' && hour !== 12) hour += 12; if (match[3].toUpperCase() === 'AM' && hour === 12) hour = 0; }
  hour += Math.floor(minutes / 60); minutes %= 60;
  return hour < 24 ? `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}` : null;
};
const priority = (value: string | undefined): PriorityLevel | null => { const normalized = value?.trim().toUpperCase(); return normalized === 'CRITICAL' || normalized === 'HIGH' ? normalized : normalized === 'NORMAL' || normalized === 'MEDIUM' || normalized === 'LOW' ? 'NORMAL' : null; };
const vehicleId = (value: string | undefined) => { const match = value?.toUpperCase().match(/(?:EV[-\s]?)?(\d{3,})/); return match ? `EV-${match[1]}` : null; };
const normalizePdfText = (value: string) => value
  .replace(/E\s+V\s*-\s*((?:\d\s*){3,})/gi, (_, digits: string) => `EV-${digits.replace(/\s+/g, '')}`)
  .replace(/E\s+V\s*((?:\d\s*){3,})/gi, (_, digits: string) => `EV-${digits.replace(/\s+/g, '')}`)
  .replace(/\s*\|\s*/g, ' | ')
  .replace(/[ \t]+/g, ' ')
  .trim();

const parseRow = (line: string, page: number, row: number): ExtractedVehicleSchedule | null => {
  if (!/\bEV-\d{3,}\b/i.test(line)) return null;
  const tokens = line.includes('|') ? line.split(/\s*\|\s*/).map(clean) : line.split(/\s+/).map(clean);
  const priorityIndex = tokens.findIndex((token) => /^(?:CRITICAL|HIGH|NORMAL|MEDIUM|LOW)$/i.test(token));
  if (priorityIndex < 2) return null;
  const routeNames = ['North Loop', 'South Loop', 'Airport', 'Downtown', 'Industrial'];
  const routeIndex = routeNames.reduce((found, routeName) => {
    const routeTokens = routeName.split(' ');
    const candidate = tokens.slice(1, priorityIndex).join(' ');
    return candidate.endsWith(routeName) ? priorityIndex - routeTokens.length : found;
  }, -1);
  if (routeIndex < 2) return null;
  const scheduleValues = tokens.slice(priorityIndex + 1).filter((token) => !/^(?:kwh|kw|%)$/i.test(token));
  const columns = [
    tokens[0],
    tokens.slice(1, routeIndex).join(' '),
    tokens.slice(routeIndex, priorityIndex).join(' '),
    tokens[priorityIndex],
    ...scheduleValues,
  ];
  const values = columns.slice(0, 11);
  const record: ExtractedVehicleSchedule = { vehicleId: vehicleId(values[0] || line), model: values[1] || null, route: values[2] || null, priority: priority(values[3]), arrivalTime: time(values[4]), departureTime: time(values[5]), currentSOC: number(values[6]), targetSOC: number(values[7]), batteryCapacityKwh: number(values[8]), requiredEnergyKwh: number(values[9]), maxPowerKw: number(values[10]), sourcePage: page, sourceRow: row, originalExtractedText: line, confidence: 'WARNING' };
  const missing = [record.vehicleId, record.arrivalTime, record.departureTime].some((value) => value === null);
  record.confidence = missing || values.length < 11 ? 'ERROR' : 'VALID';
  return record;
};

export const extractVehicleSchedule = async (file: File): Promise<ExtractionResult> => {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) throw new Error('Please select a PDF file.');
  const document: ScenarioDocument = { name: file.name, uploadedAt: new Date().toISOString(), mimeType: file.type || 'application/pdf' };
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const extractedRows: ExtractedVehicleSchedule[] = []; const extractionWarnings: string[] = [];
  console.log(`[PDF extraction] number of PDF pages: ${pdf.numPages}`);
  for (let page = 1; page <= pdf.numPages; page += 1) {
    const content = await (await pdf.getPage(page)).getTextContent();
    const text = normalizePdfText(content.items.map((item: any) => item.str || '').join(' '));
    console.log(`[PDF extraction] page ${page}/${pdf.numPages}: ${text.length} characters`);
    if (page === 1) console.log('[PDF extraction] first 2000 characters:', text.slice(0, 2000));

    // PDF.js may return each cell or line fragment as a separate text item. Segment
    // on vehicle IDs first, then parse the known pipe-delimited 11-field schema.
    const starts = [...text.matchAll(/\bEV-\d{3,}\b/gi)].map((match) => match.index ?? 0);
    const rows = starts.map((start, index) => clean(text.slice(start, starts[index + 1])));
    console.log(`[PDF extraction] page ${page}: detected schedule rows: ${rows.length}`);
    if (rows[0]) console.log('[PDF extraction] first detected row:', rows[0]);
    rows.forEach((line, index) => { const record = parseRow(line, page, index + 1); if (record) extractedRows.push(record); });
  }
  console.log(`[PDF extraction] total detected schedule rows: ${extractedRows.length}`);
  console.log(`[PDF extraction] total normalized vehicles: ${extractedRows.length}`);
  if (!extractedRows.length) extractionWarnings.push('No vehicle schedule rows were detected in this PDF.');
  return { sourceDocument: document, extractedRows, extractionWarnings, extractionStatus: extractedRows.length ? 'EXTRACTED' : 'ERROR' };
};
