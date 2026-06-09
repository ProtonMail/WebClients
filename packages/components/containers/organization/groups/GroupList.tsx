import { useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import { Scroll } from '@proton/atoms/Scroll/Scroll';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import type { Group } from '@proton/shared/lib/interfaces';

import GroupItem from './GroupItem';
import { useGroupsManagement } from './context/GroupsManagementContext';
import useGroupAvailableAddressDomains from './hooks/useGroupAvailableAddressDomains';
import { GROUPS_STATE } from './types';

// Sort by natural order e.g. [1, 10, 11, 2] -> [1, 2, 10, 11]
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const compareGroupNames = (a: Group, b: Group) => collator.compare(a.Name, b.Name);

const getSortedGroups = (input: string, groups: Group[]) => {
    return input
        ? groups
              .filter((group) => {
                  return group.Name.toLowerCase().includes(input);
              })
              .sort(compareGroupNames)
        : [...groups].sort(compareGroupNames);
};

const GroupList = () => {
    const [user] = useUser();
    const { isFrozen, uiState, groups, selectedGroup, actions, getSerializedGroup, groupRolesMap } = useGroupsManagement();
    const { hasUsableDomain } = useGroupAvailableAddressDomains();
    const isAdmin = user?.isAdmin;

    const canCreateGroup = isAdmin && hasUsableDomain && !isFrozen;
    const [showSearchInput, setShowSearchInput] = useState(!canCreateGroup);
    const [searchInput, setSearchInput] = useState<string>('');

    const sideBarPlaceholder = (
        <div className="flex justify-center items-center w-full m-auto overflow-x-auto p-3 h-full">
            <div className="flex flex-column gap-3 text-center">
                <strong className="inline-block">{c('Title').t`There are no groups`}</strong>
                <span className="color-weak inline-block mb-4">
                    {c('Info').t`Let's get started by pressing the New group button above`}
                </span>
            </div>
        </div>
    );

    const sortedGroups = getSortedGroups(searchInput.toLowerCase(), groups);
    const serializedGroup = getSerializedGroup();

    return (
        <>
            <div
                className="flex items-center gap-2 border-bottom pb-4 mb-4 shrink-0 flex-nowrap px-3 pt-4 h-custom"
                style={{ '--h-custom': '5em' }}
            >
                {showSearchInput ? (
                    <>
                        <Input
                            autoFocus
                            value={searchInput}
                            onValue={setSearchInput}
                            placeholder={c('Placeholder').t`Group name`}
                            prefix={<IcMagnifier />}
                        />
                        {canCreateGroup && (
                            <Button
                                shape="ghost"
                                icon
                                onClick={() => {
                                    setShowSearchInput(false);
                                    setSearchInput('');
                                }}
                                title={c('Action').t`Close search`}
                            >
                                <IcCross alt={c('Action').t`Close search`} />
                            </Button>
                        )}
                    </>
                ) : (
                    <>
                        <Button
                            className="group-button flex flex-row flex-nowrap items-center px-3"
                            onClick={() => actions.onCreateGroup()}
                        >
                            <IcPlus className="shrink-0 mr-2" />
                            {c('Action').t`New group`}
                        </Button>
                        <Button
                            icon
                            className="ml-auto"
                            onClick={() => setShowSearchInput(true)}
                            title={c('Action').t`Search groups`}
                        >
                            <IcMagnifier alt={c('Action').t`Search groups`} />
                        </Button>
                    </>
                )}
            </div>
            {uiState !== GROUPS_STATE.NEW && groups.length === 0 && sideBarPlaceholder}
            <Scroll className="pb-4">
                {uiState === GROUPS_STATE.NEW && (
                    <GroupItem key="new" active serializedGroup={serializedGroup} isNew={true} />
                )}
                {sortedGroups.map((group) => (
                    <GroupItem
                        key={group.ID}
                        group={group}
                        active={group.ID === selectedGroup?.ID}
                        serializedGroup={serializedGroup?.payload.id === group.ID ? serializedGroup : undefined}
                        onClick={() => actions.onViewGroup(group)}
                        onDeleteGroup={actions.onDeleteGroup}
                        groupOrganizationRoles={groupRolesMap[group.ID]}
                    />
                ))}
            </Scroll>
        </>
    );
};

export default GroupList;
