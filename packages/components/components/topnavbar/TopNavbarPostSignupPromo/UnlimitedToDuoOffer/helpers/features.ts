import { c } from 'ttag';

import type { Feature } from '@proton/components/containers/offers/interface';

const getStorageFeature = () => {
    return { name: c('Duo offer').t`1 TB of storage to share` };
};

const getTwoUsersFeature = () => {
    return { name: c('Duo offer').t`2 user accounts` };
};

const getIncludeExistingBenefitsFeature = () => {
    return { name: c('Duo offer').t`All premium features from your current plan` };
};

export const featureListStorageUpgrade: Feature[] = [
    getStorageFeature(),
    getTwoUsersFeature(),
    getIncludeExistingBenefitsFeature(),
];

export const featureListAdditionalUser: Feature[] = [
    getTwoUsersFeature(),
    getStorageFeature(),
    getIncludeExistingBenefitsFeature(),
];
