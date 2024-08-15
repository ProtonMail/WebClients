import type { ProductParam } from '@proton/shared/lib/apps/product';
import { APPS } from '@proton/shared/lib/constants';

export enum SupportedActions {
    WalletSettings = 'wallet-settings',
    DeleteAccount = 'delete-account',
    SubscribeAccount = 'subscribe-account',
    SubscribeAccountLink = 'subscribe-account-link',
    AccountSettings = 'account-settings', // ET
    EmailSettings = 'email-settings', // ET
    LabelsSettings = 'labels-settings', // ET
    SpamFiltersSettings = 'spam-filters-settings', // ET
    PrivacySecuritySettings = 'privacy-security-settings', // ET
}

const list: { value: string; product: ProductParam }[] = [
    { value: 'vpn', product: APPS.PROTONVPN_SETTINGS },
    { value: 'mail', product: APPS.PROTONMAIL },
    { value: 'calendar', product: APPS.PROTONCALENDAR },
    { value: 'drive', product: APPS.PROTONDRIVE },
    { value: 'pass', product: APPS.PROTONPASS },
    { value: 'docs', product: APPS.PROTONDOCS },
    { value: 'generic', product: 'generic' },
    { value: 'business', product: 'business' },
];

export const getApp = ({
    app,
    redirect,
    plan,
}: {
    app?: string | null;
    plan?: string | null;
    redirect?: string | undefined;
}): ProductParam => {
    if (app) {
        const match = list.find(({ value }) => value === app);
        if (match) {
            return match.product;
        }
    }
    if (redirect) {
        const match = list.find(({ value }) => redirect.includes(value));
        if (match) {
            return match.product;
        }
    }
    if (plan) {
        const match = list.find(({ value }) => plan.includes(value));
        if (match) {
            return match.product;
        }
    }
    return 'generic';
};

const getIsDarkLayout = (searchParams: URLSearchParams) => {
    const action = searchParams.get('action') || undefined;

    const dark = action === SupportedActions.SubscribeAccount || action === SupportedActions.SubscribeAccountLink;

    return dark;
};

export default getIsDarkLayout;
