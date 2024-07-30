import { useEffect, useMemo, useState } from 'react';

import { useFormik } from 'formik';

import {
    useApi,
    useCustomDomains,
    useEventManager,
    useGetOrganizationKey,
    useGetUser,
    useGroups,
    useKTVerifier,
    useMembers,
    useNotifications,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import { createGroup, deleteGroup, editGroup } from '@proton/shared/lib/api/groups';
import { checkMemberAddressAvailability } from '@proton/shared/lib/api/members';
import type { Group, Organization } from '@proton/shared/lib/interfaces';
import { GroupFlags, GroupPermissions } from '@proton/shared/lib/interfaces';
import { createGroupAddressKey } from '@proton/shared/lib/keys/groupKeys';

import { addSubdomain } from './helpers';
import type { GroupsManagementReturn } from './types';
import useAddGroupMember from './useAddGroupMember';
import useGroupMembers from './useGroupMembers';
import usePmMeDomain from './usePmMeDomain';

export type GROUPS_STATE = 'empty' | 'view' | 'new' | 'edit';

const useGroupsManagement = (organization?: Organization): GroupsManagementReturn | undefined => {
    const [members] = useMembers();
    const [groups, loadingGroups] = useGroups();
    const [loadingGroupMembers, withLoadingGroupMembers] = useLoading();
    const api = useApi();
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
    const silentApi = <T>(config: any) => api<T>({ ...config, silence: true });
    const { keyTransparencyVerify } = useKTVerifier(silentApi, getUser);

    const getOrganizationKey = useGetOrganizationKey();

    const { fetchGroupMembers, groupMembers, handleReloadGroupMembers, handleDeleteGroupMember } = useGroupMembers();

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

    useEffect(() => {
        void withLoadingGroupMembers(fetchGroupMembers(selectedGroup?.ID));
    }, [selectedGroup]);

    if (!organization || loadingGroups || !groups || !members || !pmMeDomain || !selectedDomain) {
        return undefined;
    }

    const { resetForm, values: formValues } = form;

    const onDeleteGroup = async () => {
        if (selectedGroup !== undefined) {
            await api(deleteGroup(selectedGroup.ID));
            await call();
            resetForm();
            setSelectedGroup(undefined);
            setUiState('empty');
        }
    };

    const handleSaveGroup = async () => {
        if (selectedGroup === undefined) {
            return;
        }

        // Create suggested domain
        if (!customDomains?.some((domain) => domain.DomainName === selectedDomain)) {
            await addSubdomain(api, selectedDomain);
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

        const groupData = {
            Name: formValues.name,
            Email: `${formValues.address}@${selectedDomain}`,
            Description: formValues.description,
            Permissions: formValues.permissions,
            Flags: GroupFlags.None,
        };

        const cachedOrganizationKey = await getOrganizationKey();
        const organizationKey = cachedOrganizationKey?.privateKey;

        if (!organizationKey) {
            throw new Error('Missing organization private key');
        }

        const { Group } = await api(
            uiState === 'new' ? createGroup(groupData) : editGroup(selectedGroup.ID, { ...groupData })
        );
        await call();

        resetForm();
        setUiState('view');
        setSelectedGroup(Group);

        if (uiState === 'new') {
            Group.Address.Keys = await createGroupAddressKey({
                api,
                organizationKey: cachedOrganizationKey,
                address: Group.Address,
                keyTransparencyVerify,
            });
        }

        const memberEmail = formValues.members;
        if (memberEmail) {
            await addGroupMember(Group, memberEmail);
            await fetchGroupMembers(Group.ID);
        }
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
        groupMembers,
        loadingGroupMembers,
        handleReloadGroupMembers,
        handleDeleteGroupMember,
        domainData,
        suggestedAddressDomainName,
        suggestedAddressDomainPart,
    };
};

export default useGroupsManagement;
