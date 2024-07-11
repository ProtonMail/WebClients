import { c, msgid } from 'ttag';

import { PlanCardFeatureDefinition } from './interface';

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

export const getBitcoinViaEmail = (): PlanCardFeatureDefinition => {
    return {
        text: c('wallet_signup_2024: Info').t`Bitcoin via email`,
        included: true,
    };
};

export const getVisionaryWallet = (): PlanCardFeatureDefinition => {
    return {
        text: c('wallet_signup_2024: Info').t`Early access to new features`,
        included: true,
    };
};
