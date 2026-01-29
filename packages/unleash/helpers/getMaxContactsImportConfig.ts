import { CommonFeatureFlag } from '../UnleashFeatureFlags';
import { getStandaloneUnleashClient } from '../standaloneClient';

const MAX_CONTACTS_PER_USER = 100000;

export const getMaxContactsImportConfig = (): number => {
    const client = getStandaloneUnleashClient();

    try {
        if (client?.isEnabled(CommonFeatureFlag.MaxContactsImport)) {
            const variant = client.getVariant(CommonFeatureFlag.MaxContactsImport);
            if (variant.payload?.value) {
                const config = JSON.parse(variant.payload.value);
                return config.maxContactsImport;
            }
        }
    } catch (error) {}

    return MAX_CONTACTS_PER_USER;
};
