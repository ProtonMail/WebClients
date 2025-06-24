import { c } from 'ttag';

import type { Feature } from '@proton/components/containers/offers/interface';

const getUnlimitedOfferStorage = () => {
    return { name: c('Offer feature').t`500 GB secure storage` };
};

const getUnlimitedAliases = () => {
    return { name: c('Offer feature').t`Unlimited aliases to protect your identity` };
};

const getVpn = () => {
    return { name: c('Offer feature').t`Ultrafast VPN servers in 110+ countries` };
};

const getPasswordManager = () => {
    return { name: c('Offer fearue').t`Encrypted password manager` };
};

const getThreatProtection = () => {
    return { name: c('Offer feature').t`Advanced threat protection` };
};

const unlimitedOfferStorage: Feature = getUnlimitedOfferStorage();

const unlimitedAliases: Feature = getUnlimitedAliases();

const vpn: Feature = getVpn();

const passwordManager: Feature = getPasswordManager();

const threatProtection: Feature = getThreatProtection();

export const featureListGeneric = [unlimitedOfferStorage, unlimitedAliases, vpn, passwordManager, threatProtection];

export const featureListInboxThreatProtection = [unlimitedOfferStorage, unlimitedAliases, vpn, passwordManager];

export const featureListInboxUnlimitedAliases = [unlimitedOfferStorage, vpn, passwordManager, threatProtection];

export const featureListDrive = [unlimitedAliases, vpn, passwordManager, threatProtection];

export const featureListVPNBrowseSecurely = [
    unlimitedOfferStorage,
    unlimitedAliases,
    passwordManager,
    threatProtection,
];

export const featureListVPNUnblockStreaming = [
    unlimitedOfferStorage,
    unlimitedAliases,
    vpn,
    passwordManager,
    threatProtection,
];

export const featureListPass = [unlimitedOfferStorage, unlimitedAliases, vpn, threatProtection];
