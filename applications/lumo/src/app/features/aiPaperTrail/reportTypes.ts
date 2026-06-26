/** A single inferred fact within a category. */
export interface PaperTrailFinding {
    /** Short tag, e.g. "Income" or "Location". */
    label: string;
    /** The concrete inference, grounded in the user's prompts. */
    detail: string;
}

/** A category of things the AI can infer about the user. */
export interface PaperTrailSection {
    /** Category title, e.g. "Money", "Health", "Work". */
    title: string;
    /** Optional emoji shown on the card header. */
    emoji?: string;
    findings: PaperTrailFinding[];
}

/** How much of a given life area was exposed (0 = nothing, 100 = fully exposed). */
export interface PaperTrailExposure {
    area: string;
    score: number;
    /** Short explanation of what specifically was exposed in this area. */
    detail?: string;
}

/** A single at-a-glance demographic fact shown at the top of the profile. */
export interface PaperTrailFact {
    label: string;
    value: string;
}

/** Severity of a compliance / oversharing blind spot. */
export type PaperTrailRiskLevel = 'low' | 'medium' | 'high';

/**
 * An educational flag for content that may have crossed an information-sharing line —
 * e.g. PII, confidential company data, secrets, or regulated information pasted into a
 * third-party AI. Framed to help the user, never to expose or punish them.
 */
export interface PaperTrailComplianceRisk {
    /** Category, e.g. "Personal data (PII)", "Company confidential", "Regulated data". */
    category: string;
    /** How serious the exposure is. */
    severity: PaperTrailRiskLevel;
    /** What was shared, described generically without restating the secret itself. */
    detail: string;
    /** A constructive suggestion for handling this safely next time. */
    guidance: string;
}

/** The full structured report returned by the model and rendered by our custom renderer. */
export interface PaperTrailReport {
    /** The person's likely name (may be empty when there is no signal). */
    name: string;
    /** Short identity headline / archetype. */
    label: string;
    /** At-a-glance demographic facts (age, education, politics, location, …). */
    quickFacts: PaperTrailFact[];
    /** One or two sentence overview. */
    summary: string;
    /** Number of distinct data points extracted. */
    dataPointCount: number;
    /** Rough value of the profile to a Big Tech advertiser, in USD. */
    estimatedValueUsd: number;
    /** One line explaining the value estimate. */
    valueRationale: string;
    /** Categories of what the AI knows. */
    sections: PaperTrailSection[];
    /** The most striking individual data points (scorecard highlights). */
    revealingDataPoints: string[];
    /** Named (not detailed) sensitive categories present, for the warning. */
    sensitiveCategories: string[];
    /** Per-area exposure scores. */
    dataExposure: PaperTrailExposure[];
    /** Educational flags where the user may have overshared PII, secrets, or regulated data. */
    complianceRisks: PaperTrailComplianceRisk[];
}

/** A per-area exposure score (0 = nothing revealed, 100 = fully exposed). */
export interface PaperTrailAreaScore {
    area: string;
    exposureScore: number;
}

/**
 * The share-safe card payload. Deliberately contains NO personal information — only
 * the exposure breakdown by life area.
 */
export interface PaperTrailCardData {
    /** Overall exposure score 0-100 (higher = more of your life is exposed). */
    exposureScore: number;
    /** A human label for the overall score. */
    grade: string;
    /** Per-area exposure scores. */
    areas: PaperTrailAreaScore[];
    /** Rough USD value of the profile to an advertiser (not personal data). */
    estimatedValueUsd: number;
}

/** Turn an archetype label into a social-style @handle. */
export const toHandle = (label: string): string => {
    const slug = label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .split('_')
        .filter(Boolean)
        .slice(0, 3)
        .join('_');
    return slug || 'anonymous';
};

const clampScore = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

/** A friendly label for an overall exposure score (higher = more exposed = worse). */
export const exposureGrade = (score: number): string => {
    if (score >= 80) {
        return 'Fully exposed';
    }
    if (score >= 60) {
        return 'Highly exposed';
    }
    if (score >= 40) {
        return 'Exposed';
    }
    if (score >= 20) {
        return 'Fairly private';
    }
    return 'Well protected';
};

/**
 * Derive the share-safe card payload from the full report. We surface exposure directly
 * (how much of each life area Big Tech could reconstruct) so that a bad result reads as
 * a full, alarming bar rather than an empty one.
 */
export const deriveCardData = (report: PaperTrailReport): PaperTrailCardData => {
    const areas: PaperTrailAreaScore[] = report.dataExposure.map((exposure) => ({
        area: exposure.area,
        exposureScore: clampScore(exposure.score),
    }));
    const exposureScore = areas.length
        ? clampScore(areas.reduce((sum, area) => sum + area.exposureScore, 0) / areas.length)
        : 0;
    return { exposureScore, grade: exposureGrade(exposureScore), areas, estimatedValueUsd: report.estimatedValueUsd };
};
