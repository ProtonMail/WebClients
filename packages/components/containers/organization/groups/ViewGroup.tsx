import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { PanelHeader } from '@proton/atoms/Panel/PanelHeader';
import Copy from '@proton/components/components/button/Copy';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { IcPencil } from '@proton/icons/icons/IcPencil';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { IcUserPlus } from '@proton/icons/icons/IcUserPlus';
import { KEY_FLAG } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { Group } from '@proton/shared/lib/interfaces';

import AddUsersToGroupModal from './AddUsersToGroupModal';
import DeleteGroupPrompt from './DeleteGroupPrompt';
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
    const addUsersToGroupModal = useModalStateObject();
    const deleteGroupPrompt = useModalStateObject();
    const [addingMembers, withAddingMembers] = useLoading();

    const handleAddMembers = (group: Group, emails: string[]) => {
        void withAddingMembers(actions.onAddGroupMembers(group, emails));
    };

    const handleCopy = () => {
        createNotification({ text: c('Info').t`Copied to clipboard` });
    };

    if (!selectedGroup) {
        return null;
    }

    const showMailFeatures = shouldShowMail(organization?.PlanName);
    const primaryGroupAddressKey = groupData.Address.Keys[0];
    const isE2eeEnabled = !hasBit(primaryGroupAddressKey?.Flags ?? 0, KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT);

    return (
        <>
            <section className="flex flex-column flex-nowrap">
                <div className="shrink-0 pl-6 py-3">
                    <PanelHeader
                        className="border-bottom pb-4 pt-1"
                        title={
                            <h2
                                className="text-bold text-4xl text-ellipsis"
                                style={{ lineHeight: '2rem' }}
                                title={groupData.Name}
                            >
                                {groupData.Name}
                            </h2>
                        }
                        actions={[
                            <Button
                                color="norm"
                                disabled={canOnlyDelete}
                                className="flex items-center"
                                key="button-add-user"
                                onClick={() => addUsersToGroupModal.openModal(true)}
                            >
                                <IcUserPlus className="shrink-0 mr-2" alt={c('Action').t`Add user`} />
                                <span>{c('Action').t`Add user`}</span>
                            </Button>,
                            <Button
                                shape="outline"
                                icon
                                disabled={canOnlyDelete}
                                key="button-edit"
                                onClick={() => {
                                    actions.onEditGroup(groupData);
                                }}
                                title={c('Action').t`Edit group`}
                            >
                                <IcPencil alt={c('Action').t`Edit group`} />
                            </Button>,
                            <Button
                                shape="outline"
                                icon
                                key="button-delete"
                                onClick={() => {
                                    deleteGroupPrompt.openModal(true);
                                }}
                                title={c('Action').t`Delete group`}
                            >
                                <IcTrash alt={c('Action').t`Delete group`} />
                            </Button>,
                        ]}
                    />
                </div>
                <div className="flex flex-column text-left pl-6 py-3 gap-4">
                    {showMailFeatures && !isE2eeEnabled && (
                        <E2EEDisabledWarning groupMembers={groupMembers} loadingGroupMembers={loadingGroupMembers} />
                    )}

                    <div className="text-ellipsis-two-lines text-break">
                        <span className="text-bold mr-1">{c('Group detail label').t`Description:`}</span>
                        {groupData.Description}
                    </div>

                    {showMailFeatures && groupData.Address.Email && (
                        <div className="flex items-center">
                            <span className="text-bold mr-1">{c('Group detail label').t`Group address:`}</span>
                            <span className="mr-2">{groupData.Address.Email}</span>
                            <Copy
                                size="small"
                                shape="ghost"
                                value={groupData.Address.Email}
                                className="shrink-0"
                                onCopy={handleCopy}
                            />
                        </div>
                    )}

                    <div className="pt-4">
                        <GroupMemberList
                            groupMembers={groupMembers}
                            addressToMemberMap={addressToMemberMap}
                            loading={loadingGroupMembers || addingMembers}
                            group={selectedGroup}
                            canOnlyDelete={canOnlyDelete}
                            canChangeVisibility={showMailFeatures}
                            showMailFeatures={showMailFeatures}
                        />
                    </div>
                </div>
            </section>
            {addUsersToGroupModal.render && (
                <AddUsersToGroupModal
                    modalProps={addUsersToGroupModal.modalProps}
                    group={selectedGroup}
                    groupMembers={groupMembers}
                    members={groupsManagement.members}
                    isE2eeEnabled={isE2eeEnabled}
                    showMailFeatures={showMailFeatures}
                    addressEmailToMemberMap={groupsManagement.addressEmailToMemberMap}
                    onAddMembers={handleAddMembers}
                />
            )}
            {deleteGroupPrompt.render && (
                <DeleteGroupPrompt
                    group={groupData}
                    showMailFeatures={showMailFeatures}
                    onConfirm={async () => actions.onDeleteGroup()}
                    modalProps={deleteGroupPrompt.modalProps}
                />
            )}
        </>
    );
};

export default ViewGroup;
