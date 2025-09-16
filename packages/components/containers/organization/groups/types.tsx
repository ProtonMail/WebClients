import type { useFormik } from 'formik';

import type {
    Domain,
    EnhancedMember,
    Group,
    GroupFlags,
    GroupMember,
    GroupPermissions,
} from '@proton/shared/lib/interfaces';

import type { GROUPS_STATE } from './useGroupsManagement';

interface DomainData {
    loadingCustomDomains: boolean;
    selectedDomain: string;
    customDomains: Domain[] | undefined;
    setSelectedDomain: (domain: string) => void;
}

export interface GroupFormData {
    name: string;
    description: string;
    address: string;
    permissions: GroupPermissions;
    members: string;
}

export interface SerializedGroupFormData {
    id: string | undefined;
    name: string;
    email: string;
    domain: string;
    description: string;
    permissions: GroupPermissions;
    flags: GroupFlags;
}

export interface DomainSuggestion {
    domain: string | null;
    source: 'customdomain' | 'group' | 'pm.me' | null;
}

export interface GroupsManagementReturn {
    groups: Group[];
    members: EnhancedMember[];
    selectedGroup: Group | undefined;
    uiState: GROUPS_STATE;
    form: ReturnType<typeof useFormik<GroupFormData>>;
    loadingGroupMembers: boolean;
    groupMembers: GroupMember[];
    domainData: DomainData;
    suggestedAddressDomainName: string;
    suggestedAddressDomainPart: string;
    suggestedAddressDomainSource: 'customdomain' | 'group' | 'pm.me' | null;
    addressToMemberMap: { [key: string]: EnhancedMember | undefined };
    getSerializedGroup: () => { type: 'new' | 'edit'; payload: SerializedGroupFormData } | undefined;
    actions: {
        onDiscardChanges: () => void;
        onSaveGroup: (newEmailsToAdd: string[]) => Promise<void>;
        onViewGroup: (group: Group) => void;
        onDeleteGroup: () => void;
        onEditGroup: (group: Group) => void;
        onCreateGroup: () => void;
    };
}
