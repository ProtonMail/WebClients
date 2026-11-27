import { useCallback } from 'react';

import { useAuthStore } from '../components/Core/AuthStoreProvider';
import { usePassCore } from '../components/Core/PassCoreProvider';
import { useOrganization } from '../components/Organization/OrganizationProvider';
import { AccountPath } from '../constants';

export const useNavigateToAccount = (path: AccountPath) => {
    const { onLink, config } = usePassCore();
    const authStore = useAuthStore();

    const localID = authStore?.getLocalID();
    const localIdPath = localID !== undefined ? `u/${localID}/` : '';

    const href = `${config.SSO_URL}/${localIdPath}${path}`;

    return useCallback(() => onLink(href), [onLink, href]);
};

/** Organization members have no account dashboard: the account app
 * would redirect them to the Pass downloads page instead. */
export const useNavigateToAccountHome = () => {
    const organization = useOrganization();
    const isOrgMember = organization !== null && !organization.b2bAdmin;

    return useNavigateToAccount(isOrgMember ? AccountPath.ACCOUNT_PASSWORD : AccountPath.DASHBOARD);
};
