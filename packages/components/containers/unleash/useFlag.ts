import { useFlag as useUnleashFlag } from '@unleash/proxy-client-react';

import { FeatureFlag } from './UnleashContext';

const useFlag: (name: FeatureFlag) => boolean = useUnleashFlag;

export default useFlag;
