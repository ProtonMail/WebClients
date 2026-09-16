import type { FeatureFlag } from '@proton/unleash/Flags';

import type { StaticExperimentConfig } from './types';

export const staticExperimentsConfig = {
    AATest: {
        enabled: true,
        owner: 'account-web',
        schedule: [
            {
                startsAt: '2026-08-01T00:00:00.000Z',
                weights: { A: 50, B: 50 },
            },
        ],
    },
    /**
     * Which challenge frame the login form loads. Keep disabled until the API serves
     * `/challenge/v5/html`. When enabled, users assigned `v5` use the new frame;
     * everyone else uses v4.
     */
    ChallengeV5: {
        enabled: false,
        owner: 'anti-abuse',
        schedule: [
            {
                startsAt: '2026-01-01T00:00:00.000Z',
                weights: { v5: 0 },
            },
        ],
    },
} satisfies Record<string, StaticExperimentConfig> & Partial<Record<FeatureFlag, never>>;
