import { getProduct } from '@proton/shared/lib/apps/helper';
import { type ProductParam, otherProductParamValues } from '@proton/shared/lib/apps/product';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';

export enum SupportedActions {
    WalletSettings = 'wallet-settings',
    DeleteAccount = 'delete-account',
    SubscribeAccount = 'subscribe-account',
    SubscribeAccountLink = 'subscribe-account-link',
    AccountSettings = 'account-settings', // ET
    EmailSettings = 'email-settings', // ET
    CalendarSettings = 'calendar-settings',
    CalendarAccountSettings = 'calendar-account-settings',
    CalendarAddFromUrl = 'calendar-add-from-url',
    EmailSignatures = 'email-signatures', // ET
    LabelsSettings = 'labels-settings', // ET
    SpamFiltersSettings = 'spam-filters-settings', // ET
    PrivacySecuritySettings = 'privacy-security-settings', // ET
    CategoryView = 'category-view', // ET
    BYOEMobile = 'byoe-mobile', // ET
    VPNLite = 'vpn-lite',
    SignOut = 'sign-out',
}

const LITE_APP_BASE_PATH = '/lite/space';

export const LiteAppPaths = {
    Recovery: `${LITE_APP_BASE_PATH}/recovery`,
    Privacy: `${LITE_APP_BASE_PATH}/privacy`,
    Notifications: `${LITE_APP_BASE_PATH}/notifications`,
    Referral: `${LITE_APP_BASE_PATH}/referral`,
} as const;

const list: { value: string; product: ProductParam }[] = [
    { value: 'vpn', product: APPS.PROTONVPN_SETTINGS },
    { value: 'mail', product: APPS.PROTONMAIL },
    { value: 'calendar', product: APPS.PROTONCALENDAR },
    { value: 'drive', product: APPS.PROTONDRIVE },
    { value: 'pass', product: APPS.PROTONPASS },
    { value: 'docs', product: APPS.PROTONDOCS },
    { value: 'lumo', product: APPS.PROTONLUMO },
    { value: 'generic', product: 'generic' },
    { value: 'business', product: 'business' },
];

const isAppName = (product: ProductParam): product is APP_NAMES =>
    !!product && !otherProductParamValues.some((value) => value === product);

/**
 * The `app` search parameter that `getApp` reads back as this app, or as an app of the same product for apps it doesn't
 * list (e.g. the Pass browser extension gets the Pass plans)
 */
export const getAppSearchParam = (app: APP_NAMES) => {
    const product = getProduct(app);
    return (
        list.find((item) => item.product === app) ??
        list.find((item) => isAppName(item.product) && getProduct(item.product) === product)
    )?.value;
};

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
