import type { Domain, Group, GroupMember } from '@proton/shared/lib/interfaces';

import type { GROUPS_STATE } from './useGroupsManagement';

interface DomainData {
    loadingCustomDomains: boolean;
    selectedDomain: string;
    customDomains: Domain[] | undefined;
    setSelectedDomain: (domain: string) => void;
}

export interface GroupsManagementReturn {
    groups: Group[];
    members: any;
    selectedGroup: Group | undefined;
    uiState: string;
    form: any;
    handleSaveGroup: (newEmailsToAdd: string[]) => Promise<void>;
    onDeleteGroup: () => void;
    setSelectedGroup: (group: Group) => void;
    setUiState: (state: GROUPS_STATE) => void;
    loadingGroupMembers: boolean;
    groupMembers: GroupMember[];
    domainData: DomainData;
    suggestedAddressDomainName: string;
    suggestedAddressDomainPart: string;
}
