import { c } from 'ttag';

import { MEMBER_ROLE } from '@proton/shared/lib/constants';
import { Member } from '@proton/shared/lib/interfaces';

const MemberRole = ({ member }: { member: Member }) => {
    if (member.Subscriber) {
        return <>{c('User role').t`Primary admin`}</>;
    }

    if (member.Role === MEMBER_ROLE.ORGANIZATION_MEMBER) {
        return <>{c('User role').t`Member`}</>;
    }

    if (member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN) {
        return <>{c('User role').t`Admin`}</>;
    }

    return null;
};

export default MemberRole;
