import { c, msgid } from 'ttag';

import { getIsScimGroup, getIsScimGroupPendingKeys } from '@proton/account/groups/groupFlags';
import { useOrganization } from '@proton/account/organization/hooks';
import { selectIsKeylessSsoOrganizationPlan } from '@proton/account/scimSetup';
import { AdminRolesUIState, useAdminRolesUI } from '@proton/account/userPermissions/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { PanelHeader } from '@proton/atoms/Panel/PanelHeader';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Copy from '@proton/components/components/button/Copy';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import AdminRolesSpotlight from '@proton/components/containers/members/rolesAndPermissions/AdminRolesSpotlight';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useNotifications from '@proton/components/hooks/useNotifications';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode, useFeature } from '@proton/features';
import { useLoading } from '@proton/hooks';
import { IcCogWheel } from '@proton/icons/icons/IcCogWheel';
import { IcEnvelopeDot } from '@proton/icons/icons/IcEnvelopeDot';
import { IcPencil } from '@proton/icons/icons/IcPencil';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import { KEY_FLAG, SECOND } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { GROUP_MEMBER_STATE, type Group } from '@proton/shared/lib/interfaces';

import AddUsersToGroupModal from './AddUsersToGroupModal';
import DeleteGroupPrompt from './DeleteGroupPrompt';
import E2EEDisabledWarning from './E2EEDisabledWarning';
import GroupIcon from './GroupIcon';
import GroupInfoBanner from './GroupInfoBanner';
import GroupMemberList from './GroupMemberList';
import { useGroupsManagement } from './context/GroupsManagementContext';
import shouldShowMail from './shouldShowMail';
import { GROUPS_RESTRICTION_REASON, PANEL_HEADER_HEIGHT } from './types';

const ViewGroup = () => {
    const { createNotification } = useNotifications();
    const {
        restrictedBy,
        actions,
        selectedGroup,
        groupMembers,
        loadingGroupMembers,
        addressToMemberMap,
        members,
        addressEmailToMemberMap,
        groupRolesMap,
    } = useGroupsManagement();
    const isKeylessSsoOrganizationPlan = useSelector(selectIsKeylessSsoOrganizationPlan);
    const [organization] = useOrganization();
    const addUsersToGroupModal = useModalStateObject();
    const deleteGroupPrompt = useModalStateObject();
    const [addingMembers, withAddingMembers] = useLoading();
    const [adminRolesUIState] = useAdminRolesUI();
    const { feature: adminRolesModalFeature, loading: adminRolesModalLoading } = useFeature(
        FeatureCode.AdminRolesGroupOnboardingModal
    );
    const isAdminRolesModalDismissed = !adminRolesModalLoading && !adminRolesModalFeature?.Value;
    const {
        show: showSpotlight,
        onDisplayed: onSpotlightDisplayed,
        onClose: onSpotlightClose,
    } = useSpotlightOnFeature(
        FeatureCode.AdminRolesGroupEditSpotlight,
        adminRolesUIState === AdminRolesUIState.Enabled && isAdminRolesModalDismissed
    );
    const shouldShowSpotlight = useSpotlightShow(showSpotlight, 3 * SECOND);
    const breakpoints = useActiveBreakpoint();
    const isMobile = breakpoints.viewportWidth['<=small'];
    const handleAddMembers = (group: Group, emails: string[]) => {
        void withAddingMembers(actions.onAddGroupMembers(group, emails));
    };

    const handleCopy = () => createNotification({ text: c('Info').t`Copied to clipboard` });

    const group = selectedGroup!;
    const { Name, Description, Address } = group;

    const isResumingRoleAssignment =
        restrictedBy.reason === GROUPS_RESTRICTION_REASON.RESUMING_ROLE_ASSIGNMENT && restrictedBy.groupId === group.ID;
    const isFrozen = restrictedBy.reason === GROUPS_RESTRICTION_REASON.PLAN_UNSUPPORTED || isResumingRoleAssignment;

    const showMailFeatures = shouldShowMail(organization?.PlanName);
    const primaryGroupAddressKey = Address.Keys[0];
    const isE2eeEnabled = !hasBit(primaryGroupAddressKey?.Flags ?? 0, KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT);

    const roleNames = groupRolesMap[group.ID]?.map((assignment) => assignment.Role.Name).join(', ');

    const isScimGroup = getIsScimGroup(group);
    const isScimGroupPendingKeys = getIsScimGroupPendingKeys(group);
    const pendingAdminApprovalCount = groupMembers.filter(
        (m) => m.State === GROUP_MEMBER_STATE.PENDING_ADMIN_APPROVAL
    ).length;
    const invitedMemberCount = groupMembers.filter((m) => m.State === GROUP_MEMBER_STATE.PENDING).length;

    const isAddGroupMemberDisabled = isScimGroup || isFrozen;
    const isDeleteGroupDisabled = isScimGroup || isResumingRoleAssignment;

    return (
        <>
            <section className="flex flex-column flex-nowrap">
                <div className="shrink-0 pl-6" style={{ '--h-custom': PANEL_HEADER_HEIGHT }}>
                    <PanelHeader
                        className="border-bottom h-custom"
                        title={
                            <div className="flex flex-column gap-1">
                                <h2
                                    className="text-bold text-2xl text-ellipsis"
                                    style={{ lineHeight: '2rem' }}
                                    title={Name}
                                >
                                    {Name}
                                </h2>
                                {isScimGroup && (
                                    <span className="flex items-center flex-nowrap gap-1 color-weak text-sm">
                                        <GroupIcon className="shrink-0" size={3} isScimGroup />
                                        {c('Info').t`Synced from identity provider`}
                                    </span>
                                )}
                            </div>
                        }
                        actions={[
                            <Tooltip
                                key="button-add"
                                title={isScimGroup ? c('Info').t`Manage groups in your identity provider` : null}
                            >
                                <span>
                                    <Button
                                        color="norm"
                                        icon={isMobile}
                                        disabled={isAddGroupMemberDisabled}
                                        className="flex items-center"
                                        key="button-add-user"
                                        onClick={() => addUsersToGroupModal.openModal(true)}
                                    >
                                        <IcPlus className="shrink-0 md:mr-2" alt={c('Action').t`Add user`} />
                                        {!isMobile && <span>{c('Action').t`Add user`}</span>}
                                    </Button>
                                </span>
                            </Tooltip>,
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
                                    disabled={isFrozen}
                                    onClick={() => {
                                        actions.onEditGroup(group);
                                    }}
                                    title={c('Action').t`Edit group`}
                                >
                                    <IcPencil alt={c('Action').t`Edit group`} />
                                </Button>
                            </AdminRolesSpotlight>,
                            <Tooltip
                                key="button-delete"
                                title={isScimGroup ? c('Info').t`Manage groups in your identity provider` : null}
                            >
                                <span>
                                    <Button
                                        shape="outline"
                                        icon
                                        disabled={isDeleteGroupDisabled}
                                        onClick={() => {
                                            deleteGroupPrompt.openModal(true);
                                        }}
                                        title={c('Action').t`Delete group`}
                                    >
                                        <IcTrash alt={c('Action').t`Delete group`} />
                                    </Button>
                                </span>
                            </Tooltip>,
                        ]}
                    />
                </div>
                <div className="flex flex-column text-left pl-6 py-3 gap-4">
                    {isScimGroupPendingKeys && !isKeylessSsoOrganizationPlan && (
                        <GroupInfoBanner icon={<IcCogWheel size={4.5} className="shrink-0" />}>
                            {c('Info').t`New group created via your identity provider and pending review.`}
                        </GroupInfoBanner>
                    )}

                    {pendingAdminApprovalCount > 0 && !isKeylessSsoOrganizationPlan && (
                        <GroupInfoBanner icon={<IcCogWheel size={4.5} className="shrink-0" />}>
                            {c('Info').ngettext(
                                msgid`${pendingAdminApprovalCount} new member added via your identity provider and pending review.`,
                                `${pendingAdminApprovalCount} new members added via your identity provider and pending review.`,
                                pendingAdminApprovalCount
                            )}
                        </GroupInfoBanner>
                    )}

                    {invitedMemberCount > 0 && (
                        <GroupInfoBanner icon={<IcEnvelopeDot size={4.5} className="shrink-0" />}>
                            {c('Info').ngettext(
                                msgid`${invitedMemberCount} user needs to accept their invite to start receiving group emails.`,
                                `${invitedMemberCount} users need to accept their invite to start receiving group emails.`,
                                invitedMemberCount
                            )}
                        </GroupInfoBanner>
                    )}

                    {showMailFeatures && !isE2eeEnabled && (
                        <E2EEDisabledWarning groupMembers={groupMembers} loadingGroupMembers={loadingGroupMembers} />
                    )}

                    {Description && <div className="text-ellipsis-two-lines text-break">{Description}</div>}

                    {roleNames && (
                        <div className="text-ellipsis-two-lines text-break">
                            <span className="text-bold mr-1">{c('Group detail label').t`Roles and permission:`}</span>
                            {roleNames}
                        </div>
                    )}

                    {showMailFeatures && Address.Email && (
                        <div className="flex items-center">
                            <span className="text-bold mr-1 shrink-0">{c('Group detail label').t`Group address:`}</span>
                            <span className="mr-2 text-break">{Address.Email}</span>
                            <Copy
                                size="small"
                                shape="ghost"
                                value={Address.Email}
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
                            group={group}
                            canChangeVisibility={showMailFeatures}
                            showMailFeatures={showMailFeatures}
                        />
                    </div>
                </div>
            </section>
            {addUsersToGroupModal.render && (
                <AddUsersToGroupModal
                    modalProps={addUsersToGroupModal.modalProps}
                    group={group}
                    groupMembers={groupMembers}
                    members={members}
                    isE2eeEnabled={isE2eeEnabled}
                    showMailFeatures={showMailFeatures}
                    addressEmailToMemberMap={addressEmailToMemberMap}
                    onAddMembers={handleAddMembers}
                />
            )}
            {deleteGroupPrompt.render && (
                <DeleteGroupPrompt
                    group={group}
                    showMailFeatures={showMailFeatures}
                    onConfirm={async () => actions.onDeleteGroup()}
                    modalProps={deleteGroupPrompt.modalProps}
                />
            )}
        </>
    );
};

export default ViewGroup;
