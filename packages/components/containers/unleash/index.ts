import { useFlag as useUnleashFlag } from '@unleash/proxy-client-react';

import type { FeatureFlag } from '@proton/components/containers';

export * from './UnleashContext';
export { default as UnleashFlagProvider } from './UnleashFlagProvider';
export { default as useFlagsReady } from './useFlagsReady';

const useFlag: (name: FeatureFlag) => boolean = useUnleashFlag;

export { useFlag };
