import EditGroup from './EditGroup';
import ViewGroup from './ViewGroup';
import type { GroupsManagementReturn } from './types';

interface Props {
    groupsManagement: GroupsManagementReturn;
}

const GroupForm = ({ groupsManagement, groupsManagement: { uiState, selectedGroup } }: Props) => {
    if (uiState === 'empty' || selectedGroup === undefined) {
        return;
    }

    if (uiState === 'view') {
        return <ViewGroup groupsManagement={groupsManagement} groupData={selectedGroup} />;
    }

    return <EditGroup groupsManagement={groupsManagement} groupData={selectedGroup} />;
};

export default GroupForm;
