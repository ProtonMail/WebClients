import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useDebugApiOrganizationMemberView, useDebugApiOrganizationView } from '../../services/apiUsageDebugStore';
import { ApiUsageDashboard } from './ApiUsageDashboard';

import './ApiKeysPanel.scss';

export const ApiUsagePanel = () => {
    const { isOrgAdmin, userIsMember } = useLumoPlan();
    const debugOrganizationView = useDebugApiOrganizationView();
    const debugOrganizationMemberView = useDebugApiOrganizationMemberView();
    const effectiveOrgAdmin = isOrgAdmin || debugOrganizationView;

    return (
        <ApiUsageDashboard
            isOrgAdmin={effectiveOrgAdmin}
            isOrgMember={debugOrganizationMemberView || (!effectiveOrgAdmin && userIsMember)}
        />
    );
};
