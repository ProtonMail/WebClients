import type { ReactNode } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { AccessType } from '@proton/shared/lib/authentication/accessType';

export const HideMsp = ({ children }: { children: ReactNode }) => {
    const [user] = useUser();

    if (user.accessType === AccessType.Msp) {
        return null;
    }

    return children;
};
