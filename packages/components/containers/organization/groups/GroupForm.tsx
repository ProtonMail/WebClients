import { c } from 'ttag';

import groupEmptyStateImg from '@proton/styles/assets/img/account/group.svg';

import EditGroupModal from './EditGroupModal';
import ViewGroup from './ViewGroup';
import type { GroupsManagementReturn } from './types';

interface Props {
    groupsManagement: GroupsManagementReturn;
    canOnlyDelete: boolean;
}

const GroupForm = ({ groupsManagement, groupsManagement: { uiState, selectedGroup }, canOnlyDelete }: Props) => {
    if ((uiState === 'view' || uiState === 'edit') && selectedGroup) {
        return (
            <>
                <ViewGroup
                    groupsManagement={groupsManagement}
                    groupData={selectedGroup}
                    canOnlyDelete={canOnlyDelete}
                />
                {uiState === 'edit' && <EditGroupModal groupsManagement={groupsManagement} groupData={selectedGroup} />}
            </>
        );
    }

    if (uiState === 'new') {
        return <EditGroupModal groupsManagement={groupsManagement} />;
    }

    return (
        <div className="flex flex-column items-center justify-center h-full py-8">
            <img src={groupEmptyStateImg} alt="" className="mb-4" />
            <p className="color-weak text-center">{c('Info').t`Select a group to view its members and settings.`}</p>
        </div>
    );
};

export default GroupForm;
