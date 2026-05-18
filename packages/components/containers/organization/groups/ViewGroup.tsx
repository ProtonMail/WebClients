import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { PanelHeader } from '@proton/atoms/Panel/PanelHeader';
import Copy from '@proton/components/components/button/Copy';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import AdminRolesSpotlight from '@proton/components/containers/members/rolesAndPermissions/AdminRolesSpotlight';
import useNotifications from '@proton/components/hooks/useNotifications';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode, useFeature } from '@proton/features';
import { useLoading } from '@proton/hooks';
import { IcPencil } from '@proton/icons/icons/IcPencil';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { IcUserPlus } from '@proton/icons/icons/IcUserPlus';
import { KEY_FLAG, SECOND } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Group } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash/useFlag';

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
    groupsManagement: { actions, selectedGroup, groupMembers, loadingGroupMembers, addressToMemberMap, groupRolesMap },
    groupsManagement,
    groupData,
    canOnlyDelete,
}: Props) => {
    const { createNotification } = useNotifications();
    const [organization] = useOrganization();
    const addUsersToGroupModal = useModalStateObject();
    const deleteGroupPrompt = useModalStateObject();
    const [addingMembers, withAddingMembers] = useLoading();
    const hasAdminRoles = useFlag('AdminRoleMVP');
    const { feature: adminRolesModalFeature, loading: adminRolesModalLoading } = useFeature(
        FeatureCode.AdminRolesGroupOnboardingModal
    );
    const isAdminRolesModalDismissed = !adminRolesModalLoading && !adminRolesModalFeature?.Value;
    const {
        show: showSpotlight,
        onDisplayed: onSpotlightDisplayed,
        onClose: onSpotlightClose,
    } = useSpotlightOnFeature(FeatureCode.AdminRolesGroupEditSpotlight, hasAdminRoles && isAdminRolesModalDismissed);
    const shouldShowSpotlight = useSpotlightShow(showSpotlight, 3 * SECOND);

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

    const roleNames = groupRolesMap[groupData.ID]?.map((assignment) => assignment.Role.Name).join(', ');

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
                            <AdminRolesSpotlight
                                key="button-edit"
                                show={shouldShowSpotlight}
                                onDisplayed={onSpotlightDisplayed}
                                onClose={onSpotlightClose}
                                originalPlacement="bottom-end"
                                title={c('Spotlight').t`Assign roles`}
                                description={c('Spotlight')
                                    .t`Click Edit to assign roles to this group and manage member access automatically.`}
                                kbLink={getKnowledgeBaseUrl('/group-roles')}
                            >
                                <Button
                                    shape="outline"
                                    icon
                                    disabled={canOnlyDelete}
                                    onClick={() => {
                                        actions.onEditGroup(groupData);
                                    }}
                                    title={c('Action').t`Edit group`}
                                >
                                    <IcPencil alt={c('Action').t`Edit group`} />
                                </Button>
                            </AdminRolesSpotlight>,
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

                    {roleNames && (
                        <div className="text-ellipsis-two-lines text-break">
                            <span className="text-bold mr-1">{c('Group detail label').t`Roles and permission:`}</span>
                            {roleNames}
                        </div>
                    )}

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
