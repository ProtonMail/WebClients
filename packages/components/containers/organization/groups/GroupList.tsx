import { useState } from 'react';

import { c } from 'ttag';

import { Button, Input, Scroll } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import type { Group } from '@proton/shared/lib/interfaces';

import GroupItem from './GroupItem';
import type { GroupsManagementReturn } from './types';

interface Props {
    groupsManagement: GroupsManagementReturn;
    canOnlyDelete: boolean;
}

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

const GroupList = ({
    groupsManagement: { uiState, groups, selectedGroup, actions, getSerializedGroup },
    canOnlyDelete,
}: Props) => {
    const [input, setInput] = useState<string>('');

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

    const sortedGroups = getSortedGroups(input.toLowerCase(), groups);
    const serializedGroup = getSerializedGroup();

    return (
        <>
            <div className="flex flex-row grow-0 shrink-0 flex-nowrap p-3 mr-4">
                {!!groups.length && (
                    <Input
                        value={input}
                        onValue={setInput}
                        placeholder={c('Placeholder').t`Group name`}
                        prefix={<Icon name="magnifier" />}
                        suffix={
                            <Button shape="ghost" size="small" icon onClick={() => setInput('')}>
                                <Icon name="cross-small" alt={c('Action').t`Delete`} />
                            </Button>
                        }
                    />
                )}
            </div>
            {uiState !== 'new' && groups.length === 0 && sideBarPlaceholder}
            <Scroll className="mr-4">
                {uiState === 'new' && (
                    <GroupItem
                        key="new"
                        active
                        serializedGroup={serializedGroup}
                        isNew={true}
                        canOnlyDelete={canOnlyDelete}
                    />
                )}
                {sortedGroups.map((group) => (
                    <GroupItem
                        key={group.ID}
                        group={group}
                        active={group.ID === selectedGroup?.ID}
                        serializedGroup={serializedGroup?.payload.id === group.ID ? serializedGroup : undefined}
                        onClick={() => {
                            actions.onViewGroup(group);
                        }}
                        onDeleteGroup={actions.onDeleteGroup}
                        canOnlyDelete={canOnlyDelete}
                    />
                ))}
            </Scroll>
        </>
    );
};

export default GroupList;
