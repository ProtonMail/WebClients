import { useAuthStore } from '@proton/pass//components/Core/AuthStoreProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { SAFARI_URL_SCHEME, type UpsellRef, UpsellRefPrefix } from '@proton/pass/constants';
import type { PassConfig } from '@proton/pass/hooks/usePassConfig';
import type { AuthStore } from '@proton/pass/lib/auth/store';
import type { ClientEndpoint, MaybeNull } from '@proton/pass/types';

/** Prefer navigating to signup from extension/desktop
 * as we cannot guarantee the session exists */
export const PASS_UPGRADE_PATH = EXTENSION_BUILD || DESKTOP_BUILD ? 'pass/signup' : 'pass/dashboard';

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
};

const upgradeURLBuilder =
    ({ authStore, endpoint, config }: UpgradeConfig) =>
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
            : `${config.SSO_URL}/${options.path ?? PASS_UPGRADE_PATH}?${searchParams.toString()}`;
    };

/** `pathRef` will be passed to the upgrade link */
export const useNavigateToUpgrade = (options: UpgradeOptions) => {
    const { onLink, config, endpoint } = usePassCore();
    const authStore = useAuthStore();

    /** explicitly add `void` to allow piping */
    return (overwrite: UpgradeOptions | void = {}) => {
        const upgradeHref = upgradeURLBuilder({ authStore, endpoint, config })({ ...options, ...overwrite });
        onLink(upgradeHref, { replace: false });
    };
};
