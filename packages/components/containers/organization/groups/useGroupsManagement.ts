import { useEffect, useMemo, useState } from 'react';

import type { FormikErrors } from 'formik';
import { useFormik } from 'formik';
import { c } from 'ttag';

import { addGroup, removeGroup, updateGroup, updateMembersAfterEdit } from '@proton/account';
import { useGroupMembers } from '@proton/account/groupMembers/hooks';
import { createGroup, editGroup } from '@proton/account/groups/actions';
import { useGetUser } from '@proton/account/user/hooks';
import useKTVerifier from '@proton/components/containers/keyTransparency/useKTVerifier';
import useAddGroupMember from '@proton/components/containers/organization/groups/useAddGroupMember';
import useApi from '@proton/components/hooks/useApi';
import { useCustomDomains } from '@proton/components/hooks/useCustomDomains';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useGroups from '@proton/components/hooks/useGroups';
import { useMembers } from '@proton/components/hooks/useMembers';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useDispatch } from '@proton/redux-shared-store';
import { deleteGroup } from '@proton/shared/lib/api/groups';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { checkMemberAddressAvailability } from '@proton/shared/lib/api/members';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Address, Group, GroupMember, Organization } from '@proton/shared/lib/interfaces';
import { GroupFlags, GroupPermissions } from '@proton/shared/lib/interfaces';

import type { GroupsManagementReturn } from './types';
import usePmMeDomain from './usePmMeDomain';

export type GROUPS_STATE = 'empty' | 'view' | 'new' | 'edit';

type FormValues = {
    name: string;
    description: string;
    address: string;
    permissions: number;
    members: string;
};

export const INITIAL_FORM_VALUES = {
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
    const silentApi = getSilentApi(api);
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [selectedGroup, setSelectedGroup] = useState<Group | undefined>(undefined);
    const [uiState, setUiState] = useState<GROUPS_STATE>('empty');
    const [customDomains, loadingCustomDomains] = useCustomDomains();
    const addGroupMember = useAddGroupMember();
    const pmMeDomain = usePmMeDomain();

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

    const getUser = useGetUser();
    const { keyTransparencyVerify } = useKTVerifier(silentApi, getUser);

    const [groupMembers, loadingGroupMembers] = useGroupMembers(selectedGroup?.ID);

    const transformedGroupMembers: GroupMember[] | undefined =
        groupMembers !== undefined ? Object.values(groupMembers) : [];

    const form = useFormik({
        initialValues: INITIAL_FORM_VALUES,
        onSubmit: () => {},
        validateOnChange: true,
        validateOnMount: false,
        validate: ({ name, address }) => {
            const errors: FormikErrors<FormValues> = {};
            const nameError = requiredValidator(name);
            const addressError = emailValidator(`${address}@${selectedDomain}`);
            if (requiredValidator(name)) {
                errors.name = nameError;
            }
            if (uiState === 'new' && addressError) {
                errors.address = addressError;
            }
            return errors;
        },
    });
    /*
    useEffect(() => {
        void withLoadingGroupMembers(fetchGroupMembers(selectedGroup?.ID));
    }, [selectedGroup]);
    */

    const { resetForm, values: formValues } = form;

    if (!organization || loadingGroups || !groups || !members || !pmMeDomain || !selectedDomain) {
        return undefined;
    }

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
        if (!selectedGroup) {
            return;
        }

        const isNewGroup = uiState === 'new';
        const formEmailAndDomain = `${formValues.address}@${selectedDomain}`;

        if (isNewGroup) {
            // Check address availablity if address changed - not supported when in edit mode yet
            if (selectedGroup?.Address.Email !== formEmailAndDomain) {
                await api(
                    checkMemberAddressAvailability({
                        Local: formValues.address,
                        Domain: selectedDomain,
                    })
                );
            }
        }

        const apiEndpoint = isNewGroup ? createGroup : editGroup;

        const Group = await dispatch(
            apiEndpoint({
                api: silentApi,
                group: {
                    id: selectedGroup.ID,
                    name: formValues.name,
                    email: isNewGroup ? formEmailAndDomain : formValues.address,
                    domain: selectedDomain,
                    description: formValues.description,
                    permissions: formValues.permissions,
                    flags: GroupFlags.None,
                },
                keyTransparencyVerify,
            })
        );

        const addMembersPromises = newEmails.map((email) =>
            addGroupMember({ ID: Group.ID, Address: Group.Address as Address }, email).catch((error) => {
                console.error(`Failed to add recipient ${email}:`, error);
            })
        );
        await Promise.all(addMembersPromises);

        if (isNewGroup) {
            setUiState('view');
            dispatch(addGroup(Group));
        } else {
            dispatch(updateGroup(Group));
            dispatch(updateMembersAfterEdit({ groupId: Group.ID }));
            setUiState('view');
        }

        resetForm();
        setSelectedGroup(Group);
    };

    const domainData = { loadingCustomDomains, selectedDomain, customDomains, setSelectedDomain };

    return {
        groups,
        members,
        selectedGroup,
        uiState,
        form,
        onDeleteGroup,
        handleSaveGroup,
        setSelectedGroup,
        setUiState,
        groupMembers: transformedGroupMembers,
        loadingGroupMembers,
        domainData,
        suggestedAddressDomainName,
        suggestedAddressDomainPart,
    };
};

export default useGroupsManagement;
