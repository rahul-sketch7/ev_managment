import React from 'react';
import { useGridCharge } from '../context/GridChargeContext';
import { PdfScheduleImport } from './PdfScheduleImport';
import { ExtractionReview } from './ExtractionReview';

export const PdfScheduleWorkflow: React.FC = () => {
  const { extractionResult, setExtractionResult, approveExtractedSchedule, setCurrentView } = useGridCharge();
  return <div className="space-y-4"><div className="flex justify-between items-start"><div><h1 className="text-[20px] font-bold text-[#00163d]">Import Vehicle Schedule</h1><p className="text-[12px] text-[#44464f]">Extract, validate, review, and approve a PDF schedule before it becomes active.</p></div><button onClick={() => setCurrentView('dashboard')} className="px-3 py-2 border border-[#c4c6d0] rounded text-[12px]">Back to Dashboard</button></div><PdfScheduleImport onExtracted={setExtractionResult}/>{extractionResult && <ExtractionReview rows={extractionResult.extractedRows} onApprove={(rows) => { approveExtractedSchedule(rows); setCurrentView('fleet'); }}/>}</div>;
};
