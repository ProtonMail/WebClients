import type { PaperTrailReport } from './reportTypes';

/** Outcome of parsing a completed assistant message. */
export type PaperTrailAnalysisResult =
    { kind: 'report'; report: PaperTrailReport } | { kind: 'insufficient_data' } | { kind: 'unparseable' };
