import type { ReactNode } from 'react';

import { useSubscription } from '@proton/account/subscription/hooks';
import { hasLumoAddon, hasVisionary } from '@proton/payments';
import type { User } from '@proton/shared/lib/interfaces';

import { LumoCommonContext } from '../hooks/useLumoCommon';
import { LUMO_USER_TYPE } from '../types';
import { useIsGuest } from './IsGuestProvider';

export interface LumoCommonProps {
    user: User | undefined;
    children: ReactNode;
}

const getUserType = (isGuest: boolean, hasLumoSeat: boolean, hasLumoPlusAddon: boolean, isVisionary: boolean): LUMO_USER_TYPE => {
    if (isGuest) {
        return LUMO_USER_TYPE.GUEST;
    }
    return (hasLumoSeat || hasLumoPlusAddon || isVisionary) ? LUMO_USER_TYPE.PAID : LUMO_USER_TYPE.FREE;
};

const GuestLumoCommonProvider = ({ children }: { children: ReactNode }) => {
    const lumoUserType = LUMO_USER_TYPE.GUEST;

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

const AuthenticatedLumoCommonProvider = ({ children, user }: LumoCommonProps) => {
    const [subscription] = useSubscription();

    const hasLumoSeat = user ? !!user.NumLumo : false;
    const hasLumoPlusAddon = subscription ? hasLumoAddon(subscription) : false;
    const isVisionary = subscription ? hasVisionary(subscription) : false;

    const lumoUserType = getUserType(false, hasLumoSeat, hasLumoPlusAddon, isVisionary);

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

const LumoCommonProvider = ({ children, user }: LumoCommonProps) => {
    const isGuest = useIsGuest();

    if (isGuest) {
        return <GuestLumoCommonProvider>{children}</GuestLumoCommonProvider>;
    }

    return <AuthenticatedLumoCommonProvider user={user}>{children}</AuthenticatedLumoCommonProvider>;
};

export default LumoCommonProvider;
