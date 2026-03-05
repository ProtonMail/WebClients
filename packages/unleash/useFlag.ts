import { useFlag as useUnleashFlag } from '@unleash/proxy-client-react';

import type { FeatureFlag } from './UnleashFeatureFlags';

export const useFlag: (name: FeatureFlag) => boolean = useUnleashFlag;
