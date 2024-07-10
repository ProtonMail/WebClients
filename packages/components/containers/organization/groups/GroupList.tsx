import { Scroll } from '@proton/atoms';

import GroupItem from './GroupItem';
import { GroupsManagementReturn } from './types';

interface Props {
    groupsManagement: GroupsManagementReturn;
}

const GroupList = (props: Props) => {
    const { groups } = props.groupsManagement;

    return (
        <>
            <Scroll className="mr-6">
                {groups.map((groupData) => (
                    <GroupItem key={groupData.Address.ID} groupData={groupData} active={true} />
                ))}
            </Scroll>
        </>
    );
};

export default GroupList;
