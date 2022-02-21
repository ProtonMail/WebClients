import { createContext, useContext, useState, Dispatch, SetStateAction } from 'react';
import { Referral } from '@proton/shared/lib/interfaces';

type ReferralContext = [Referral[], Dispatch<SetStateAction<Referral[]>>];

const referralContext = createContext<ReferralContext | undefined>(undefined);

export const useReferralInvitesContext = () => {
    const context = useContext(referralContext);

    if (context === undefined) {
        throw new Error('Component should be wrapped inside ReferralContextProvider');
    }

    return context;
};

export const ReferralInvitesContextProvider = ({ children }: { children: React.ReactNode }) => {
    const invitedReferralsState = useState<Referral[]>([]);

    return <referralContext.Provider value={invitedReferralsState}>{children}</referralContext.Provider>;
};
