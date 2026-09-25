import { type ReactNode, createContext, useContext } from 'react';

import type { APP_NAMES } from '@proton/shared/lib/constants';

import type { Paths } from '../../content/helper';
import type { SignInLayout } from '../components/SignInLayout';
import type { RememberMode } from '../rememberMode';

/** Page-level values the step components need; the flow itself lives in the machine. */
export interface SignInProps {
    layout: SignInLayout;
    /** The compact credentials form, without the sign-up and support links. */
    compactForm: boolean;
    toApp: APP_NAMES | undefined;
    toAppName: string | undefined;
    showContinueTo: boolean | undefined;
    paths: Paths;
    remember: RememberMode;
    testflight: 'vpn' | undefined;
    isPorkbun: boolean;
    /** Shows an API error to the user; opens the abuse modal for disabled accounts. */
    onError: (error: unknown) => void;
}

const SignInPropsContext = createContext<SignInProps | null>(null);

export function SignInProvider({ children, ...props }: SignInProps & { children: ReactNode }) {
    return <SignInPropsContext.Provider value={props}>{children}</SignInPropsContext.Provider>;
}

export function useSignInProps(): SignInProps {
    const ctx = useContext(SignInPropsContext);
    if (!ctx) {
        throw new Error('useSignInProps must be used within SignInProvider');
    }
    return ctx;
}
