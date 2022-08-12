import { Dispatch, SetStateAction, createContext, useContext, useState } from 'react';

import { Referral } from '@proton/shared/lib/interfaces';

import useReferralRewardStatus, { UseReferralStatusReducerState } from './hooks/useReferralRewardStatus';
import useReferrals, { UseReferralsReducerState } from './hooks/useReferrals';

interface ReferralProgramContext {
    invitedReferralsState: [Referral[], Dispatch<SetStateAction<Referral[]>>];
    fetchedReferrals: UseReferralsReducerState;
    fetchedReferralStatus: UseReferralStatusReducerState;
}

const referralContext = createContext<ReferralProgramContext | undefined>(undefined);

export const useReferralInvitesContext = () => {
    const context = useContext(referralContext);

    if (context === undefined) {
        throw new Error('Component should be wrapped inside ReferralContextProvider');
    }

    return context;
};

export const ReferralInvitesContextProvider = ({ children }: { children: React.ReactNode }) => {
    const fetchedReferrals = useReferrals();
    const fetchedReferralStatus = useReferralRewardStatus();
    const invitedReferralsState = useState<Referral[]>([]);

    return (
        <referralContext.Provider
            value={{
                fetchedReferrals,
                invitedReferralsState,
                fetchedReferralStatus,
            }}
        >
            {children}
        </referralContext.Provider>
    );
};
