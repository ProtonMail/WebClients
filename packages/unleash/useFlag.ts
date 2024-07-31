import { useFlag as useUnleashFlag } from '@unleash/proxy-client-react';

import type { FeatureFlag } from './UnleashFeatureFlags';

const useFlag: (name: FeatureFlag) => boolean = useUnleashFlag;

export default useFlag;
