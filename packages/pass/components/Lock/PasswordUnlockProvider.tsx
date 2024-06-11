import type { PropsWithChildren } from 'react';
import { type FC, createContext, useContext } from 'react';

import { c } from 'ttag';

import { type UseAsyncModalHandle, useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { PasswordUnlockModal } from './PasswordUnlockModal';

type PasswordConfirmState = { message: string };
type PasswordUnlockContextValue = UseAsyncModalHandle<string, PasswordConfirmState>;

const PasswordUnlockContext = createContext<PasswordUnlockContextValue>(async () => {});

export const PasswordUnlockProvider: FC<PropsWithChildren> = ({ children }) => {
    const { handler, abort, resolver, state } = useAsyncModalHandles<string, PasswordConfirmState>({
        getInitialModalState: () => ({ message: c('Info').t`Please confirm your ${BRAND_NAME} password` }),
    });

    return (
        <PasswordUnlockContext.Provider value={handler}>
            {children}
            <PasswordUnlockModal onSubmit={resolver} onClose={abort} {...state} />
        </PasswordUnlockContext.Provider>
    );
};

export const usePasswordUnlock = () => useContext(PasswordUnlockContext);
