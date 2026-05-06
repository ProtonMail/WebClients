import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import { MEMBER_ROLE } from '@proton/shared/lib/constants';
import { type Member, ROLE_SOURCE, type UserOrganizationRole } from '@proton/shared/lib/interfaces';

interface AdminRoleItemProps {
    role: UserOrganizationRole;
    isLastItem: boolean;
}

const AdminRoleItem = ({ role, isLastItem }: AdminRoleItemProps) => {
    const isGroupSource = role.Source === ROLE_SOURCE.GROUP;
    const groupName = role.SourceGroupName;

    return (
        <span className="inline-flex items-center">
            <span>{role.Role.Name}</span>
            {isGroupSource && groupName && (
                <Tooltip title={c('tooltip').t`via ${groupName}`} openDelay={0}>
                    <span className="inline-flex shrink-0 ml-1">
                        <IcUsers alt={c('tooltip').t`via ${groupName}`} />
                    </span>
                </Tooltip>
            )}
            {!isLastItem && ','}
        </span>
    );
};

interface MemberRoleProps {
    member: Member;
    userOrganizationRoles?: UserOrganizationRole[];
}

const MemberRole = ({ member, userOrganizationRoles }: MemberRoleProps) => {
    if (userOrganizationRoles && userOrganizationRoles.length > 0) {
        return (
            <span className="inline-flex flex-wrap items-center gap-1">
                {Boolean(member.Subscriber) && <span>{c('User role').t`Primary admin`},</span>}
                {userOrganizationRoles.map((role, index) => (
                    <AdminRoleItem
                        key={`${role.Role.OrganizationRoleID}-${role.SourceID}`}
                        role={role}
                        isLastItem={index === userOrganizationRoles.length - 1}
                    />
                ))}
            </span>
        );
    }

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
