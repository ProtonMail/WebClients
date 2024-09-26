import { useState } from 'react';

import { c } from 'ttag';

import { Button, Input, Scroll } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import type { Group } from '@proton/shared/lib/interfaces';
import { GroupPermissions } from '@proton/shared/lib/interfaces';

import GroupItem from './GroupItem';
import type { GroupsManagementReturn } from './types';

interface Props {
    groupsManagement: GroupsManagementReturn;
    canOnlyDelete: boolean;
}

const compareGroupNames = (a: Group, b: Group) => a.Name.localeCompare(b.Name);

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
    groupsManagement: { uiState, form, setUiState, setSelectedGroup, groups, selectedGroup, domainData, onDeleteGroup },
    canOnlyDelete,
}: Props) => {
    const { selectedDomain } = domainData;
    const { resetForm, values: formValues } = form;
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

    const newGroupData = {
        ID: 'new',
        Name: formValues.name === '' ? c('Empty group name').t`Unnamed` : formValues.name,
        Description: formValues.description,
        Address: {
            Email: formValues.address !== '' ? `${formValues.address}@${selectedDomain}` : '',
        },
        MemberCount: undefined,
    };

    const sortedGroups = getSortedGroups(input.toLowerCase(), groups);

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
                    <GroupItem key="new" active groupData={newGroupData} isNew={true} canOnlyDelete={canOnlyDelete} />
                )}
                {sortedGroups.map((groupData) => (
                    <GroupItem
                        key={groupData.ID}
                        groupData={groupData}
                        active={groupData.ID === selectedGroup?.ID}
                        onClick={() => {
                            if (groupData) {
                                setSelectedGroup(groupData);
                            }
                            setUiState('view');
                            resetForm({
                                values: {
                                    name: groupData.Name,
                                    description: groupData.Description,
                                    address: groupData.Address.Email,
                                    permissions: groupData.Permissions ?? GroupPermissions.NobodyCanSend,
                                    members: '',
                                },
                            });
                        }}
                        onDeleteGroup={onDeleteGroup}
                        canOnlyDelete={canOnlyDelete}
                    />
                ))}
            </Scroll>
        </>
    );
};

export default GroupList;
