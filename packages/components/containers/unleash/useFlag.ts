import { useFlag as useUnleashFlag } from '@unleash/proxy-client-react';

import type { FeatureFlag } from './UnleashContext';

const useFlag: (name: FeatureFlag) => boolean = useUnleashFlag;

export default useFlag;
