import React, { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Href } from '@proton/atoms/Href/Href';
import { Input } from '@proton/atoms/Input/Input';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Checkbox from '@proton/components/components/input/Checkbox';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableRow from '@proton/components/components/table/TableRow';
import canUseGroups from '@proton/components/containers/organization/groups/canUseGroups';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import { IcUsersFilled } from '@proton/icons/icons/IcUsersFilled';
import { ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import { hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import { getInitials } from '@proton/shared/lib/helpers/string';
import type { Organization } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';

import ApplyPolicyButton from '../ApplyPolicyButton';
import type { SharedServerGroup, SharedServerUser } from '../useSharedServers';

interface TableHeaderProps {
    entities: SharedServerUser[] | SharedServerGroup[];
    selectedEntities: SharedServerUser[] | SharedServerGroup[];
    onSelectAllEntities: () => void;
    label: string;
}

const TableHeader = ({ label, entities, selectedEntities, onSelectAllEntities }: TableHeaderProps) => (
    <TableRow>
        <TableCell>
            <div className="w-full">
                <Checkbox
                    checked={entities.length <= selectedEntities.length}
                    onChange={onSelectAllEntities}
                    gap="gap-4"
                >
                    <div className="flex gap-4 items-center">
                        <span className="text-bold">{label}</span>
                        {selectedEntities.length > 0 && (
                            <span className="text-sm color-weak">
                                {c('Info').ngettext(
                                    msgid`${selectedEntities.length} selected`,
                                    `${selectedEntities.length} selected`,
                                    selectedEntities.length
                                )}
                            </span>
                        )}
                    </div>
                </Checkbox>
            </div>
        </TableCell>
    </TableRow>
);

interface AddEntitiesTableRowProps {
    id: string | number;
    checked: boolean;
    onSelectEntity: ((entity: SharedServerUser) => void) | ((entity: SharedServerGroup) => void);
    entity: SharedServerUser | SharedServerGroup;
    avatar: React.ReactNode;
    description: React.ReactNode;
}

const EntityTableRow = ({ id, checked, onSelectEntity, entity, avatar, description }: AddEntitiesTableRowProps) => (
    <TableRow key={id}>
        <TableCell>
            <div className="w-full">
                <Checkbox
                    id={`user-${id}`}
                    checked={checked}
                    onChange={() => onSelectEntity(entity as any)}
                    gap="gap-4"
                >
                    <div className="flex flex-column md:flex-row flex-nowrap gap-4">
                        <span
                            className="my-auto text-sm rounded border p-1 inline-block relative flex shrink-0 user-initials"
                            aria-hidden="true"
                        >
                            <span className="m-auto">{avatar}</span>
                        </span>
                        <div className="flex flex-column">
                            <span>{entity.Name}</span>
                            <span className="text-sm color-weak">{description}</span>
                        </div>
                    </div>
                </Checkbox>
            </div>
        </TableCell>
    </TableRow>
);

interface SharedServersMembersStepProps {
    organization?: Organization;
    loading?: boolean;
    isEditing: boolean;
    policyName: string;
    users: SharedServerUser[];
    selectedUsers: SharedServerUser[];
    groups: SharedServerGroup[];
    selectedGroups: SharedServerGroup[];
    onSelectUser: (user: SharedServerUser) => void;
    onSelectGroup: (group: SharedServerGroup) => void;
    onSelectAllUsers: () => void;
    onSelectAllGroups: () => void;
    applyPolicyTo: 'users' | 'groups';
    onChangeApplyPolicyTo: (val: 'users' | 'groups') => void;
}

const MembersStep = ({
    organization,
    loading,
    isEditing,
    policyName,
    users,
    selectedUsers,
    groups,
    selectedGroups,
    onSelectUser,
    onSelectGroup,
    onSelectAllUsers,
    onSelectAllGroups,
    applyPolicyTo,
    onChangeApplyPolicyTo,
}: SharedServersMembersStepProps) => {
    const isUserGroupsNoCustomDomainEnabled = useFlag('UserGroupsNoCustomDomain');
    const hasOrganizationKey = hasOrganizationSetupWithKeys(organization);
    const isOrgActive = organization?.State === ORGANIZATION_STATE.ACTIVE;
    const hasActiveOrganizationKey = isOrgActive && hasOrganizationKey;

    const allowedToUseGroups =
        hasActiveOrganizationKey && canUseGroups(organization?.PlanName, { isUserGroupsNoCustomDomainEnabled });
    const hasAtLeastOneGroup = (groups?.length ?? 0) > 0;

    const canCreateGroupsPolicy = !!organization && (allowedToUseGroups || hasAtLeastOneGroup);

    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = useMemo(() => {
        return users.filter((user) => user.Name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [users, searchQuery]);

    const filteredGroups = useMemo(() => {
        return groups.filter((group) => group.Name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [groups, searchQuery]);

    const applyPolicyTooltipMessage = c('Tooltip')
        .t`Shared server policies can be applied to individual users or groups`;

    return (
        <div>
            {canCreateGroupsPolicy && (
                <div className="flex flex-column gap-2">
                    <span>
                        {!isEditing ? c('Label').t`Apply policy to` : policyName}
                        {!isEditing && (
                            <Tooltip title={applyPolicyTooltipMessage} className="ml-2 mb-1" originalPlacement="right">
                                <IcInfoCircle color="var(--interaction-norm)" alt={applyPolicyTooltipMessage} />
                            </Tooltip>
                        )}
                    </span>
                    <div className="flex flex-column md:flex-row flex-nowrap gap-4 w-full">
                        <ApplyPolicyButton
                            onClick={() => onChangeApplyPolicyTo('users')}
                            label={c('Label').t`Users`}
                            isSelected={applyPolicyTo === 'users'}
                        />
                        <ApplyPolicyButton
                            onClick={() => onChangeApplyPolicyTo('groups')}
                            label={c('Label').t`Groups`}
                            isSelected={applyPolicyTo === 'groups'}
                        />
                    </div>
                </div>
            )}

            {(applyPolicyTo === 'users' || (applyPolicyTo === 'groups' && groups.length > 0)) && (
                <div className="my-4 w-full">
                    <Input
                        placeholder={c('Action').t`Search`}
                        prefix={<IcMagnifier />}
                        className="pl-0"
                        value={searchQuery}
                        onChange={({ target }) => setSearchQuery(target.value)}
                    />
                </div>
            )}

            {applyPolicyTo === 'users' && (
                <Table responsive="stacked" hasActions>
                    <TableBody>
                        <TableHeader
                            label={c('Label').t`Users`}
                            entities={users}
                            selectedEntities={selectedUsers}
                            onSelectAllEntities={onSelectAllUsers}
                        />
                        {loading && (
                            <div className="flex flex-nowrap">
                                <CircleLoader />
                            </div>
                        )}
                        {filteredUsers.map((user) => {
                            const checked = selectedUsers.some((selectedUser) => selectedUser.UserID === user.UserID);
                            const initials = getInitials(user.Name || '');

                            return (
                                <EntityTableRow
                                    id={user.UserID}
                                    onSelectEntity={onSelectUser}
                                    checked={checked}
                                    entity={user}
                                    avatar={initials}
                                    description={user.Email}
                                />
                            );
                        })}
                    </TableBody>
                </Table>
            )}

            {applyPolicyTo === 'groups' && groups.length === 0 && (
                <div className="flex flex-column md:flex-row flex-nowrap gap-4 w-full">
                    <span className="mt-4 text-sm inline-block relative flex shrink-0 color-weak" aria-hidden="true">
                        {c('Info').t`To create your first user group, go to`}
                        <Href href={'/user-groups'} className="ml-1" target="_self">
                            {c('Link').t`Groups`}
                        </Href>
                    </span>
                </div>
            )}

            {applyPolicyTo === 'groups' && groups.length > 0 && (
                <Table responsive="stacked" hasActions>
                    <TableBody>
                        <TableHeader
                            label={c('Label').t`Groups`}
                            entities={groups}
                            selectedEntities={selectedGroups}
                            onSelectAllEntities={onSelectAllGroups}
                        />
                        {loading && (
                            <div className="flex flex-nowrap">
                                <CircleLoader />
                            </div>
                        )}
                        {filteredGroups.map((group) => {
                            const checked = selectedGroups.some(
                                (selectedGroup) => selectedGroup.GroupID === group.GroupID
                            );
                            return (
                                <EntityTableRow
                                    id={group.GroupID}
                                    onSelectEntity={onSelectGroup}
                                    checked={checked}
                                    entity={group}
                                    avatar={<IcUsersFilled />}
                                    description={c('Label').ngettext(
                                        msgid`${group.UserCount} user`,
                                        `${group.UserCount} users`,
                                        group.UserCount
                                    )}
                                />
                            );
                        })}
                    </TableBody>
                </Table>
            )}
        </div>
    );
};

export default MembersStep;
