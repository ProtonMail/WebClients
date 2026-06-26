import { parsePaperTrailReport } from './parsePaperTrailReport';
import { deriveCardData } from './reportTypes';

const validReport = {
    name: 'Alex',
    label: 'Anxious professional, 30s, financially stretched',
    quickFacts: [
        { label: 'Age', value: 'early 30s' },
        { label: 'Education', value: "Master's degree" },
        { label: 'Missing', value: '' },
    ],
    summary: 'You overshare about money and work.',
    dataPointCount: 142,
    estimatedValueUsd: '$480',
    valueRationale: 'High-intent finance signals.',
    sections: [
        {
            title: 'Money',
            emoji: '💸',
            findings: [
                { label: 'Income', detail: 'Mentions earning around 30k.' },
                { label: 'Debt', detail: 'Asks about paying off loans.' },
            ],
        },
        { title: 'Empty', findings: [] },
    ],
    revealingDataPoints: ['Salary band', 'Debt level'],
    sensitiveCategories: ['salary', 'debt'],
    dataExposure: [
        { area: 'Finances', score: 90 },
        { area: 'Work', score: 60 },
        { area: 'Location', score: 0 },
    ],
    complianceRisks: [
        {
            category: 'Colleague PII',
            severity: 'high',
            detail: 'You pasted a colleague’s full name alongside performance feedback.',
            guidance: 'Strip names and use roles instead when asking for help.',
        },
        { category: 'Empty', severity: 'banana', detail: '' },
    ],
};

describe('parsePaperTrailReport', () => {
    it('parses a raw JSON object', () => {
        const report = parsePaperTrailReport(JSON.stringify(validReport));
        expect(report?.label).toBe(validReport.label);
        expect(report?.name).toBe('Alex');
        expect(report?.dataPointCount).toBe(142);
        expect(report?.estimatedValueUsd).toBe(480);
        // Sections with no findings are dropped.
        expect(report?.sections).toHaveLength(1);
        expect(report?.sections[0].findings).toHaveLength(2);
        // Facts missing a value are dropped.
        expect(report?.quickFacts).toEqual([
            { label: 'Age', value: 'early 30s' },
            { label: 'Education', value: "Master's degree" },
        ]);
        // Compliance risks parse; incomplete entries and bad severities are handled.
        expect(report?.complianceRisks).toEqual([
            {
                category: 'Colleague PII',
                severity: 'high',
                detail: 'You pasted a colleague’s full name alongside performance feedback.',
                guidance: 'Strip names and use roles instead when asking for help.',
            },
        ]);
    });

    it('parses JSON wrapped in code fences and prose', () => {
        const wrapped = `Here you go:\n\`\`\`json\n${JSON.stringify(validReport)}\n\`\`\`\nHope that helps!`;
        expect(parsePaperTrailReport(wrapped)?.label).toBe(validReport.label);
    });

    it('returns undefined for streaming / invalid content', () => {
        expect(parsePaperTrailReport('{ "label": "x"')).toBeUndefined();
        expect(parsePaperTrailReport(undefined)).toBeUndefined();
        expect(parsePaperTrailReport('not json at all')).toBeUndefined();
    });

    it('returns undefined when required fields are missing', () => {
        expect(parsePaperTrailReport(JSON.stringify({ summary: 'no label or sections' }))).toBeUndefined();
    });

    it('derives a share-safe exposure scorecard from the report', () => {
        const report = parsePaperTrailReport(JSON.stringify(validReport))!;
        const card = deriveCardData(report);
        // Exposure is surfaced directly (higher = more exposed = worse).
        expect(card.areas).toEqual([
            { area: 'Finances', exposureScore: 90 },
            { area: 'Work', exposureScore: 60 },
            { area: 'Location', exposureScore: 0 },
        ]);
        // Overall is the average of the per-area exposure scores: (90 + 60 + 0) / 3 = 50.
        expect(card.exposureScore).toBe(50);
        expect(card.grade).toBe('Exposed');
        // The advertiser value (not personal data) is carried onto the card.
        expect(card.estimatedValueUsd).toBe(480);
        // No personal information should leak into the card payload.
        expect(card).not.toHaveProperty('archetype');
        expect(card).not.toHaveProperty('summary');
        // Compliance risks are educational only and must never reach the shareable card.
        expect(card).not.toHaveProperty('complianceRisks');
    });
});
