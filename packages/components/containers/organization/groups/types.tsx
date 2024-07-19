import type { Domain, Group } from '@proton/shared/lib/interfaces';

import type { GROUPS_STATE } from './useGroupsManagement';

interface DomainData {
    loadingCustomDomains: boolean;
    selectedDomain: string;
    customDomains: Domain[] | undefined;
    setSelectedDomain: (domain: string) => void;
}

export interface GroupsManagementReturn {
    groups: Group[];
    selectedGroup: Group | undefined;
    uiState: string;
    form: any;
    handleSaveGroup: () => Promise<void>;
    setSelectedGroup: (group: Group) => void;
    setUiState: (state: GROUPS_STATE) => void;
    domainData: DomainData;
    getSuggestedAddressDomainName: () => string;
    getSuggestedAddressDomainPart: () => string;
}
