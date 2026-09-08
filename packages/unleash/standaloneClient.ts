import { setMaxContactsImportConfig } from '@proton/shared/lib/contacts/maxContactsImportConfig';
import type { SharedUnleashClient } from '@proton/shared/lib/unleash/sharedUnleashClient';
import { setSharedUnleashClient } from '@proton/shared/lib/unleash/sharedUnleashClient';

import type { UnleashClient } from './UnleashClient';
import type { FeatureFlag } from './UnleashFeatureFlags';
import './flagAlignment';
import { resolveMaxContactsImportConfig } from './helpers/resolveMaxContactsImportConfig';

let unleashClient: UnleashClient | undefined;

const toSharedUnleashClient = (client: UnleashClient): SharedUnleashClient => ({
    isEnabled: (flag) => client.isEnabled(flag as FeatureFlag),
    getVariant: (flag) => client.getVariant(flag as FeatureFlag),
    on: (event, handler) => client.on(event, handler),
    off: (event, handler) => client.off(event, handler),
});

export const setStandaloneUnleashClient = (client: UnleashClient) => {
    if (unleashClient) {
        return;
    }

    unleashClient = client;
    setSharedUnleashClient(toSharedUnleashClient(client));
    setMaxContactsImportConfig(() => resolveMaxContactsImportConfig(unleashClient));
};

export const getStandaloneUnleashClient = () => {
    return unleashClient;
};
