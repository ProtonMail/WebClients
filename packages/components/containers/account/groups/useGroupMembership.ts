import { useEffect, useState } from 'react';

import { useApi } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { getGroupMembership } from '@proton/shared/lib/api/groups';
import type { GroupMemberAddressPendingKey, GroupMembership } from '@proton/shared/lib/interfaces';

export type GROUPS_STATE = 'empty' | 'view' | 'new' | 'edit';

interface MembershipReturn {
    Group: {
        Name: string;
        Address: string;
    };
    State: number;
    ForwardingKeys: GroupMemberAddressPendingKey;
    AddressId: string;
    ID: string;
}

const useGroupMemberships = () => {
    const [groupMemberships, setGroupMemberships] = useState<GroupMembership[]>([]);
    const [loading, withLoading] = useLoading();
    const api = useApi();

    useEffect(() => {
        const fetchGroups = async () => {
            void (await withLoading(
                api(getGroupMembership()).then(({ Memberships }) => {
                    const memberships = (Memberships as MembershipReturn[]).map(
                        ({ Group, State, ForwardingKeys, AddressId, ID }) => ({
                            Name: Group.Name,
                            Address: Group.Address,
                            Status: State === 0 ? 'unanswered' : 'active',
                            Keys: ForwardingKeys,
                            AddressID: AddressId,
                            ID: ID,
                        })
                    );
                    setGroupMemberships(memberships);
                })
            ));
        };
        void fetchGroups();
    }, []);

    return {
        groupMemberships,
        loading,
    };
};

export default useGroupMemberships;
