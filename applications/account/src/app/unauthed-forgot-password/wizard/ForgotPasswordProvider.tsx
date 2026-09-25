import { type ReactNode, createContext, useContext } from 'react';

import type { ProductParam } from '@proton/shared/lib/apps/product';

import type { OnLoginCallback } from '../../content/authSession';

interface ForgotPasswordProps {
    onLogin: OnLoginCallback;
    onPreSubmit: () => Promise<void>;
    onStartAuth: () => Promise<void>;
    productParam: ProductParam;
    setupVPN: boolean;
}

const ForgotPasswordContext = createContext<ForgotPasswordProps | null>(null);

export function ForgotPasswordProvider({ children, ...callbacks }: ForgotPasswordProps & { children: ReactNode }) {
    return <ForgotPasswordContext.Provider value={callbacks}>{children}</ForgotPasswordContext.Provider>;
}

export function useForgotPasswordProps(): ForgotPasswordProps {
    const ctx = useContext(ForgotPasswordContext);
    if (!ctx) {
        throw new Error('useForgotPasswordProps must be used within ForgotPasswordCallbacksProvider');
    }
    return ctx;
}
