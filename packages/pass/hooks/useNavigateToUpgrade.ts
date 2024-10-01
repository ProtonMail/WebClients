import { useAuthStore } from '@proton/pass//components/Core/AuthStoreProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { PASS_UPGRADE_PATH, SAFARI_URL_SCHEME, type UpsellRef, UpsellRefPrefix } from '@proton/pass/constants';

/** `pathRef` will be passed to the upgrade link */
export const useNavigateToUpgrade = (options: {
    coupon?: string;
    cycle?: string;
    path?: string;
    plan?: string;
    offer?: boolean;
    upsellRef: UpsellRef;
    email?: string;
}) => {
    const { onLink, config, endpoint } = usePassCore();
    const authStore = useAuthStore();
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
    if (options.email) searchParams.append('email', options.email);
    if (options.offer) searchParams.append('offer', 'true');
    if (options.plan) searchParams.append('plan', options.plan);
    if (options.upsellRef) searchParams.append('ref', `${refPrefix}_${options.upsellRef}`);

    if (!options.email) {
        const localID = authStore?.getLocalID();
        if (localID !== undefined) searchParams.append('u', localID.toString());
    }

    const upgradeHref =
        BUILD_TARGET === 'safari'
            ? `${SAFARI_URL_SCHEME}//upgrade?${searchParams.toString()}`
            : `${config.SSO_URL}/${options.path ?? PASS_UPGRADE_PATH}?${searchParams.toString()}`;

    return () => onLink(upgradeHref, { replace: true });
};
