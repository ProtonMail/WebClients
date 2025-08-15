import { useEffect, useMemo, useState } from 'react';

import type { FormikErrors } from 'formik';
import { useFormik } from 'formik';
import { c } from 'ttag';

import { addGroup, removeGroup, updateGroup, updateMembersAfterEdit } from '@proton/account';
import { useCustomDomains } from '@proton/account/domains/hooks';
import { useGroupMembers } from '@proton/account/groupMembers/hooks';
import { createGroup, editGroup } from '@proton/account/groups/actions';
import { addGroupMemberThunk } from '@proton/account/groups/addGroupMember';
import { useGroups } from '@proton/account/groups/hooks';
import { useMembers } from '@proton/account/members/hooks';
import useKTVerifier from '@proton/components/containers/keyTransparency/useKTVerifier';
import useGroupKeys from '@proton/components/containers/organization/groups/useGroupKeys';
import useApi from '@proton/components/hooks/useApi';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useDispatch } from '@proton/redux-shared-store';
import { deleteGroup } from '@proton/shared/lib/api/groups';
import { checkMemberAddressAvailability } from '@proton/shared/lib/api/members';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Address, EnhancedMember, Group, GroupMember, Organization } from '@proton/shared/lib/interfaces';
import { GroupFlags, GroupPermissions } from '@proton/shared/lib/interfaces';

import type { GroupFormData, GroupsManagementReturn } from './types';
import usePmMeDomain from './usePmMeDomain';

export type GROUPS_STATE = 'empty' | 'view' | 'new' | 'edit';

const INITIAL_FORM_VALUES: GroupFormData = {
    name: '',
    description: '',
    address: '',
    permissions: GroupPermissions.EveryoneCanSend,
    members: '',
};

const useGroupsManagement = (organization?: Organization): GroupsManagementReturn | undefined => {
    const handleError = useErrorHandler();
    const [members] = useMembers();
    const [groups, loadingGroups] = useGroups();
    const api = useApi();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [selectedGroup, setSelectedGroup] = useState<Group | undefined>(undefined);
    const [uiState, setUiState] = useState<GROUPS_STATE>('empty');
    const [customDomains, loadingCustomDomains] = useCustomDomains();
    const pmMeDomain = usePmMeDomain();
    const { getMemberPublicKeys } = useGroupKeys();

    const addGroupMember = async (group: { ID: string; Address: Address }, email: string) => {
        try {
            await dispatch(addGroupMemberThunk({ group, email, getMemberPublicKeys }));
        } catch (e: unknown) {
            handleError(e);
        }
    };

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

    const getSuggestedAddressDomainName = () => {
        if (!organization) {
            createNotification({ type: 'error', text: 'Organization data is missing' });
            return '';
        }

        return organization?.DisplayName.toLowerCase().replace(/\s+/g, '');
    };

    const suggestedAddressDomainName = useMemo(getSuggestedAddressDomainName, [organization]);

    const getSuggestedAddressDomainPart = () => {
        if (pmMeDomain === null) {
            return ''; // return empty string to avoid error, this will never be returned in practice
        }

        if (!organization) {
            createNotification({ type: 'error', text: 'Organization data is missing' });
            return pmMeDomain.substring(1);
        }

        const organizationName = organization?.DisplayName.toLowerCase().replace(/\s+/g, '');

        return customDomains && customDomains.length > 0
            ? customDomains[0].DomainName
            : `${organizationName}${pmMeDomain}`;
    };

    const suggestedAddressDomainPart = useMemo(getSuggestedAddressDomainPart, [
        organization,
        customDomains,
        pmMeDomain,
    ]);

    const [selectedDomain, setSelectedDomain] = useState<string | undefined>(undefined);

    useEffect(() => {
        setSelectedDomain(suggestedAddressDomainPart);
    }, [suggestedAddressDomainPart]);

    const createKTVerifier = useKTVerifier();

    const [groupMembers, loadingGroupMembers] = useGroupMembers(selectedGroup?.ID);

    const transformedGroupMembers: GroupMember[] | undefined =
        groupMembers !== undefined ? Object.values(groupMembers) : [];

    const hasDuplicateNameValidator = (name: string): string => {
        return !!groups?.some(({ Name }) => Name === name) ? c('Error').t`Name already exists` : '';
    };

    const form = useFormik({
        initialValues: INITIAL_FORM_VALUES,
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
            if (uiState === 'new' && addressError) {
                errors.address = addressError;
            }
            return errors;
        },
    });

    const { resetForm, values: formValues } = form;

    if (!organization || loadingGroups || !groups || !members || !pmMeDomain || !selectedDomain) {
        return undefined;
    }

    const getSerializedGroup: GroupsManagementReturn['getSerializedGroup'] = () => {
        const allowedTypes = uiState === 'new' || uiState === 'edit';
        if (!allowedTypes) {
            return;
        }
        const email =
            uiState === 'new' && formValues.address ? `${formValues.address}@${selectedDomain}` : formValues.address;
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
            await api(deleteGroup(selectedGroup.ID));
            dispatch(removeGroup(selectedGroup.ID));
            createNotification({ type: 'success', text: c('Info').t`Group deleted` });
            resetForm();
            setSelectedGroup(undefined);
            setUiState('empty');
        } catch (error) {
            handleError(error);
        }
    };

    const handleSaveGroup = async (newEmails: string[]) => {
        const serializedGroup = getSerializedGroup();
        if (!serializedGroup) {
            throw new Error('Unexpected save group state');
        }

        const { type, payload } = serializedGroup;
        const isNewGroup = type === 'new';

        if (isNewGroup) {
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

        const apiEndpoint = isNewGroup ? createGroup : editGroup;

        const { keyTransparencyVerify } = await createKTVerifier();
        const Group = await dispatch(
            apiEndpoint({
                api: api,
                group: payload,
                keyTransparencyVerify,
            })
        );

        if (isNewGroup) {
            dispatch(addGroup(Group));
        } else {
            dispatch(updateGroup(Group));
        }

        const addMembersPromises = newEmails.map((email) =>
            addGroupMember({ ID: Group.ID, Address: Group.Address }, email).catch((error) => {
                console.error(`Failed to add recipient ${email}:`, error);
            })
        );
        await Promise.all(addMembersPromises);

        if (!isNewGroup) {
            dispatch(updateMembersAfterEdit({ groupId: Group.ID }));
        }

        setUiState('view');

        resetForm();
        setSelectedGroup(Group);
    };

    const handleEditGroup = (group: Group) => {
        setUiState('edit');
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
        setSelectedGroup(group);
        setUiState('view');
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

    const handleCreateGroup = () => {
        setUiState('new');
        resetForm({
            values: INITIAL_FORM_VALUES,
        });
        setSelectedGroup(undefined);
    };

    const handleDiscardChanges = () => {
        setUiState(groups.length === 0 ? 'empty' : 'view');
        resetForm({
            values: INITIAL_FORM_VALUES,
        });
    };

    const domainData = { loadingCustomDomains, selectedDomain, customDomains, setSelectedDomain };

    return {
        groups,
        members,
        selectedGroup,
        uiState,
        form,
        groupMembers: transformedGroupMembers,
        addressToMemberMap,
        loadingGroupMembers,
        domainData,
        suggestedAddressDomainName,
        suggestedAddressDomainPart,
        getSerializedGroup,
        actions: {
            onDiscardChanges: handleDiscardChanges,
            onDeleteGroup,
            onEditGroup: handleEditGroup,
            onViewGroup: handleViewGroup,
            onSaveGroup: handleSaveGroup,
            onCreateGroup: handleCreateGroup,
        },
    };
};

export default useGroupsManagement;
