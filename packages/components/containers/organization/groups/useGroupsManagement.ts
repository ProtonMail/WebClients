import { useEffect, useMemo, useState } from 'react';

import { useFormik } from 'formik';

import { useGroupMembers } from '@proton/account/groupMembers/hooks';
import { createGroup, editGroup } from '@proton/account/groups/actions';
import {
    useApi,
    useCustomDomains,
    useEventManager,
    useGetUser,
    useGroups,
    useKTVerifier,
    useMembers,
    useNotifications,
} from '@proton/components';
import { useDispatch } from '@proton/redux-shared-store';
import { deleteGroup } from '@proton/shared/lib/api/groups';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { checkMemberAddressAvailability } from '@proton/shared/lib/api/members';
import type { Address, Group, GroupMember, Organization } from '@proton/shared/lib/interfaces';
import { GroupFlags, GroupPermissions } from '@proton/shared/lib/interfaces';

import type { GroupsManagementReturn } from './types';
import useAddGroupMember from './useAddGroupMember';
import usePmMeDomain from './usePmMeDomain';

export type GROUPS_STATE = 'empty' | 'view' | 'new' | 'edit';

const useGroupsManagement = (organization?: Organization): GroupsManagementReturn | undefined => {
    const [members] = useMembers();
    const [groups, loadingGroups] = useGroups();
    const api = useApi();
    const silentApi = getSilentApi(api);
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [selectedGroup, setSelectedGroup] = useState<Group | undefined>(undefined);
    const [uiState, setUiState] = useState<GROUPS_STATE>('empty');
    const [customDomains, loadingCustomDomains] = useCustomDomains();
    const { call } = useEventManager();
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
        initialValues: {
            name: '',
            description: '',
            address: '',
            permissions: GroupPermissions.NobodyCanSend,
            members: '',
        },
        onSubmit: () => {},
        validateOnChange: false,
        validateOnMount: false,
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
        if (selectedGroup !== undefined) {
            await api(deleteGroup(selectedGroup.ID));
            await call();
            resetForm();
            setSelectedGroup(undefined);
            setUiState('empty');
        }
    };

    const handleSaveGroup = async (newEmails: string[]) => {
        if (selectedGroup === undefined) {
            return;
        }

        // Check address availablity if address changed
        if (selectedGroup?.Address.Email !== `${formValues.address}@${selectedDomain}`) {
            await api(
                checkMemberAddressAvailability({
                    Local: formValues.address,
                    Domain: selectedDomain,
                })
            );
        }

        const apiEndpoint = uiState === 'new' ? createGroup : editGroup;

        const Group = await dispatch(
            apiEndpoint({
                api: silentApi,
                group: {
                    id: selectedGroup.ID,
                    name: formValues.name,
                    email: `${formValues.address}@${selectedDomain}`,
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
        await call();

        resetForm();
        setUiState('view');
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
