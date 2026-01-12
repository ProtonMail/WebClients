import { memo } from 'react';

import { AdminPanelButton } from '@proton/pass/components/Menu/B2B/AdminPanelButton';
import { useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';

export const OrganizationActions = memo(() => {
    const org = useOrganization();
    return org && org.b2bAdmin && <AdminPanelButton {...org.organization} />;
});

OrganizationActions.displayName = 'OrganizationActionsMemo';
