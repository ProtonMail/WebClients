import { UnleashClient as OriginalUnleashClient } from '@unleash/proxy-client-react';

import type { FeatureFlag } from '@proton/unleash/index';

class UnleashClient extends OriginalUnleashClient {
    isEnabled = (flag: FeatureFlag) => {
        return super.isEnabled(flag);
    };
}

export default UnleashClient;
