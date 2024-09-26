import EditGroup from './EditGroup';
import ViewGroup from './ViewGroup';
import type { GroupsManagementReturn } from './types';

interface Props {
    groupsManagement: GroupsManagementReturn;
    canOnlyDelete: boolean;
}

const GroupForm = ({ groupsManagement, groupsManagement: { uiState, selectedGroup }, canOnlyDelete }: Props) => {
    if (uiState === 'empty' || selectedGroup === undefined) {
        return;
    }

    if (uiState === 'view') {
        return (
            <ViewGroup groupsManagement={groupsManagement} groupData={selectedGroup} canOnlyDelete={canOnlyDelete} />
        );
    }

    return <EditGroup groupsManagement={groupsManagement} groupData={selectedGroup} />;
};

export default GroupForm;
