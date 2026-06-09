import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';

import type { FormikErrors } from 'formik';
import { useFormik } from 'formik';
import { c } from 'ttag';

import { useGroupMembers } from '@proton/account/groupMembers/hooks';
import { useGroupMemberships } from '@proton/account/groupMemberships/hooks';
import { createGroup, deleteGroup, editGroup } from '@proton/account/groups/actions';
import { addGroupMembersThunk } from '@proton/account/groups/addGroupMember';
import { getIsSystemGroup } from '@proton/account/groups/groupFlags';
import { useGroups } from '@proton/account/groups/hooks';
import { useGroupRoles } from '@proton/account/groups/useGroupRoles';
import { useMembers } from '@proton/account/members/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import Loader from '@proton/components/components/loader/Loader';
import useGroupKeys from '@proton/components/containers/organization/groups/useGroupKeys';
import useApi from '@proton/components/hooks/useApi';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { checkMemberAddressAvailability } from '@proton/shared/lib/api/members';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { EnhancedMember, Group, GroupMember, Organization } from '@proton/shared/lib/interfaces';
import { GroupFlags, GroupPermissions } from '@proton/shared/lib/interfaces';
import { GROUP_MEMBER_PERMISSIONS } from '@proton/shared/lib/interfaces/GroupMember';
import { useFlag } from '@proton/unleash/useFlag';

import canUseGroups from '../canUseGroups';
import useGroupAvailableAddressDomains from '../hooks/useGroupAvailableAddressDomains';
import shouldShowMail from '../shouldShowMail';
import { GROUPS_STATE } from '../types';
import type { GroupFormData, GroupsManagementReturn } from '../types';
import useGroupsProtonMeDomain from '../useGroupsProtonMeDomain';

const INITIAL_FORM_VALUES = (organization?: Organization) => ({
    name: '',
    description: '',
    address: '',
    permissions: shouldShowMail(organization?.PlanName)
        ? GroupPermissions.EveryoneCanSend
        : GroupPermissions.NobodyCanSend,
    members: '',
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
    const { createNotification } = useNotifications();
    const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);
    const selectedGroup = groups?.find((group) => group.ID === selectedGroupId);
    const [uiState, setUiState] = useState<GROUPS_STATE>(GROUPS_STATE.EMPTY);
    const { getMemberPublicKeys } = useGroupKeys();

    const addGroupMembers = async (group: Group, emails: string[]) => {
        try {
            await dispatch(addGroupMembersThunk({ group, emails, getMemberPublicKeys }));
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
                flags: GroupFlags.None,
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

        setUiState(GROUPS_STATE.VIEW);

        resetForm();
        setSelectedGroupId(Group.ID);
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


    const isFrozen =
        !canUseGroups(organization.PlanName, {
            isUserGroupsNoCustomDomainEnabled,
            isUserGroupsPassBusinessEnabled,
        }) ||
        (invalidGroupSuggestion && filteredGroups.length > 0);

    return {
        groups: filteredGroups,
        isFrozen,
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
