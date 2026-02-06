import { useCallback } from 'react';

import { IcUsers } from '@proton/icons/icons/IcUsers';
import { useOrganizationGroups } from '@proton/pass/components/Organization/OrganizationProvider';
import type { Options } from '@proton/pass/hooks/groups/useGroups';
import type { Maybe } from '@proton/pass/types';

export const useGetMemberOrGroupName = (options?: Options) => {
    const groups = useOrganizationGroups(options);
    return useCallback(
        (email: string, isGroupShare: Maybe<boolean>) => {
            const maybeGroup = groups[email];
            const isGroup = isGroupShare === true || !!maybeGroup;
            const name = maybeGroup?.name ?? email;
            const groupId = maybeGroup?.id;
            const avatar = isGroup ? <IcUsers /> : (email.toUpperCase().slice(0, 2) ?? '');
            return { isGroup, groupId, name, avatar };
        },
        [groups]
    );
};

export const useMemberOrGroupName = (email: string, isGroupShare?: boolean, options?: Options) => {
    const getMemberOrGroupName = useGetMemberOrGroupName(options);
    return getMemberOrGroupName(email, isGroupShare);
};
