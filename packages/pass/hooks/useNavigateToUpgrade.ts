import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { getUpgradePath } from '@proton/pass/lib/onboarding/upselling';

import { type UpsellRef, UpsellRefPrefix } from '../constants';

/** `pathRef` will be passed to the upgrade link */
export const useNavigateToUpgrade = (options: { path?: string; upsellRef: UpsellRef }) => {
    const { onLink, config, endpoint } = usePassCore();

    const refPrefix = UpsellRefPrefix[endpoint === 'web' ? 'Web' : 'Extension'];
    const refSearch = options?.upsellRef ? `&ref=${refPrefix}_${options.upsellRef}` : '';

    return () => onLink(`${config.SSO_URL}/${options.path ?? getUpgradePath()}${refSearch}`, { replace: true });
};
