import { c } from 'ttag';

import { Button, Scroll } from '@proton/atoms';
import { Icon } from '@proton/components/components';
import { GroupPermissions } from '@proton/shared/lib/interfaces';

import GroupItem from './GroupItem';
import type { GroupsManagementReturn } from './types';

interface Props {
    groupsManagement: GroupsManagementReturn;
}

const GroupList = ({
    groupsManagement: { uiState, form, setUiState, setSelectedGroup, groups, selectedGroup, domainData },
}: Props) => {
    const { selectedDomain } = domainData;
    const { resetForm, values: formValues } = form;

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

    return (
        <>
            <div className="flex flex-row grow-0 shrink-0 flex-nowrap p-3 gap-1 overflow-x-auto space-between">
                <Button
                    onClick={() => {
                        setUiState('new');
                        resetForm({
                            values: {
                                name: '',
                                description: '',
                                address: '',
                                permissions: GroupPermissions.NobodyCanSend,
                                members: '',
                            },
                        });
                        setSelectedGroup(newGroupData);
                    }}
                >
                    <Icon className="shrink-0 mr-2" name="plus" />
                    {c('Action').t`New group`}
                </Button>
            </div>
            {uiState !== 'new' && groups.length === 0 && sideBarPlaceholder}
            <Scroll className="mr-6">
                {uiState === 'new' && <GroupItem key="new" active groupData={newGroupData} />}
                {groups.map((groupData) => (
                    <GroupItem
                        key={groupData.Address.ID}
                        groupData={groupData}
                        active={groupData.Address.ID === selectedGroup?.ID}
                        onClick={() => {
                            if (groupData.Address.ID) {
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
                    />
                ))}
            </Scroll>
        </>
    );
};

export default GroupList;
