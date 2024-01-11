import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';

import { PASS_UPGRADE_PATH, type UpsellRef, UpsellRefPrefix } from '../constants';
import { authStore } from '../lib/auth/store';

/** `pathRef` will be passed to the upgrade link */
export const useNavigateToUpgrade = (options: { path?: string; upsellRef: UpsellRef }) => {
    const { onLink, config, endpoint } = usePassCore();
    const searchParams = new URLSearchParams();

    const refPrefix = UpsellRefPrefix[endpoint === 'web' ? 'Web' : 'Extension'];
    if (options.upsellRef) searchParams.append('ref', `${refPrefix}_${options.upsellRef}`);

    const localID = authStore?.getLocalID();
    if (localID !== undefined) searchParams.append('u', localID.toString());

    const upgradeHref = `${config.SSO_URL}/${options.path ?? PASS_UPGRADE_PATH}?${searchParams.toString()}`;

    return () => onLink(upgradeHref, { replace: true });
};
