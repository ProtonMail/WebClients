import { useMembers } from '@proton/account/members/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';

import { useOAuthToken } from '../../logic/oauthToken/hooks';
import MigrationFlow from './MigrationFlow';

const SettingsArea = () => {
    const [, organizationLoading] = useOrganization();
    const [, membersLoading] = useMembers();
    const [, tokensLoading] = useOAuthToken();

    if (tokensLoading || organizationLoading || membersLoading) {
        return <SkeletonLoader />;
    }

    return <MigrationFlow />;
};

export default SettingsArea;
