import type { ReactNode } from 'react';

import type { User } from '@proton/shared/lib/interfaces';

import { LumoCommonContext } from '../hooks/useLumoCommon';
import { LUMO_USER_TYPE } from '../types';
import { useIsGuest } from './IsGuestProvider';

export interface LumoCommonProps {
    user: User | undefined;
    children: ReactNode;
}

const getUserType = (isGuest: boolean, hasLumo: boolean): LUMO_USER_TYPE => {
    if (isGuest) {
        return LUMO_USER_TYPE.GUEST;
    }
    return hasLumo ? LUMO_USER_TYPE.PAID : LUMO_USER_TYPE.FREE;
};

const LumoCommonProvider = ({ children, user }: LumoCommonProps) => {
    const isGuest = useIsGuest();
    const hasLumo = user ? !!user.NumLumo : false;
    const lumoUserType = getUserType(isGuest, hasLumo);

    return (
        <LumoCommonContext.Provider
            value={{
                lumoUserType,
            }}
        >
            {children}
        </LumoCommonContext.Provider>
    );
};

export default LumoCommonProvider;
