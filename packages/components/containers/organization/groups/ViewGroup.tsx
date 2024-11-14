import { c } from 'ttag';

import { Button, Panel, PanelHeader } from '@proton/atoms';
import Copy from '@proton/components/components/button/Copy';
import Icon from '@proton/components/components/icon/Icon';
import useNotifications from '@proton/components/hooks/useNotifications';
import type { Group } from '@proton/shared/lib/interfaces';

import E2EEDisabledWarning from './E2EEDisabledWarning';
import GroupMemberList from './GroupMemberList';
import type { GroupsManagementReturn } from './types';

interface Props {
    groupsManagement: GroupsManagementReturn;
    groupData: Group;
    canOnlyDelete: boolean;
}

const ViewGroup = ({
    groupsManagement: {
        setUiState,
        selectedGroup,
        groupMembers,
        loadingGroupMembers,
        form: { resetForm },
    },
    groupsManagement,
    groupData,
    canOnlyDelete,
}: Props) => {
    const { createNotification } = useNotifications();

    const handleCopy = () => {
        createNotification({ text: c('Info').t`Copied to clipboard` });
    };

    if (!selectedGroup) {
        return null;
    }

    return (
        <Panel
            header={
                <PanelHeader
                    title=""
                    subtitle=""
                    actions={(() => {
                        return [
                            <Button
                                disabled={canOnlyDelete}
                                className="flex items-center"
                                key="button-edit"
                                onClick={() => {
                                    setUiState('edit');
                                    resetForm({
                                        values: {
                                            name: groupData.Name,
                                            description: groupData.Description,
                                            address: groupData.Address.Email,
                                            permissions: groupData.Permissions,
                                            members: '',
                                        },
                                    });
                                }}
                            >
                                <Icon className="shrink-0 mr-2" name="pencil" />
                                <span>{c('Action').t`Edit group`}</span>
                            </Button>,
                        ];
                    })()}
                />
            }
        >
            <E2EEDisabledWarning
                groupMembers={groupMembers}
                loadingGroupMembers={loadingGroupMembers}
                group={groupData}
                groupsManagement={groupsManagement}
            />
            <div className="flex-col text-left p-1">
                {groupData.Name && (
                    <div className="mb-6">
                        <h3 className="text-bold">{groupData.Name}</h3>
                        {groupData.Description !== '' && groupData.Description}
                    </div>
                )}
                {groupData.Address.Email && (
                    <div className="mb-4">
                        <div className="color-weak text-sm">{c('Group address title').t`Group address`}</div>
                        <div className="text-left">
                            <span className="flex-1 my-auto mr-2">{groupData.Address.Email}</span>
                            <Copy
                                size="small"
                                shape="ghost"
                                value={groupData.Address.Email}
                                className="shrink-0"
                                onCopy={handleCopy}
                            />
                        </div>
                    </div>
                )}
                <GroupMemberList
                    groupMembers={groupMembers}
                    loading={loadingGroupMembers}
                    group={selectedGroup}
                    canOnlyDelete={canOnlyDelete}
                />
            </div>
        </Panel>
    );
};

export default ViewGroup;
