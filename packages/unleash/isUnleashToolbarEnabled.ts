import { isDevOrBlackHost } from '@proton/shared/lib/env';

export const isUnleashToolbarEnabled = () => typeof window !== 'undefined' && isDevOrBlackHost(window.location.host);
