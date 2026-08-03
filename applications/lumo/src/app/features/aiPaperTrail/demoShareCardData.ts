import type { PaperTrailCardData } from './reportTypes';
import { privacyTypeLabel } from './reportTypes';

/** Decorative preview data for the landing-page share card (no personal information). */
export const DEMO_SHARE_CARD_DATA: PaperTrailCardData = {
    exposureScore: 62,
    grade: privacyTypeLabel(62),
    estimatedValueUsd: 2800,
    areas: [
        { area: 'Interests', exposureScore: 75 },
        { area: 'Location', exposureScore: 80 },
        { area: 'Relationships', exposureScore: 55 },
        { area: 'Work', exposureScore: 70 },
        { area: 'Education', exposureScore: 45 },
        { area: 'Health', exposureScore: 50 },
        { area: 'Finances', exposureScore: 60 },
        { area: 'Politics', exposureScore: 65 },
    ],
};
