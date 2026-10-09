import type { FeatureFlag } from '@proton/unleash/Flags';

import type { StaticExperimentConfig } from './types';

export const staticExperimentsConfig = {
    /**
     * Retired: ChallengeV5 is now the default login challenge.
     * Kept disabled only so the resolver clears the stale `ChallengeV5` entry from the shared `Features` cookie.
     * Remove after 2026-12-08.
     */
    ChallengeV5: {
        enabled: false,
        owner: 'anti-abuse',
        schedule: [
            {
                startsAt: '2026-01-01T00:00:00.000Z',
                weights: { v4: 0, v5: 100 },
            },
        ],
    },
} satisfies Record<string, StaticExperimentConfig> & Partial<Record<FeatureFlag, never>>;
