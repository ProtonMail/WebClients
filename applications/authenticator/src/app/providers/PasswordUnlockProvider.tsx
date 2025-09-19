import type { PropsWithChildren } from 'react';
import { type FC, createContext, useContext } from 'react';

import type { PasswordModalState } from 'proton-authenticator/app/components/Settings/Locks/PasswordModal';
import { PasswordModal } from 'proton-authenticator/app/components/Settings/Locks/PasswordModal';
import { c } from 'ttag';

import { type UseAsyncModalHandle, useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';

type PasswordUnlockContextValue = UseAsyncModalHandle<string, PasswordModalState>;

const PasswordUnlockContext = createContext<PasswordUnlockContextValue>(async () => {});

const getInitialModalState = (): PasswordModalState => ({
    title: c('Title').t`Confirm password`,
});

export const PasswordUnlockProvider: FC<PropsWithChildren> = ({ children }) => {
    const modal = useAsyncModalHandles<string, PasswordModalState>({ getInitialModalState });
    const { handler, abort, resolver, state, key } = modal;

    return (
        <PasswordUnlockContext.Provider value={handler}>
            {children}
            <PasswordModal onSubmit={resolver} onClose={abort} {...state} key={key} />
        </PasswordUnlockContext.Provider>
    );
};

export const usePasswordUnlock = () => useContext(PasswordUnlockContext);
