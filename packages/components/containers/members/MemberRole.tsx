import { c } from 'ttag';

import { getTranslatedRoleName } from '@proton/account/organizationRoles/helpers';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import { MEMBER_ROLE } from '@proton/shared/lib/constants';
import { type Member, ROLE_SOURCE, type RoleAssignment } from '@proton/shared/lib/interfaces';

interface AggregatedRole {
    Role: RoleAssignment['Role'];
    hasUserSource: boolean;
    groupNames: string[];
}

const aggregateRoles = (roles: RoleAssignment[]): AggregatedRole[] => {
    const byRoleId = new Map<string, AggregatedRole>();

    roles.forEach((role) => {
        const roleId = role.Role.OrganizationRoleID;
        const aggregated = byRoleId.get(roleId) ?? { Role: role.Role, hasUserSource: false, groupNames: [] };
        byRoleId.set(roleId, aggregated);

        if (role.Source === ROLE_SOURCE.USER) {
            aggregated.hasUserSource = true;
        } else if (role.Source === ROLE_SOURCE.GROUP && role.SourceGroupName) {
            aggregated.groupNames.push(role.SourceGroupName);
        }
    });

    return [...byRoleId.values()];
};

interface AdminRoleItemProps {
    role: AggregatedRole;
    isLastItem: boolean;
}

const AdminRoleItem = ({ role, isLastItem }: AdminRoleItemProps) => {
    const groupNames = role.hasUserSource ? '' : role.groupNames.join(', ');

    return (
        <span className="inline-flex items-center">
            <span>{getTranslatedRoleName(role.Role.Name)}</span>
            {groupNames && (
                <Tooltip title={c('tooltip').t`via ${groupNames}`} openDelay={0}>
                    <span className="inline-flex shrink-0 ml-1">
                        <IcUsers alt={c('tooltip').t`via ${groupNames}`} />
                    </span>
                </Tooltip>
            )}
            {!isLastItem && ','}
        </span>
    );
};

interface MemberRoleProps {
    member: Member;
    userOrganizationRoles?: RoleAssignment[];
}

const MemberRole = ({ member, userOrganizationRoles }: MemberRoleProps) => {
    if (userOrganizationRoles && userOrganizationRoles.length > 0) {
        const aggregatedRoles = aggregateRoles(userOrganizationRoles);
        return (
            <span className="inline-flex flex-wrap items-center gap-1">
                {Boolean(member.Subscriber) && <span>{c('User role').t`Primary admin`},</span>}
                {aggregatedRoles.map((role, index) => (
                    <AdminRoleItem
                        key={role.Role.OrganizationRoleID}
                        role={role}
                        isLastItem={index === aggregatedRoles.length - 1}
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
