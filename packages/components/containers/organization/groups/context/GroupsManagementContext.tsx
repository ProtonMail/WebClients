import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';

import type { FormikErrors } from 'formik';
import { useFormik } from 'formik';
import { c, msgid } from 'ttag';

import { useGetGroupMembers, useGroupMembers } from '@proton/account/groupMembers/hooks';
import { useGroupMemberships } from '@proton/account/groupMemberships/hooks';
import { createGroup, deleteGroup, editGroup } from '@proton/account/groups/actions';
import { addGroupMembersThunk } from '@proton/account/groups/addGroupMember';
import { getIsSystemGroup } from '@proton/account/groups/groupFlags';
import { useGroups } from '@proton/account/groups/hooks';
import { getGroupRoles, updateGroupRoles } from '@proton/account/groups/index';
import { useGroupRoles } from '@proton/account/groups/useGroupRoles';
import { invalidateMemberRoles } from '@proton/account/members';
import { promoteMemberToOrgAdmin } from '@proton/account/members/actions';
import { useGetMembers, useMembers } from '@proton/account/members/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { isOrgKeyRequired, isOwnerRole } from '@proton/account/organizationRoles/helpers';
import { useOrganizationRoles } from '@proton/account/organizationRoles/hooks';
import { useUser } from '@proton/account/user/hooks';
import { AdminRolesUIState, useAdminRolesUI } from '@proton/account/userPermissions/hooks';
import Loader from '@proton/components/components/loader/Loader';
import useGroupKeys from '@proton/components/containers/organization/groups/useGroupKeys';
import useApi from '@proton/components/hooks/useApi';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities/interface';
import { checkMemberAddressAvailability } from '@proton/shared/lib/api/members';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { EnhancedMember, Group, GroupMember, Organization } from '@proton/shared/lib/interfaces';
import { GroupFlags, GroupPermissions } from '@proton/shared/lib/interfaces';
import { GROUP_MEMBER_PERMISSIONS } from '@proton/shared/lib/interfaces/GroupMember';
import { useFlag } from '@proton/unleash/useFlag';
import setsContainSameElements from '@proton/utils/setsContainSameElements';

import canUseGroups from '../canUseGroups';
import useGroupAvailableAddressDomains from '../hooks/useGroupAvailableAddressDomains';
import shouldShowMail from '../shouldShowMail';
import { GROUPS_RESTRICTION_REASON, GROUPS_STATE } from '../types';
import type { GroupFormData, GroupsManagementReturn, GroupsRestriction } from '../types';
import useGroupsProtonMeDomain from '../useGroupsProtonMeDomain';

const INITIAL_FORM_VALUES = (organization?: Organization): GroupFormData => ({
    name: '',
    description: '',
    address: '',
    permissions: shouldShowMail(organization?.PlanName)
        ? GroupPermissions.EveryoneCanSend
        : GroupPermissions.NobodyCanSend,
    members: '',
    adminRoles: [],
});

const useGroupsManagementLogic = (): GroupsManagementReturn | undefined => {
    const [organization] = useOrganization();
    const isUserGroupsNoCustomDomainEnabled = useFlag('UserGroupsNoCustomDomain');
    const isUserGroupsPassBusinessEnabled = useFlag('UserGroupsPassBusiness');

    const handleError = useErrorHandler();
    const [members] = useMembers();
    const [memberships, loadingMemberships] = useGroupMemberships();
    const [groups, loadingGroups] = useGroups();
    const { value: groupRolesMap } = useGroupRoles({ groups });
    const [user, loadingUser] = useUser();
    const api = useApi();
    const dispatch = useDispatch();
    const [organizationRoles] = useOrganizationRoles();
    const [adminRolesUIState] = useAdminRolesUI();
    const { createNotification } = useNotifications();
    const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);
    const selectedGroup = groups?.find((group) => group.ID === selectedGroupId);
    const [uiState, setUiState] = useState<GROUPS_STATE>(GROUPS_STATE.EMPTY);
    const [resumingGroupId, setResumingGroupId] = useState<string | undefined>(undefined);
    const cancelRoleAssignmentRequestedRef = useRef(false);
    const getGroupMembers = useGetGroupMembers();
    const getLatestMembers = useGetMembers();
    const { getMemberPublicKeys } = useGroupKeys();

    const addGroupMembers = async (group: Group, emails: string[]) => {
        try {
            await dispatch(addGroupMembersThunk({ group, emails, getMemberPublicKeys }));
            createNotification({
                type: 'success',
                text: c('Info').ngettext(
                    msgid`${emails.length} member added to the group`,
                    `${emails.length} members added to the group`,
                    emails.length
                ),
            });
        } catch (e: unknown) {
            handleError(e);
        }
    };
    const [groupsProtonMeDomain] = useGroupsProtonMeDomain();
    const { primarySuggestion, invalidGroupSuggestion, loading: loadingDomains } = useGroupAvailableAddressDomains();

    const addressToMemberMap = useMemo(() => {
        const value: { [id: string]: EnhancedMember | undefined } = {};
        for (const member of members ?? []) {
            if (member.Addresses) {
                for (const address of member.Addresses) {
                    value[address.ID] = member;
                }
            }
        }
        return value;
    }, [members]);

    const addressEmailToMemberMap = useMemo(() => {
        const value: { [email: string]: EnhancedMember | undefined } = {};
        for (const member of members ?? []) {
            if (member.Addresses) {
                for (const address of member.Addresses) {
                    value[address.Email] = member;
                }
            }
        }
        return value;
    }, [members]);

    const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

    useEffect(() => {
        if (primarySuggestion.domain && selectedDomain === null) {
            setSelectedDomain(primarySuggestion.domain);
        }
    }, [primarySuggestion, selectedDomain]);

    const [groupMembers, loadingGroupMembers] = useGroupMembers(selectedGroup?.ID);

    const transformedGroupMembers: GroupMember[] | undefined =
        groupMembers !== undefined ? Object.values(groupMembers) : [];

    const hasDuplicateNameValidator = (name: string): string => {
        const countGroupsWithName = groups?.filter(({ Name }) => Name === name).length ?? 0;
        const groupNameLimit = uiState === GROUPS_STATE.NEW ? 0 : 1;
        return countGroupsWithName > groupNameLimit ? c('Error').t`Name already exists` : '';
    };

    const form = useFormik({
        initialValues: INITIAL_FORM_VALUES(organization),
        onSubmit: () => {},
        validateOnChange: true,
        validateOnMount: false,
        validate: ({ name, address }) => {
            const errors: FormikErrors<GroupFormData> = {};
            const nameRequiredError = requiredValidator(name);
            const nameDuplicateError = hasDuplicateNameValidator(name);
            const addressError = emailValidator(`${address}@${selectedDomain}`);
            if (nameRequiredError) {
                errors.name = nameRequiredError;
            }
            if (nameDuplicateError) {
                errors.name = nameDuplicateError;
            }
            if (uiState === GROUPS_STATE.NEW && addressError) {
                errors.address = addressError;
            }
            return errors;
        },
    });

    const { resetForm, values: formValues } = form;

    const isLoading =
        !organization ||
        loadingGroups ||
        loadingDomains ||
        loadingUser ||
        loadingMemberships ||
        !groups ||
        !members ||
        !selectedDomain ||
        !primarySuggestion.domain ||
        !user ||
        !memberships;

    if (isLoading) {
        return undefined;
    }

    const getSerializedGroup: GroupsManagementReturn['getSerializedGroup'] = () => {
        const allowedTypes = uiState === GROUPS_STATE.NEW || uiState === GROUPS_STATE.EDIT;
        if (!allowedTypes) {
            return;
        }
        const email =
            uiState === GROUPS_STATE.NEW && formValues.address
                ? `${formValues.address}@${selectedDomain}`
                : formValues.address;
        return {
            type: uiState,
            payload: {
                id: selectedGroup?.ID,
                name: formValues.name,
                email,
                domain: selectedDomain,
                description: formValues.description,
                permissions: formValues.permissions,
                flags: selectedGroup?.Flags ?? GroupFlags.None, // preserve existing flags on edit; new groups start with no flags
            },
        };
    };

    const onDeleteGroup = async () => {
        if (!selectedGroup) {
            return;
        }

        try {
            await dispatch(deleteGroup(selectedGroup));
            createNotification({ type: 'success', text: c('Info').t`Group deleted` });
            resetForm();
            setSelectedGroupId(undefined);
            setUiState(GROUPS_STATE.EMPTY);
        } catch (error) {
            handleError(error);
        }
    };

    const promoteGroupMembersToOrgAdmin = async (
        groupMembers: GroupMember[],
        onCancel?: () => boolean
    ): Promise<{ cancelled: boolean; errors: unknown[] }> => {
        const errors: unknown[] = [];
        const latestMembers = await getLatestMembers();
        for (const groupMember of groupMembers) {
            if (onCancel?.()) {
                return { cancelled: true, errors };
            }
            const member = groupMember.Email ? addressEmailToMemberMap[groupMember.Email] : undefined;
            if (!member) {
                continue;
            }
            const latestMember = latestMembers.find(({ ID }) => ID === member.ID) ?? member;
            try {
                await dispatch(promoteMemberToOrgAdmin({ member: latestMember, api }));
            } catch (error) {
                errors.push(error);
            }
        }
        return { cancelled: false, errors };
    };

    const invalidateGroupMemberRoles = (groupMembersToInvalidate: GroupMember[]) => {
        for (const groupMember of groupMembersToInvalidate) {
            const member = groupMember.Email ? addressEmailToMemberMap[groupMember.Email] : undefined;
            if (member) {
                dispatch(invalidateMemberRoles({ member }));
            }
        }
    };

    const syncGroupAdminRoles = async (group: Pick<Group, 'ID'>) => {
        if (adminRolesUIState !== AdminRolesUIState.Enabled) {
            return;
        }

        const ownerRoleIds = new Set(
            (organizationRoles ?? []).filter(isOwnerRole).map((role) => role.OrganizationRoleID)
        );

        const currentRoles = await dispatch(getGroupRoles({ group }));
        const currentRoleIds = new Set(currentRoles.map(({ Role }) => Role.OrganizationRoleID));
        const desiredRoleIds = new Set(formValues.adminRoles.filter((id) => !ownerRoleIds.has(id)));
        if (setsContainSameElements(currentRoleIds, desiredRoleIds)) {
            return;
        }

        const addedRoleIds = [...desiredRoleIds].filter((id) => !currentRoleIds.has(id));
        const addedRolesRequireOrgKey = (organizationRoles ?? []).some(
            (role) => addedRoleIds.includes(role.OrganizationRoleID) && isOrgKeyRequired(role)
        );

        await dispatch(updateGroupRoles({ group, currentRoleIds, desiredRoleIds, api }));

        if (addedRolesRequireOrgKey) {
            // Members inherit the group's roles. When a newly added role needs the organization key,
            // each non-admin member must be promoted so they receive it. Role removals are demoted by the BE.
            const { errors } = await promoteGroupMembersToOrgAdmin(transformedGroupMembers);
            errors.forEach((error) => handleError(error, { notify: false }));
            if (errors.length > 0) {
                createNotification({
                    type: 'error',
                    text: c('Error').ngettext(
                        msgid`Role assignment could not be completed for ${errors.length} member`,
                        `Role assignment could not be completed for ${errors.length} members`,
                        errors.length
                    ),
                });
            }
        }

        invalidateGroupMemberRoles(transformedGroupMembers);
    };

    const handleSaveGroup = async () => {
        const serializedGroup = getSerializedGroup();
        if (!serializedGroup) {
            throw new Error('Unexpected save group state');
        }

        const { type, payload } = serializedGroup;
        const isNewGroup = type === GROUPS_STATE.NEW;

        const isGroupsProtonMeDomain = selectedDomain === groupsProtonMeDomain;

        // Don't check address availability for groups created on the groups.proton.me domain
        if (isNewGroup && !isGroupsProtonMeDomain) {
            // Check address availablity if address changed - not supported when in edit mode yet
            if (selectedGroup?.Address.Email !== payload.email) {
                await api(
                    checkMemberAddressAvailability({
                        Local: formValues.address,
                        Domain: selectedDomain,
                    })
                );
            }
        }

        const thunkAction = isNewGroup ? createGroup : editGroup;
        const Group = await dispatch(thunkAction({ api: api, group: payload }));

        if (isNewGroup) {
            createNotification({ type: 'success', text: c('Info').t`Group created` });
        }

        await syncGroupAdminRoles(Group);

        setUiState(GROUPS_STATE.VIEW);

        resetForm();
        setSelectedGroupId(Group.ID);
    };

    const getStoredAdminRoles = (groupID: string): string[] => {
        const stored = groups?.find((g) => g.ID === groupID);
        return stored?.GroupOrganizationRoles?.map(({ Role }) => Role.OrganizationRoleID) ?? [];
    };

    const handleEditGroup = (group: Group) => {
        setUiState(GROUPS_STATE.EDIT);
        resetForm({
            values: {
                name: group.Name,
                description: group.Description,
                address: group.Address.Email,
                permissions: group.Permissions ?? GroupPermissions.EveryoneCanSend,
                members: '',
                adminRoles: getStoredAdminRoles(group.ID),
            },
        });
    };

    const handleViewGroup = (group: Group) => {
        setSelectedGroupId(group.ID);
        setUiState(GROUPS_STATE.VIEW);
        resetForm({
            values: {
                name: group.Name,
                description: group.Description,
                address: group.Address.Email,
                permissions: group.Permissions ?? GroupPermissions.NobodyCanSend,
                members: '',
                adminRoles: getStoredAdminRoles(group.ID),
            },
        });
    };

    const handleUnselectGroup = () => {
        setSelectedGroupId(undefined);
        setUiState(GROUPS_STATE.EMPTY);
    };

    const handleCreateGroup = () => {
        setUiState(GROUPS_STATE.NEW);
        resetForm({
            values: INITIAL_FORM_VALUES(organization),
        });
        setSelectedGroupId(undefined);
    };

    const handleDiscardChanges = () => {
        setUiState(groups.length === 0 ? GROUPS_STATE.EMPTY : GROUPS_STATE.VIEW);
        resetForm({
            values: INITIAL_FORM_VALUES(organization),
        });
    };

    const domainData = {
        loading: loadingDomains,
        selectedDomain,
        setSelectedDomain,
    };

    const filteredGroups = groups.filter((group) => {
        // Filter out system groups. They should never be displayed in the UI.
        if (getIsSystemGroup(group)) {
            return false;
        }
        // Admins see all remaining groups; non-admins only see groups they own.
        if (user.isAdmin) {
            return true;
        }
        return memberships.some(
            ({ GroupID, Permissions }) => GroupID === group.ID && Permissions & GROUP_MEMBER_PERMISSIONS.OWNER
        );
    });

    const handleToggleRoleAssignments = async () => {
        if (resumingGroupId !== undefined) {
            cancelRoleAssignmentRequestedRef.current = true;
            return;
        }

        const pausedGroups = filteredGroups.filter((group) => group.requiresOrgKeyPromotion);
        if (pausedGroups.length === 0) {
            return;
        }

        cancelRoleAssignmentRequestedRef.current = false;
        let failedGroupCount = 0;
        for (const group of pausedGroups) {
            if (cancelRoleAssignmentRequestedRef.current) {
                break;
            }
            setResumingGroupId(group.ID);
            try {
                const groupMembersById = await getGroupMembers(group.ID);
                const groupMembersList = groupMembersById ? Object.values(groupMembersById) : [];
                const { cancelled, errors } = await promoteGroupMembersToOrgAdmin(
                    groupMembersList,
                    () => cancelRoleAssignmentRequestedRef.current
                );
                if (errors.length > 0) {
                    errors.forEach((error) => handleError(error, { notify: false }));
                    failedGroupCount += 1;
                }
                if (cancelled) {
                    break;
                }

                await dispatch(getGroupRoles({ group, cache: CacheType.None }));
                invalidateGroupMemberRoles(groupMembersList);
            } catch (error) {
                failedGroupCount += 1;
                handleError(error);
            }
        }
        setResumingGroupId(undefined);

        if (cancelRoleAssignmentRequestedRef.current) {
            cancelRoleAssignmentRequestedRef.current = false;
            return;
        }

        if (failedGroupCount === 0) {
            createNotification({ type: 'success', text: c('Info').t`Group roles assigned` });
            return;
        }

        createNotification({
            type: 'error',
            text: c('Error').ngettext(
                msgid`Role assignment could not be completed for ${failedGroupCount} group`,
                `Role assignment could not be completed for ${failedGroupCount} groups`,
                failedGroupCount
            ),
        });
    };

    const getRestrictedBy = (): GroupsRestriction => {
        const isPlanUnsupported =
            (invalidGroupSuggestion && filteredGroups.length > 0) ||
            !canUseGroups(organization.PlanName, {
                isUserGroupsNoCustomDomainEnabled,
                isUserGroupsPassBusinessEnabled,
            });

        if (isPlanUnsupported) {
            return { reason: GROUPS_RESTRICTION_REASON.PLAN_UNSUPPORTED };
        }
        if (resumingGroupId !== undefined) {
            return { reason: GROUPS_RESTRICTION_REASON.RESUMING_ROLE_ASSIGNMENT, groupId: resumingGroupId };
        }
        return { reason: GROUPS_RESTRICTION_REASON.NONE };
    };

    const restrictedBy = getRestrictedBy();

    return {
        groups: filteredGroups,
        restrictedBy,
        members,
        selectedGroup,
        uiState,
        form,
        groupMembers: transformedGroupMembers,
        addressToMemberMap,
        addressEmailToMemberMap,
        groupRolesMap,
        loadingGroupMembers,
        domainData,
        getSerializedGroup,
        actions: {
            onDiscardChanges: handleDiscardChanges,
            onDeleteGroup,
            onEditGroup: handleEditGroup,
            onViewGroup: handleViewGroup,
            onSaveGroup: handleSaveGroup,
            onCreateGroup: handleCreateGroup,
            onAddGroupMembers: addGroupMembers,
            onUnselectGroup: handleUnselectGroup,
            onToggleRoleAssignments: handleToggleRoleAssignments,
        },
    };
};

const GroupsManagementContext = createContext<GroupsManagementReturn | null>(null);

export const useGroupsManagement = () => {
    const ctx = useContext(GroupsManagementContext);
    if (!ctx) {
        throw new Error('useGroupsManagement must be used within withGroupsManagementContext');
    }
    return ctx;
};

export const withGroupsManagementContext = <P extends object>(Component: ComponentType<P>) => {
    const WrappedComponent = (props: P) => {
        const groupsManagement = useGroupsManagementLogic();
        if (!groupsManagement) {
            return <Loader />;
        }
        return (
            <GroupsManagementContext.Provider value={groupsManagement}>
                <Component {...props} />
            </GroupsManagementContext.Provider>
        );
    };
    WrappedComponent.displayName = `withGroupsManagementContext(${Component.displayName || Component.name})`;
    return WrappedComponent;
};
