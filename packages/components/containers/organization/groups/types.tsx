import { Group } from '@proton/shared/lib/interfaces';

import { GROUPS_STATE } from './useGroupsManagement';

export interface GroupsManagementReturn {
    groups: Group[];
    selectedGroup: Group | undefined;
    uiState: string;
    setSelectedGroup: (group: Group) => void;
    setUiState: (state: GROUPS_STATE) => void;
}
