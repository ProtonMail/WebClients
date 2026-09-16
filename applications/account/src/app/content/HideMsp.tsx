import type { ReactNode } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { SessionAccessTypeFlag } from '@proton/shared/lib/authentication/sessionAccessType';
import { hasBit } from '@proton/shared/lib/helpers/bitset';

export const HideMsp = ({ children }: { children: ReactNode }) => {
    const [user] = useUser();

    if (hasBit(user.accessTypeMask, SessionAccessTypeFlag.OrgAccess)) {
        return null;
    }

    return children;
};
