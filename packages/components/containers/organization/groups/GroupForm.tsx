import ViewGroup from './ViewGroup';
import { GroupsManagementReturn } from './types';

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

    return undefined;
};

export default GroupForm;
