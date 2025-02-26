import React, { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Input } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import Checkbox from '@proton/components/components/input/Checkbox';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableRow from '@proton/components/components/table/TableRow';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import { getInitials } from '@proton/shared/lib/helpers/string';

import ApplyPolicyButton from '../ApplyPolicyButton';
import type { SharedServerGroup, SharedServerUser } from '../useSharedServers';

interface SharedServersMembersStepProps {
    isEditing: boolean;
    policyName: string;
    users: SharedServerUser[];
    selectedUsers: SharedServerUser[];
    groups: SharedServerGroup[];
    selectedGroups: SharedServerGroup[];
    onSelectUser: (user: SharedServerUser) => void;
    onSelectGroup: (group: SharedServerGroup) => void;
    applyPolicyTo: 'users' | 'groups';
    onChangeApplyPolicyTo: (val: 'users' | 'groups') => void;
}

const MembersStep = ({
    isEditing,
    policyName,
    users,
    selectedUsers,
    groups,
    selectedGroups,
    onSelectUser,
    onSelectGroup,
    applyPolicyTo,
    onChangeApplyPolicyTo,
}: SharedServersMembersStepProps) => {
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
            <div className="flex flex-column gap-2">
                <span>
                    {!isEditing ? c('Label').t`Apply policy to` : policyName}
                    {!isEditing && (
                        <Tooltip title={applyPolicyTooltipMessage} className="ml-2 mb-1" originalPlacement="right">
                            <Icon name="info-circle" color="var(--interaction-norm)" alt={applyPolicyTooltipMessage} />
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

            {(applyPolicyTo === 'users' || (applyPolicyTo === 'groups' && filteredGroups.length > 0)) && (
                <div className="my-4 w-full">
                    <Input
                        placeholder={c('Action').t`Search`}
                        prefix={<Icon name="magnifier" />}
                        className="pl-0"
                        value={searchQuery}
                        onChange={({ target }) => setSearchQuery(target.value)}
                    />
                </div>
            )}

            {applyPolicyTo === 'users' && (
                <Table responsive="stacked" hasActions>
                    <TableBody>
                        {filteredUsers.map((user) => {
                            const checked = selectedUsers.some((selectedUser) => selectedUser.UserID === user.UserID);
                            // TODO add email
                            const initials = getInitials(user.Name || '');

                            return (
                                <TableRow key={user.UserID}>
                                    <TableCell>
                                        <div className="flex flex-column md:flex-row flex-nowrap gap-4 w-full">
                                            <Checkbox
                                                id={`user-${user.UserID}`}
                                                checked={checked}
                                                onChange={() => onSelectUser(user)}
                                            />
                                            <span
                                                className="my-auto text-sm rounded border p-1 inline-block relative flex shrink-0 user-initials"
                                                aria-hidden="true"
                                            >
                                                <span className="m-auto">{initials}</span>
                                            </span>
                                            <div className="flex flex-column">
                                                <span>{user.Name}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            )}

            {applyPolicyTo === 'groups' && filteredGroups.length === 0 && (
                <div className="flex flex-column md:flex-row flex-nowrap gap-4 w-full">
                    <span className="mt-4 text-sm inline-block relative flex shrink-0 color-weak" aria-hidden="true">
                        {c('Info').t`To create your first user group, go to`}&nbsp;
                        <strong>{c('Info').t`Organization --> Groups`}</strong>
                    </span>
                </div>
            )}

            {applyPolicyTo === 'groups' && filteredGroups.length > 0 && (
                <Table responsive="stacked" hasActions>
                    <TableBody>
                        {filteredGroups.length > 0 &&
                            filteredGroups.map((group) => {
                                const checked = selectedGroups.some(
                                    (selectedGroup) => selectedGroup.GroupID === group.GroupID
                                );

                                return (
                                    <TableRow key={group.GroupID}>
                                        <TableCell>
                                            <div className="flex flex-column md:flex-row flex-nowrap gap-4 w-full">
                                                <Checkbox
                                                    id={`group-${group.GroupID}`}
                                                    checked={checked}
                                                    onChange={() => onSelectGroup(group)}
                                                />
                                                <span
                                                    className="my-auto text-sm rounded border p-1 inline-block relative flex shrink-0"
                                                    aria-hidden="true"
                                                >
                                                    <span className="m-auto">
                                                        <Icon name="users-filled"></Icon>
                                                    </span>
                                                </span>
                                                <div className="flex flex-column">
                                                    <span>{group.Name}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>
            )}
        </div>
    );
};

export default MembersStep;
