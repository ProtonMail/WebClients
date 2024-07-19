import { useState } from 'react';

import { useFormik } from 'formik';

import {
    useApi,
    useCustomDomains,
    useEventManager,
    useGetOrganizationKey,
    useGetUser,
    useGroups,
    useKTVerifier,
    useNotifications,
} from '@proton/components';
import { createGroup } from '@proton/shared/lib/api/groups';
import type { Group, Organization } from '@proton/shared/lib/interfaces';
import { GroupFlags, GroupPermissions } from '@proton/shared/lib/interfaces';
import { createGroupAddressKey } from '@proton/shared/lib/keys/groupKeys';

import { addSubdomain } from './helpers';
import type { GroupsManagementReturn } from './types';

export type GROUPS_STATE = 'empty' | 'view' | 'new' | 'edit';

const useGroupsManagement = (organization?: Organization): GroupsManagementReturn | undefined => {
    const [groups, loadingGroups] = useGroups();
    const api = useApi();
    const { createNotification } = useNotifications();
    const [selectedGroup, setSelectedGroup] = useState<Group | undefined>(undefined);
    const [uiState, setUiState] = useState<GROUPS_STATE>('empty');
    const [customDomains, loadingCustomDomains] = useCustomDomains();
    const { call } = useEventManager();

    const getSuggestedAddressDomainName = () => {
        if (!organization) {
            createNotification({ type: 'error', text: 'Organization data is missing' });
            return '';
        }

        return organization?.DisplayName.toLowerCase().replace(/\s+/g, '');
    };

    const getSuggestedAddressDomainPart = () => {
        if (!organization) {
            createNotification({ type: 'error', text: 'Organization data is missing' });
            return 'pm.me';
        }

        const organizationName = organization?.DisplayName.toLowerCase().replace(/\s+/g, '');

        return customDomains && customDomains.length > 0 ? customDomains[0].DomainName : `${organizationName}.pm.me`;
    };

    const [selectedDomain, setSelectedDomain] = useState(getSuggestedAddressDomainPart());
    const getUser = useGetUser();
    const silentApi = <T>(config: any) => api<T>({ ...config, silence: true });
    const { keyTransparencyVerify } = useKTVerifier(silentApi, getUser);

    const getOrganizationKey = useGetOrganizationKey();

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

    if (!organization || loadingGroups || !groups) {
        return undefined;
    }

    const { resetForm, values: formValues } = form;

    const handleSaveGroup = async () => {
        if (selectedGroup === undefined) {
            return;
        }

        // Create suggested domain
        if (!customDomains?.some((domain) => domain.DomainName === selectedDomain)) {
            await addSubdomain(api, selectedDomain);
        }

        const groupData = {
            Name: formValues.name,
            Email: `${formValues.address}@${selectedDomain}`,
            Description: formValues.description,
            Permissions: formValues.permissions,
            Flags: GroupFlags.None,
        };

        const { Group } = await api(createGroup(groupData));
        await call();

        const cachedOrganizationKey = await getOrganizationKey();
        const organizationKey = cachedOrganizationKey?.privateKey;

        if (!organizationKey) {
            throw new Error('Missing organization private key');
        }

        Group.Address.Keys = await createGroupAddressKey({
            api,
            organizationKey: cachedOrganizationKey,
            address: Group.Address,
            keyTransparencyVerify,
        });

        resetForm();
        setUiState('view');
        setSelectedGroup(Group);
    };

    const domainData = { loadingCustomDomains, selectedDomain, customDomains, setSelectedDomain };

    return {
        groups,
        selectedGroup,
        uiState,
        form,
        handleSaveGroup,
        setSelectedGroup,
        setUiState,
        domainData,
        getSuggestedAddressDomainName,
        getSuggestedAddressDomainPart,
    };
};

export default useGroupsManagement;
