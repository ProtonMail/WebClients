import { Scroll } from '@proton/atoms';

import GroupItem from './GroupItem';
import { GroupsManagementReturn } from './types';

interface Props {
    groupsManagement: GroupsManagementReturn;
}

const GroupList = ({ groupsManagement: { setUiState, setSelectedGroup, groups, selectedGroup } }: Props) => {
    return (
        <>
            <Scroll className="mr-6">
                {groups.map((groupData) => (
                    <GroupItem
                        key={groupData.Address.ID}
                        groupData={groupData}
                        active={groupData.Address.ID === selectedGroup?.ID}
                        onClick={() => {
                            if (groupData.Address.ID) {
                                setSelectedGroup(groupData);
                            }
                            setUiState('view');
                        }}
                    />
                ))}
            </Scroll>
        </>
    );
};

export default GroupList;
