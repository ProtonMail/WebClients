import type {
    PaperTrailComplianceRisk,
    PaperTrailExposure,
    PaperTrailFact,
    PaperTrailFinding,
    PaperTrailReport,
    PaperTrailRiskLevel,
    PaperTrailSection,
} from './reportTypes';

const toStr = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const toNumber = (value: unknown): number => {
    const n = typeof value === 'string' ? Number(value.replace(/[^0-9.]/g, '')) : Number(value);
    return Number.isFinite(n) ? Math.round(n) : 0;
};

const toStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.map(toStr).filter(Boolean) : [];

/**
 * Extract a JSON object from a (possibly noisy) model response. Handles raw JSON,
 * ```json code fences, and leading/trailing prose by slicing to the outermost braces.
 */
const extractJsonObject = (content: string): unknown => {
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1] : content;
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
        throw new Error('No JSON object found');
    }
    return JSON.parse(candidate.slice(start, end + 1));
};

const parseFindings = (value: unknown): PaperTrailFinding[] => {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((item) => {
            const record = (item ?? {}) as Record<string, unknown>;
            return { label: toStr(record.label), detail: toStr(record.detail) };
        })
        .filter((finding) => finding.label || finding.detail);
};

const parseExposure = (value: unknown): PaperTrailExposure[] => {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((item) => {
            const record = (item ?? {}) as Record<string, unknown>;
            return {
                area: toStr(record.area),
                score: Math.max(0, Math.min(100, toNumber(record.score))),
                detail: toStr(record.detail) || undefined,
            };
        })
        .filter((exposure) => exposure.area);
};

const toRiskLevel = (value: unknown): PaperTrailRiskLevel => {
    const level = toStr(value).toLowerCase();
    if (level === 'high' || level === 'medium' || level === 'low') {
        return level;
    }
    return 'medium';
};

const parseComplianceRisks = (value: unknown): PaperTrailComplianceRisk[] => {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((item) => {
            const record = (item ?? {}) as Record<string, unknown>;
            return {
                category: toStr(record.category),
                severity: toRiskLevel(record.severity),
                detail: toStr(record.detail),
                guidance: toStr(record.guidance),
            };
        })
        .filter((risk) => risk.category && risk.detail);
};

const parseFacts = (value: unknown): PaperTrailFact[] => {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((item) => {
            const record = (item ?? {}) as Record<string, unknown>;
            return { label: toStr(record.label), value: toStr(record.value) };
        })
        .filter((fact) => fact.label && fact.value);
};

const parseSections = (value: unknown): PaperTrailSection[] => {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((item) => {
            const record = (item ?? {}) as Record<string, unknown>;
            return {
                title: toStr(record.title),
                emoji: toStr(record.emoji) || undefined,
                findings: parseFindings(record.findings),
            };
        })
        .filter((section) => section.title && section.findings.length > 0);
};

/**
 * Parse and validate a completed assistant message into a PaperTrailReport.
 * Returns undefined while streaming or when the content isn't a valid report.
 */
export const parsePaperTrailReport = (content: string | undefined): PaperTrailReport | undefined => {
    if (!content) {
        return undefined;
    }

    let raw: Record<string, unknown>;
    try {
        raw = extractJsonObject(content) as Record<string, unknown>;
    } catch {
        return undefined;
    }

    const label = toStr(raw.label);
    const sections = parseSections(raw.sections);
    if (!label || sections.length === 0) {
        return undefined;
    }

    return {
        name: toStr(raw.name),
        label,
        quickFacts: parseFacts(raw.quickFacts),
        summary: toStr(raw.summary),
        dataPointCount: toNumber(raw.dataPointCount),
        estimatedValueUsd: toNumber(raw.estimatedValueUsd),
        valueRationale: toStr(raw.valueRationale),
        sections,
        revealingDataPoints: toStringArray(raw.revealingDataPoints),
        sensitiveCategories: toStringArray(raw.sensitiveCategories),
        dataExposure: parseExposure(raw.dataExposure),
        complianceRisks: parseComplianceRisks(raw.complianceRisks),
    };
};
