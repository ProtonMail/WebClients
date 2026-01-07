import React, { useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { Input } from '@proton/atoms/Input/Input';
import Field from '@proton/components/components/container/Field';
import Row from '@proton/components/components/container/Row';
import Icon from '@proton/components/components/icon/Icon';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import type { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import { SERVER_FEATURES } from '@proton/shared/lib/constants';
import { getInitials } from '@proton/shared/lib/helpers/string';

import EntityTableRow from '../shared/EntityTableRow';
import TableHeader from '../shared/TableHeader';
import { useEntityTableSearch } from '../shared/useEntityTableSearch';
import ApplyPolicyButton from '../sharedServers/ApplyPolicyButton';
import type { GatewayDto } from './GatewayDto';
import type { GatewayGroup } from './GatewayGroup';
import type { GatewayUser } from './GatewayUser';

type PartialGateway = Pick<GatewayDto, 'features' | 'userIds' | 'groupIds'>;
interface Props {
    users: GatewayUser[];
    groups: GatewayGroup[];
    model: PartialGateway;
    changeModel: (model: Partial<PartialGateway>) => void;
}

export const GatewayUserSelection = ({ users, groups, model, changeModel }: Props) => {
    const [applyAccessTo, setApplyAccessTo] = useState<'users' | 'groups'>();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<GatewayUser[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<GatewayGroup[]>([]);

    const { filteredEntities: filteredUsers } = useEntityTableSearch(users, searchQuery, (user) => user.Name);

    const { filteredEntities: filteredGroups } = useEntityTableSearch(groups, searchQuery, (group) => group.Name);

    useEffect(() => {
        if ((model.userIds?.length ?? 0) > 0 && users?.length) {
            const preSelectedUsers = users.filter((u) => model.userIds?.includes(u.ID));
            setSelectedUsers(preSelectedUsers);
            setApplyAccessTo('users');
        }
    }, []);

    useEffect(() => {
        if ((model.groupIds?.length ?? 0) > 0 && groups?.length) {
            const preSelectedGroups = groups.filter((g) => model.groupIds?.includes(String(g.GroupID)));
            setSelectedGroups(preSelectedGroups);
            setApplyAccessTo('groups');
        }
    }, []);

    const onChangeApplyAccessTo = (val: 'users' | 'groups') => {
        setApplyAccessTo(val);
    };

    const onSelectUser = (user: GatewayUser) => {
        setSelectedUsers((previouslySelectedUsers) => {
            const exists = previouslySelectedUsers.some((u) => u.ID === user.ID);
            return exists
                ? previouslySelectedUsers.filter((u) => u.ID !== user.ID)
                : [...previouslySelectedUsers, user];
        });
    };

    const onSelectAllUsers = () => {
        setSelectedUsers((previouslySelectedUsers) =>
            previouslySelectedUsers.length < users.length ? [...users] : []
        );
    };

    const onSelectGroup = (group: GatewayGroup) => {
        setSelectedGroups((previouslySelectedGroups) => {
            const exists = previouslySelectedGroups.some((g) => g.GroupID === group.GroupID);
            return exists
                ? previouslySelectedGroups.filter((g) => g.GroupID !== group.GroupID)
                : [...previouslySelectedGroups, group];
        });
    };
    const onSelectAllGroups = () => {
        setSelectedGroups((previouslySelectedGroups) =>
            previouslySelectedGroups.length < groups.length ? [...groups] : []
        );
    };
    const modalUpdateUsersGroups = () => {
        if (applyAccessTo === 'users') {
            changeModel({
                userIds: selectedUsers.map(({ ID }) => ID),
                groupIds: null,
            });
        } else {
            changeModel({
                userIds: null,
                groupIds: selectedGroups.map(({ GroupID }) => String(GroupID)),
            });
        }
    };
    useEffect(() => {
        modalUpdateUsersGroups();
    }, [selectedUsers, selectedGroups]);

    const handleFeatureChange = ({ value }: SelectChangeEvent<string>) => {
        setApplyAccessTo('users');
        changeModel({ features: Number(value) });
    };
    return (
        <>
            <Row>
                <Field>
                    <SelectTwo
                        value={`${model.features & SERVER_FEATURES.DOUBLE_RESTRICTION}`}
                        onChange={handleFeatureChange}
                    >
                        <Option value="0" title={c('Title').t`Every member of the organization can access`}>
                            {c('Option').t`The whole organization`}
                        </Option>
                        <Option
                            value={`${SERVER_FEATURES.DOUBLE_RESTRICTION}`}
                            title={c('Title').t`Custom selection of users`}
                        >
                            {c('Option').t`Select who can access...`}
                        </Option>
                    </SelectTwo>
                </Field>
            </Row>
            {(model.features & SERVER_FEATURES.DOUBLE_RESTRICTION) !== 0 && groups.length > 0 ? (
                <>
                    <div className="flex flex-column md:flex-row flex-nowrap gap-4 w-full">
                        <ApplyPolicyButton
                            onClick={() => onChangeApplyAccessTo('users')}
                            label={c('Label').t`Users`}
                            isSelected={applyAccessTo === 'users'}
                        />
                        <ApplyPolicyButton
                            onClick={() => onChangeApplyAccessTo('groups')}
                            label={c('Label').t`Groups`}
                            isSelected={applyAccessTo === 'groups'}
                        />
                    </div>
                </>
            ) : undefined}

            {(model.features & SERVER_FEATURES.DOUBLE_RESTRICTION) !== 0 &&
            (applyAccessTo === 'users' || (applyAccessTo === 'groups' && groups.length > 0)) ? (
                <div className="my-4 w-full">
                    <Input
                        placeholder={c('Action').t`Search`}
                        prefix={<Icon name="magnifier" />}
                        className="pl-0"
                        value={searchQuery}
                        onChange={({ target }) => setSearchQuery(target.value)}
                    />
                </div>
            ) : undefined}

            {(model.features & SERVER_FEATURES.DOUBLE_RESTRICTION) !== 0 && applyAccessTo === 'users' ? (
                <>
                    <Table responsive="stacked" hasActions>
                        <TableBody>
                            <TableHeader
                                label={c('Label').t`Users`}
                                entities={users}
                                selectedEntities={selectedUsers}
                                onSelectAllEntities={onSelectAllUsers}
                            />
                            {filteredUsers.map((user) => {
                                const checked = selectedUsers.some((selectedUser) => selectedUser.ID === user.ID);
                                const initials = getInitials(user.Name || '');

                                return (
                                    <EntityTableRow
                                        id={user.ID}
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
                </>
            ) : undefined}

            {applyAccessTo === 'groups' && groups.length === 0 && (
                <div className="flex flex-column md:flex-row flex-nowrap gap-4 w-full">
                    <span className="mt-4 text-sm inline-block relative flex shrink-0 color-weak" aria-hidden="true">
                        {c('Info').t`To create your first user group, go to`}
                        <Href href={'/user-groups'} className="ml-1" target="_self">
                            {c('Link').t`Groups`}
                        </Href>
                    </span>
                </div>
            )}
            {(model.features & SERVER_FEATURES.DOUBLE_RESTRICTION) !== 0 && applyAccessTo === 'groups' ? (
                <Table>
                    <TableBody>
                        <TableHeader
                            label={c('Label').t`Groups`}
                            entities={groups}
                            selectedEntities={selectedGroups}
                            onSelectAllEntities={onSelectAllGroups}
                        />
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
                                    avatar={<Icon name="users-filled"></Icon>}
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
            ) : undefined}
        </>
    );
};

export default GatewayUserSelection;
