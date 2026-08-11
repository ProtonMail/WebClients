import type { FeatureFlag } from '@proton/unleash/Flags';

import type { StaticExperimentConfig } from './types';

export const staticExperimentsConfig = {} satisfies Record<string, StaticExperimentConfig> & Partial<Record<FeatureFlag, never>>;
