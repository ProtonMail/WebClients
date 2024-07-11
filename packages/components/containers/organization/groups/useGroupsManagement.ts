import { useState } from 'react';

import { useGroups } from '@proton/components';
import { Group, Organization } from '@proton/shared/lib/interfaces';

import { GroupsManagementReturn } from './types';

export type GROUPS_STATE = 'empty' | 'view' | 'new' | 'edit';

const useGroupsManagement = (organization?: Organization): GroupsManagementReturn | undefined => {
    const [groups, loadingGroups] = useGroups();
    const [selectedGroup, setSelectedGroup] = useState<Group | undefined>(undefined);
    const [uiState, setUiState] = useState<GROUPS_STATE>('empty');

    if (!organization || loadingGroups || !groups) {
        return undefined;
    }

    return {
        groups,
        selectedGroup,
        uiState,
        setSelectedGroup,
        setUiState,
    };
};

export default useGroupsManagement;
