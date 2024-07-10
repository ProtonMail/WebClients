import { GroupFlags, GroupPermissions, Organization } from '@proton/shared/lib/interfaces';

import { GroupsManagementReturn } from './types';

export type GROUPS_STATE = 'empty' | 'view' | 'new' | 'edit';

const useGroupsManagement = (organization?: Organization): GroupsManagementReturn | undefined => {
    // Example group data for demonstration, will be removed
    const groups =
        organization === undefined
            ? []
            : [
                  {
                      ID: '123',
                      Name: 'Employees',
                      Description: 'Test',
                      Address: { Email: 'employees@example.com', ID: '1234' },
                      CreateTime: 123456789,
                      Permissions: GroupPermissions.EveryoneCanSend,
                      Flags: GroupFlags.None,
                      MemberCount: 10,
                  },
              ];

    return {
        groups,
    };
};

export default useGroupsManagement;
