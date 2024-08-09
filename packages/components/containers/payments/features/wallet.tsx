import { c, msgid } from 'ttag';

import { PLANS, WALLET_APP_NAME } from '@proton/shared/lib/constants';

import type { PlanCardFeature, PlanCardFeatureDefinition } from './interface';

export const FREE_WALLETS = 2;
export const FREE_WALLET_ACCOUNTS = 2;
export const FREE_WALLET_EMAIL = 1;

export const WALLET_PLUS_WALLETS = 10;
export const WALLET_PLUS_WALLET_ACCOUNTS = 10;
export const WALLET_PLUS_WALLET_EMAIL = 10;

export const UNLIMITED_WALLETS = 10;
export const UNLIMITED_WALLET_ACCOUNTS = 10;
export const UNLIMITED_WALLET_EMAIL = 15;

export const VISIONARY_WALLETS = 50;
export const VISIONARY_WALLET_ACCOUNTS = 50;
export const VISIONARY_WALLET_EMAIL = 90;

export const getWalletsText = (n: number) => {
    return c('wallet_signup_2024: Info').ngettext(msgid`${n} wallet`, `${n} wallets`, n);
};

export const getWallets = (n: Parameters<typeof getWalletAccountsText>['0']): PlanCardFeatureDefinition => {
    return {
        text: getWalletsText(n),
        included: true,
    };
};

export const getWalletAccountsText = (n: number) => {
    return c('wallet_signup_2024: Info').ngettext(msgid`${n} account per wallet`, `${n} accounts per wallet`, n);
};

export const getWalletAccounts = (n: Parameters<typeof getWalletsText>['0']): PlanCardFeatureDefinition => {
    return {
        text: getWalletAccountsText(n),
        included: true,
    };
};

export const getWalletEmailAddressesText = (n: number) => {
    return c('wallet_signup_2024: Info').ngettext(msgid`${n} email address`, `${n} email addresses`, n);
};

export const getWalletEmailAddresses = (
    n: Parameters<typeof getWalletEmailAddressesText>['0']
): PlanCardFeatureDefinition => {
    return {
        text: getWalletEmailAddressesText(n),
        included: true,
    };
};

export const getBitcoinViaEmailText = () => {
    return c('wallet_signup_2024: Info').t`Bitcoin via email`;
};

export const getBitcoinViaEmail = (): PlanCardFeatureDefinition => {
    return {
        text: getBitcoinViaEmailText(),
        included: true,
    };
};

export const getWalletAppFeature = (): PlanCardFeatureDefinition => {
    return {
        text: WALLET_APP_NAME,
        tooltip: c('wallet_signup_2024:app-switcher').t`Securely hold and transfer your bitcoins`,
        included: true,
        icon: 'wallet',
    };
};

export const getWalletFeatures = (): PlanCardFeature[] => {
    return [
        {
            name: 'wallets',
            plans: {
                [PLANS.FREE]: getWallets(FREE_WALLETS),
                [PLANS.WALLET]: getWallets(WALLET_PLUS_WALLETS),
                [PLANS.BUNDLE]: getWallets(UNLIMITED_WALLETS),
                [PLANS.MAIL]: getWallets(FREE_WALLETS),
                [PLANS.VPN]: getWallets(FREE_WALLETS),
                [PLANS.DRIVE]: getWallets(FREE_WALLETS),
                [PLANS.DRIVE_BUSINESS]: getWallets(FREE_WALLETS),
                [PLANS.PASS]: getWallets(FREE_WALLETS),
                [PLANS.FAMILY]: getWallets(UNLIMITED_WALLETS),
                [PLANS.DUO]: getWallets(UNLIMITED_WALLETS), // TODO validate with product
                [PLANS.MAIL_PRO]: null,
                [PLANS.MAIL_BUSINESS]: null,
                [PLANS.BUNDLE_PRO]: null,
                [PLANS.BUNDLE_PRO_2024]: null,
                [PLANS.PASS_PRO]: null,
                [PLANS.PASS_BUSINESS]: null,
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'wallet-accounts',
            plans: {
                [PLANS.FREE]: getWalletAccounts(FREE_WALLET_ACCOUNTS),
                [PLANS.WALLET]: getWalletAccounts(WALLET_PLUS_WALLET_ACCOUNTS),
                [PLANS.BUNDLE]: getWalletAccounts(UNLIMITED_WALLET_ACCOUNTS),
                [PLANS.MAIL]: getWalletAccounts(FREE_WALLET_ACCOUNTS),
                [PLANS.VPN]: getWalletAccounts(FREE_WALLET_ACCOUNTS),
                [PLANS.DRIVE]: getWalletAccounts(FREE_WALLET_ACCOUNTS),
                [PLANS.DRIVE_BUSINESS]: getWalletAccounts(FREE_WALLET_ACCOUNTS),
                [PLANS.PASS]: getWalletAccounts(FREE_WALLET_ACCOUNTS),
                [PLANS.FAMILY]: getWalletAccounts(UNLIMITED_WALLET_ACCOUNTS),
                [PLANS.DUO]: getWallets(UNLIMITED_WALLET_ACCOUNTS), // TODO validate with product
                [PLANS.MAIL_PRO]: null,
                [PLANS.MAIL_BUSINESS]: null,
                [PLANS.BUNDLE_PRO]: null,
                [PLANS.BUNDLE_PRO_2024]: null,
                [PLANS.PASS_PRO]: null,
                [PLANS.PASS_BUSINESS]: null,
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'wallet-email-addresses',
            plans: {
                [PLANS.FREE]: getWalletEmailAddresses(FREE_WALLET_EMAIL),
                [PLANS.WALLET]: getWalletEmailAddresses(WALLET_PLUS_WALLET_EMAIL),
                [PLANS.BUNDLE]: getWalletEmailAddresses(UNLIMITED_WALLET_EMAIL),
                [PLANS.MAIL]: getWalletEmailAddresses(FREE_WALLET_EMAIL),
                [PLANS.VPN]: getWalletEmailAddresses(FREE_WALLET_EMAIL),
                [PLANS.DRIVE]: getWalletEmailAddresses(FREE_WALLET_EMAIL),
                [PLANS.DRIVE_BUSINESS]: getWalletEmailAddresses(FREE_WALLET_EMAIL),
                [PLANS.PASS]: getWalletEmailAddresses(FREE_WALLET_EMAIL),
                [PLANS.FAMILY]: getWalletEmailAddresses(UNLIMITED_WALLET_EMAIL),
                [PLANS.DUO]: getWallets(UNLIMITED_WALLET_EMAIL), // TODO validate with product
                [PLANS.MAIL_PRO]: null,
                [PLANS.MAIL_BUSINESS]: null,
                [PLANS.BUNDLE_PRO]: null,
                [PLANS.BUNDLE_PRO_2024]: null,
                [PLANS.PASS_PRO]: null,
                [PLANS.PASS_BUSINESS]: null,
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'wallet-bitcoin-via-email',
            plans: {
                [PLANS.FREE]: getBitcoinViaEmail(),
                [PLANS.WALLET]: getBitcoinViaEmail(),
                [PLANS.BUNDLE]: getBitcoinViaEmail(),
                [PLANS.MAIL]: getBitcoinViaEmail(),
                [PLANS.VPN]: getBitcoinViaEmail(),
                [PLANS.DRIVE]: getBitcoinViaEmail(),
                [PLANS.DRIVE_BUSINESS]: getBitcoinViaEmail(),
                [PLANS.PASS]: getBitcoinViaEmail(),
                [PLANS.FAMILY]: getBitcoinViaEmail(),
                [PLANS.DUO]: getBitcoinViaEmail(), // TODO validate with product
                [PLANS.MAIL_PRO]: null,
                [PLANS.MAIL_BUSINESS]: null,
                [PLANS.BUNDLE_PRO]: null,
                [PLANS.BUNDLE_PRO_2024]: null,
                [PLANS.PASS_PRO]: null,
                [PLANS.PASS_BUSINESS]: null,
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
    ];
};
