import { useSelector } from 'react-redux';

import { useAuthStore } from '../components/Core/AuthStoreProvider';
import { usePassCore } from '../components/Core/PassCoreProvider';
import { SAFARI_URL_SCHEME, type UpsellRef, UpsellRefPrefix } from '../constants';
import type { AuthStore } from '../lib/auth/store';
import { selectUserPlan } from '../store/selectors';
import type { ClientEndpoint, MaybeNull, PassPlanResponse } from '../types';
import type { PassConfig } from './usePassConfig';

/** Prefer navigating to signup from extension/desktop
 * as we cannot guarantee the session exists */
export const PASS_UPGRADE_PATH = EXTENSION_BUILD || DESKTOP_BUILD ? 'pass/signup' : 'pass/dashboard';
/** Note: `pass/upgrade` route is only available to free Proton users, not paid users (e.g Pass Plus, Mail Plus...) */
export const PASS_UPGRADE_PATH_PROTON_FREE = EXTENSION_BUILD || DESKTOP_BUILD ? 'pass/signup' : 'pass/upgrade';

type UpgradeOptions = {
    coupon?: MaybeNull<string>;
    cycle?: string;
    disableEdit?: boolean;
    email?: string;
    offer?: string;
    path?: string;
    plan?: string;
    targetPage?: 'compare';
    type?: string;
    /** When PassNavbarUpgradeToAccount is enabled, upgrade button opens
     * account upgrade page (`u/<localID>/pass/upgrade`)
     * instead of the signup page. */
    upgradeToAccount?: boolean;
    upsellRef?: UpsellRef;
};

type UpgradeConfig = {
    authStore: MaybeNull<AuthStore>;
    config: PassConfig;
    endpoint: ClientEndpoint;
    /** If true, the default upgrade link will be `pass/upgrade` */
    isFree?: boolean;
};

const upgradeURLBuilder =
    ({ authStore, endpoint, config, isFree }: UpgradeConfig) =>
    (options: UpgradeOptions): string => {
        const searchParams = new URLSearchParams();

        const refPrefix: UpsellRefPrefix = (() => {
            switch (endpoint) {
                case 'desktop':
                    return UpsellRefPrefix.Desktop;
                case 'web':
                    return UpsellRefPrefix.Web;
                default:
                    return UpsellRefPrefix.Extension;
            }
        })();

        const defaultUpgradePath = isFree ? PASS_UPGRADE_PATH_PROTON_FREE : PASS_UPGRADE_PATH;
        const localID = authStore?.getLocalID();

        /** When PassNavbarUpgradeToAccount is enabled, upsell opens the account upgrade page instead of signup.
         * The local ID is embedded in the path (`u/<localID>`) rather than appended as a `u` query param.
         * ie …/u/0/pass/upgrade?ref=… instead of …/pass/signup?ref=…&u=0
         * Only applies to the default upgrade path: callers passing an explicit `path` (e.g. business
         * signup) or a targeted `coupon`/`offer` keep their dedicated checkout flow. */
        const useAccountUpgrade = Boolean(
            options.upgradeToAccount &&
            !options.path &&
            !options.coupon &&
            !options.offer &&
            (EXTENSION_BUILD || DESKTOP_BUILD) &&
            BUILD_TARGET !== 'safari' &&
            localID !== undefined
        );

        if (options.coupon) searchParams.append('coupon', options.coupon);
        if (options.cycle) searchParams.append('cycle', options.cycle);
        if (options.disableEdit) searchParams.append('edit', 'disable');
        if (options.email) searchParams.append('email', options.email);
        if (options.offer) searchParams.append('offer', options.offer);
        if (options.plan) searchParams.append('plan', options.plan);
        if (options.targetPage) searchParams.append('target', options.targetPage);
        if (options.upsellRef) searchParams.append('ref', `${refPrefix}_${options.upsellRef}`);
        if (options.type) searchParams.append('type', options.type);

        if (!options.email && !useAccountUpgrade && localID !== undefined) {
            searchParams.append('u', localID.toString());
        }

        const path = useAccountUpgrade ? `u/${localID}/pass/upgrade` : (options.path ?? defaultUpgradePath);

        return BUILD_TARGET === 'safari'
            ? `${SAFARI_URL_SCHEME}//upgrade?${searchParams.toString()}`
            : `${config.SSO_URL}/${path}?${searchParams.toString()}`;
    };

const useNavigateToUpgradeBase = (options: UpgradeOptions, userPlan?: MaybeNull<PassPlanResponse>) => {
    const { onLink, config, endpoint } = usePassCore();
    const authStore = useAuthStore();
    const isFree = userPlan?.InternalName === 'free';

    /** explicitly add `void` to allow piping */
    return (overwrite: UpgradeOptions | void = {}) => {
        const upgradeHref = upgradeURLBuilder({ authStore, endpoint, config, isFree })({ ...options, ...overwrite });
        onLink(upgradeHref, { replace: false });
    };
};

/** Do not use this function in non-redux contexts such as extension autofill dropdown */
const useNavigateToUpgradeWithRedux = (options: UpgradeOptions) => {
    const userPlan = useSelector(selectUserPlan);
    return useNavigateToUpgradeBase(options, userPlan);
};

/** `pathRef` will be passed to the upgrade link */
export const useNavigateToUpgrade = EXTENSION_BUILD ? useNavigateToUpgradeBase : useNavigateToUpgradeWithRedux;
