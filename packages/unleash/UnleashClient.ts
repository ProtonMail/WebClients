import { UnleashClient as OriginalUnleashClient } from '@unleash/proxy-client-react';

import type { FeatureFlag } from './UnleashFeatureFlags';

export class UnleashClient extends OriginalUnleashClient {
    isEnabled = (flag: FeatureFlag) => {
        return super.isEnabled(flag);
    };
}
