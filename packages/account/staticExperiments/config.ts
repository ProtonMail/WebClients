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
} satisfies Record<string, StaticExperimentConfig> & Partial<Record<FeatureFlag, never>>;
