import type { ReactNode, RefCallback } from 'react';
import { createContext, useContext } from 'react';

import type { ChallengeResult } from '@proton/challenge/interface';

interface LoginChallenge {
    /** The username input the challenge observes; the current credentials form attaches it. */
    usernameRef: RefCallback<HTMLInputElement>;
    /** Resolves without a result when the challenge fails, so it never blocks sign-in. */
    getPayload: () => Promise<ChallengeResult>;
}

const LoginChallengeContext = createContext<LoginChallenge | null>(null);

export const LoginChallengeProvider = ({ children, ...challenge }: LoginChallenge & { children: ReactNode }) => (
    <LoginChallengeContext.Provider value={challenge}>{children}</LoginChallengeContext.Provider>
);

export const useLoginChallengeContext = () => {
    const challenge = useContext(LoginChallengeContext);
    if (!challenge) {
        throw new Error('useLoginChallengeContext must be used within LoginChallengeProvider');
    }
    return challenge;
};
