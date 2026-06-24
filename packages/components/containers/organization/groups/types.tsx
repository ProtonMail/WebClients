import type { useFormik } from 'formik';

import type {
    EnhancedGroup,
    EnhancedMember,
    Group,
    GroupFlags,
    GroupMember,
    GroupPermissions,
    RoleAssignment,
} from '@proton/shared/lib/interfaces';

export enum GROUPS_STATE {
    EMPTY = 'empty',
    VIEW = 'view',
    NEW = 'new',
    EDIT = 'edit',
}

interface DomainData {
    selectedDomain: string;
    loading: boolean;
    setSelectedDomain: (domain: string) => void;
}

export interface GroupFormData {
    name: string;
    description: string;
    address: string;
    permissions: GroupPermissions;
    members: string;
    adminRoles: string[];
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
    /** Groups exist but full management is revoked — either the plan no longer supports groups, or the no-custom-domain feature flag was disabled after groups were created. Users can only delete. */
    isFrozen: boolean;
    members: EnhancedMember[];
    selectedGroup: EnhancedGroup | undefined;
    uiState: GROUPS_STATE;
    form: ReturnType<typeof useFormik<GroupFormData>>;
    loadingGroupMembers: boolean;
    groupMembers: GroupMember[];
    domainData: DomainData;
    addressToMemberMap: { [key: string]: EnhancedMember | undefined };
    addressEmailToMemberMap: { [key: string]: EnhancedMember | undefined };
    groupRolesMap: { [groupID: string]: RoleAssignment[] | undefined };
    getSerializedGroup: () =>
        | { type: GROUPS_STATE.NEW | GROUPS_STATE.EDIT; payload: SerializedGroupFormData }
        | undefined;
    actions: {
        onDiscardChanges: () => void;
        onSaveGroup: () => Promise<void>;
        onViewGroup: (group: Group) => void;
        onDeleteGroup: () => void;
        onEditGroup: (group: Group) => void;
        onCreateGroup: () => void;
        onAddGroupMembers: (group: Group, emails: string[]) => Promise<void>;
        onUnselectGroup: () => void;
    };
}
