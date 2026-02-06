import { useEffect, useState } from 'react';

import { useRequest } from '@proton/pass/hooks/useRequest';
import { groupMembers } from '@proton/pass/store/actions/creators/organization';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';

export const useGroupMembers = (groupId: Maybe<string>) => {
    const [state, setState] = useState<MaybeNull<string[]>>(null);

    const groupMembersAction = useRequest(groupMembers, {
        onSuccess: (data) => setState(data.Members.map((member) => member.Email).filter(truthy)),
        onFailure: () => setState(null),
    });

    useEffect(() => {
        if (groupId) {
            groupMembersAction.dispatch(groupId);
        }
    }, [groupId]);

    return {
        members: state,
        loading: groupMembersAction.loading,
    };
};
