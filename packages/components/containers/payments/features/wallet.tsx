import { c, msgid } from 'ttag';

import { PLANS } from '@proton/payments';
import { BRAND_NAME, MAIL_APP_NAME, WALLET_APP_NAME } from '@proton/shared/lib/constants';

import type { PlanCardFeature, PlanCardFeatureDefinition } from './interface';

export const FREE_WALLETS = 3;
export const FREE_WALLET_ACCOUNTS = 3;
export const FREE_WALLET_EMAIL = 1;

export const UNLIMITED_WALLETS = 10;
export const UNLIMITED_WALLET_ACCOUNTS = 10;
export const UNLIMITED_WALLET_EMAIL = 15;

export const VISIONARY_WALLETS = 50;
export const VISIONARY_WALLET_ACCOUNTS = 50;
export const VISIONARY_WALLET_EMAIL = 100;

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
    return c('wallet_signup_2024: Info').ngettext(
        msgid`${n} ${BRAND_NAME} email address`,
        `${n} ${BRAND_NAME} email addresses`,
        n
    );
};

export const getWalletEmailAddresses = (
    n: Parameters<typeof getWalletEmailAddressesText>['0']
): PlanCardFeatureDefinition => {
    return {
        text: getWalletEmailAddressesText(n),
        included: true,
        tooltip: c('wallet_signup_2024: Info')
            .t`Encrypted and secure ${MAIL_APP_NAME} email address. You can easily send Bitcoin to anyone with just their ${BRAND_NAME} name.`,
    };
};

export const getBitcoinViaEmailText = () => {
    return c('wallet_signup_2024: Info').t`Bitcoin via Email`;
};

export const getBitcoinViaEmail = (): PlanCardFeatureDefinition => {
    return {
        text: getBitcoinViaEmailText(),
        included: true,
        tooltip: c('wallet_signup_2024: Info')
            .t`Securely exchange Bitcoin via email instead of complex, 26-character Bitcoin addresses that are prone to error`,
    };
};

export const getWalletAppFeature = (): PlanCardFeatureDefinition => {
    return {
        text: WALLET_APP_NAME,
        tooltip: c('wallet_signup_2024:app-switcher').t`A safer way to hold Bitcoin`,
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
                [PLANS.BUNDLE]: getWallets(UNLIMITED_WALLETS),
                [PLANS.MAIL]: getWallets(FREE_WALLETS),
                [PLANS.VPN2024]: getWallets(FREE_WALLETS),
                [PLANS.DRIVE]: getWallets(FREE_WALLETS),
                [PLANS.DRIVE_1TB]: getWallets(FREE_WALLETS),
                [PLANS.DRIVE_BUSINESS]: getWallets(FREE_WALLETS),
                [PLANS.PASS]: getWallets(FREE_WALLETS),
                [PLANS.PASS_LIFETIME]: getWallets(FREE_WALLETS),
                [PLANS.PASS_FAMILY]: getWallets(FREE_WALLETS),
                [PLANS.FAMILY]: getWallets(UNLIMITED_WALLETS),
                [PLANS.DUO]: getWallets(UNLIMITED_WALLETS), // TODO validate with product
                [PLANS.MAIL_PRO]: getWallets(FREE_WALLETS),
                [PLANS.MAIL_BUSINESS]: getWallets(FREE_WALLETS),
                [PLANS.BUNDLE_PRO]: getWallets(UNLIMITED_WALLETS),
                [PLANS.BUNDLE_PRO_2024]: getWallets(UNLIMITED_WALLETS),
                [PLANS.PASS_PRO]: getWallets(FREE_WALLETS),
                [PLANS.PASS_BUSINESS]: getWallets(FREE_WALLETS),
                [PLANS.VPN_PRO]: getWallets(FREE_WALLETS),
                [PLANS.VPN_BUSINESS]: getWallets(FREE_WALLETS),
                [PLANS.LUMO]: getWallets(FREE_WALLETS),
                [PLANS.VISIONARY]: getWallets(VISIONARY_WALLETS),
            },
        },
        {
            name: 'wallet-accounts',
            plans: {
                [PLANS.FREE]: getWalletAccounts(FREE_WALLET_ACCOUNTS),
                [PLANS.BUNDLE]: getWalletAccounts(UNLIMITED_WALLET_ACCOUNTS),
                [PLANS.MAIL]: getWalletAccounts(FREE_WALLET_ACCOUNTS),
                [PLANS.VPN2024]: getWalletAccounts(FREE_WALLET_ACCOUNTS),
                [PLANS.DRIVE]: getWalletAccounts(FREE_WALLET_ACCOUNTS),
                [PLANS.DRIVE_1TB]: getWalletAccounts(FREE_WALLET_ACCOUNTS),
                [PLANS.DRIVE_BUSINESS]: getWalletAccounts(FREE_WALLET_ACCOUNTS),
                [PLANS.PASS]: getWalletAccounts(FREE_WALLET_ACCOUNTS),
                [PLANS.PASS_LIFETIME]: getWalletAccounts(FREE_WALLET_ACCOUNTS),
                [PLANS.PASS_FAMILY]: getWalletAccounts(FREE_WALLET_ACCOUNTS),
                [PLANS.FAMILY]: getWalletAccounts(UNLIMITED_WALLET_ACCOUNTS),
                [PLANS.DUO]: getWalletAccounts(UNLIMITED_WALLET_ACCOUNTS), // TODO validate with product
                [PLANS.MAIL_PRO]: getWalletAccounts(FREE_WALLET_ACCOUNTS),
                [PLANS.MAIL_BUSINESS]: getWalletAccounts(FREE_WALLET_ACCOUNTS),
                [PLANS.BUNDLE_PRO]: getWalletAccounts(UNLIMITED_WALLET_ACCOUNTS),
                [PLANS.BUNDLE_PRO_2024]: getWalletAccounts(UNLIMITED_WALLET_ACCOUNTS),
                [PLANS.PASS_PRO]: getWalletAccounts(FREE_WALLET_ACCOUNTS),
                [PLANS.PASS_BUSINESS]: getWalletAccounts(FREE_WALLET_ACCOUNTS),
                [PLANS.VPN_PRO]: getWalletAccounts(FREE_WALLET_ACCOUNTS),
                [PLANS.VPN_BUSINESS]: getWalletAccounts(FREE_WALLET_ACCOUNTS),
                [PLANS.LUMO]: getWalletAccounts(FREE_WALLET_ACCOUNTS),
                [PLANS.VISIONARY]: getWalletAccounts(VISIONARY_WALLET_ACCOUNTS),
            },
        },
        {
            name: 'wallet-email-addresses',
            plans: {
                [PLANS.FREE]: getWalletEmailAddresses(FREE_WALLET_EMAIL),
                [PLANS.BUNDLE]: getWalletEmailAddresses(UNLIMITED_WALLET_EMAIL),
                [PLANS.MAIL]: getWalletEmailAddresses(FREE_WALLET_EMAIL),
                [PLANS.VPN2024]: getWalletEmailAddresses(FREE_WALLET_EMAIL),
                [PLANS.DRIVE]: getWalletEmailAddresses(FREE_WALLET_EMAIL),
                [PLANS.DRIVE_1TB]: getWalletEmailAddresses(FREE_WALLET_EMAIL),
                [PLANS.DRIVE_BUSINESS]: getWalletEmailAddresses(FREE_WALLET_EMAIL),
                [PLANS.PASS]: getWalletEmailAddresses(FREE_WALLET_EMAIL),
                [PLANS.PASS_LIFETIME]: getWalletEmailAddresses(FREE_WALLET_EMAIL),
                [PLANS.PASS_FAMILY]: getWalletEmailAddresses(FREE_WALLET_EMAIL),
                [PLANS.FAMILY]: getWalletEmailAddresses(UNLIMITED_WALLET_EMAIL),
                [PLANS.DUO]: getWalletEmailAddresses(UNLIMITED_WALLET_EMAIL), // TODO validate with product
                [PLANS.MAIL_PRO]: getWalletEmailAddresses(FREE_WALLET_EMAIL),
                [PLANS.MAIL_BUSINESS]: getWalletEmailAddresses(FREE_WALLET_EMAIL),
                [PLANS.BUNDLE_PRO]: getWalletEmailAddresses(UNLIMITED_WALLET_EMAIL),
                [PLANS.BUNDLE_PRO_2024]: getWalletEmailAddresses(UNLIMITED_WALLET_EMAIL),
                [PLANS.PASS_PRO]: getWalletEmailAddresses(FREE_WALLET_EMAIL),
                [PLANS.PASS_BUSINESS]: getWalletEmailAddresses(FREE_WALLET_EMAIL),
                [PLANS.VPN_PRO]: getWalletEmailAddresses(FREE_WALLET_EMAIL),
                [PLANS.VPN_BUSINESS]: getWalletEmailAddresses(FREE_WALLET_EMAIL),
                [PLANS.LUMO]: getWalletEmailAddresses(FREE_WALLET_EMAIL),
                [PLANS.VISIONARY]: getWalletEmailAddresses(VISIONARY_WALLET_EMAIL),
            },
        },
        {
            name: 'wallet-bitcoin-via-email',
            plans: {
                [PLANS.FREE]: getBitcoinViaEmail(),
                [PLANS.BUNDLE]: getBitcoinViaEmail(),
                [PLANS.MAIL]: getBitcoinViaEmail(),
                [PLANS.VPN2024]: getBitcoinViaEmail(),
                [PLANS.DRIVE]: getBitcoinViaEmail(),
                [PLANS.DRIVE_1TB]: getBitcoinViaEmail(),
                [PLANS.DRIVE_BUSINESS]: getBitcoinViaEmail(),
                [PLANS.PASS]: getBitcoinViaEmail(),
                [PLANS.PASS_LIFETIME]: getBitcoinViaEmail(),
                [PLANS.PASS_FAMILY]: getBitcoinViaEmail(),
                [PLANS.FAMILY]: getBitcoinViaEmail(),
                [PLANS.DUO]: getBitcoinViaEmail(), // TODO validate with product
                [PLANS.MAIL_PRO]: getBitcoinViaEmail(),
                [PLANS.MAIL_BUSINESS]: getBitcoinViaEmail(),
                [PLANS.BUNDLE_PRO]: getBitcoinViaEmail(),
                [PLANS.BUNDLE_PRO_2024]: getBitcoinViaEmail(),
                [PLANS.PASS_PRO]: getBitcoinViaEmail(),
                [PLANS.PASS_BUSINESS]: getBitcoinViaEmail(),
                [PLANS.VPN_PRO]: getBitcoinViaEmail(),
                [PLANS.VPN_BUSINESS]: getBitcoinViaEmail(),
                [PLANS.LUMO]: getBitcoinViaEmail(),
                [PLANS.VISIONARY]: getBitcoinViaEmail(),
            },
        },
    ];
};
