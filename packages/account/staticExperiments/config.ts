import type { FeatureFlag } from '@proton/unleash/Flags';

import type { StaticExperimentConfig } from './types';

export const staticExperimentsConfig = {
    /**
     * Which challenge frame the login form loads. Keep disabled until the API serves
     * `/challenge/v5/html`. When enabled, users assigned `v5` use the new frame;
     * everyone else uses v4.
     */
    ChallengeV5: {
        enabled: true,
        owner: 'anti-abuse',
        schedule: [
            {
                startsAt: '2026-01-01T00:00:00.000Z',
                weights: { v4: 90, v5: 10 },
            },
        ],
    },
} satisfies Record<string, StaticExperimentConfig> & Partial<Record<FeatureFlag, never>>;
