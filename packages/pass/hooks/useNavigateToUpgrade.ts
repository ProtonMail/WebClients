import { useSelector } from 'react-redux';

import { useAuthStore } from '@proton/pass//components/Core/AuthStoreProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { SAFARI_URL_SCHEME, type UpsellRef, UpsellRefPrefix } from '@proton/pass/constants';
import type { PassConfig } from '@proton/pass/hooks/usePassConfig';
import type { AuthStore } from '@proton/pass/lib/auth/store';
import type { ClientEndpoint, MaybeNull, PassPlanResponse } from '@proton/pass/types';

import { selectUserPlan } from '../store/selectors';

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
    type?: string;
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

        if (options.coupon) searchParams.append('coupon', options.coupon);
        if (options.cycle) searchParams.append('cycle', options.cycle);
        if (options.disableEdit) searchParams.append('edit', 'disable');
        if (options.email) searchParams.append('email', options.email);
        if (options.offer) searchParams.append('offer', options.offer);
        if (options.plan) searchParams.append('plan', options.plan);
        if (options.upsellRef) searchParams.append('ref', `${refPrefix}_${options.upsellRef}`);
        if (options.type) searchParams.append('type', options.type);

        if (!options.email) {
            const localID = authStore?.getLocalID();
            if (localID !== undefined) searchParams.append('u', localID.toString());
        }

        return BUILD_TARGET === 'safari'
            ? `${SAFARI_URL_SCHEME}//upgrade?${searchParams.toString()}`
            : `${config.SSO_URL}/${options.path ?? defaultUpgradePath}?${searchParams.toString()}`;
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
