import EditGroup from './EditGroup';
import ViewGroup from './ViewGroup';
import type { GroupsManagementReturn } from './types';

interface Props {
    groupsManagement: GroupsManagementReturn;
    canOnlyDelete: boolean;
}

const GroupForm = ({ groupsManagement, groupsManagement: { uiState, selectedGroup }, canOnlyDelete }: Props) => {
    if (uiState === 'view' && selectedGroup) {
        return (
            <ViewGroup groupsManagement={groupsManagement} groupData={selectedGroup} canOnlyDelete={canOnlyDelete} />
        );
    }

    if (uiState === 'edit' && selectedGroup) {
        return <EditGroup groupsManagement={groupsManagement} groupData={selectedGroup} />;
    }

    if (uiState === 'new') {
        return <EditGroup groupsManagement={groupsManagement} />;
    }
};

export default GroupForm;
