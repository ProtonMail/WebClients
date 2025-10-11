import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Panel } from '@proton/atoms/Panel/Panel';
import { PanelHeader } from '@proton/atoms/Panel/PanelHeader';
import Copy from '@proton/components/components/button/Copy';
import Icon from '@proton/components/components/icon/Icon';
import useNotifications from '@proton/components/hooks/useNotifications';
import type { Group } from '@proton/shared/lib/interfaces';

import E2EEDisabledWarning from './E2EEDisabledWarning';
import GroupMemberList from './GroupMemberList';
import shouldShowMail from './shouldShowMail';
import type { GroupsManagementReturn } from './types';

interface Props {
    groupsManagement: GroupsManagementReturn;
    groupData: Group;
    canOnlyDelete: boolean;
}

const ViewGroup = ({
    groupsManagement: { actions, selectedGroup, groupMembers, loadingGroupMembers, addressToMemberMap },
    groupsManagement,
    groupData,
    canOnlyDelete,
}: Props) => {
    const { createNotification } = useNotifications();
    const [organization] = useOrganization();

    const handleCopy = () => {
        createNotification({ text: c('Info').t`Copied to clipboard` });
    };

    if (!selectedGroup) {
        return null;
    }

    const showMail = shouldShowMail(organization?.PlanName);

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
                                    actions.onEditGroup(groupData);
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
            {showMail && (
                <E2EEDisabledWarning
                    groupMembers={groupMembers}
                    loadingGroupMembers={loadingGroupMembers}
                    group={groupData}
                    groupsManagement={groupsManagement}
                />
            )}
            <div className="flex-col text-left p-1">
                {groupData.Name && (
                    <div className="mb-6">
                        <h3 className="text-bold">{groupData.Name}</h3>
                        {groupData.Description !== '' && groupData.Description}
                    </div>
                )}
                {showMail && groupData.Address.Email && (
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
                    addressToMemberMap={addressToMemberMap}
                    loading={loadingGroupMembers}
                    group={selectedGroup}
                    canOnlyDelete={canOnlyDelete}
                />
            </div>
        </Panel>
    );
};

export default ViewGroup;
