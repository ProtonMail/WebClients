import { memo } from 'react';

import { useOrganization } from '../../Organization/OrganizationProvider';
import { AdminPanelButton } from '../B2B/AdminPanelButton';

export const OrganizationActions = memo(() => {
    const org = useOrganization();
    return org && org.b2bAdmin && <AdminPanelButton {...org.organization} />;
});

OrganizationActions.displayName = 'OrganizationActionsMemo';
