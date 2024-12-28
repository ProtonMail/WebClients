import { type FC, type PropsWithChildren, createContext, useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { type UseAsyncModalHandle, useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import { selectExtraPasswordEnabled } from '@proton/pass/store/selectors';

import type { PasswordModalState } from './PasswordModal';
import { PasswordModal, type PasswordModalProps } from './PasswordModal';

type PasswordUnlockContextValue = UseAsyncModalHandle<string, PasswordModalProps>;
const PasswordUnlockContext = createContext<PasswordUnlockContextValue>(async () => {});

export const PasswordUnlockProvider: FC<PropsWithChildren> = ({ children }) => {
    const hasExtraPassword = useSelector(selectExtraPasswordEnabled);

    const getInitialModalState = useCallback((): PasswordModalState => {
        const { message, title, label } = hasExtraPassword
            ? {
                  label: c('Label').t`Extra password`,
                  message: c('Info').t`Please confirm your extra password`,
                  title: c('Title').t`Enter your extra password`,
              }
            : {
                  label: c('Label').t`Password`,
                  message: c('Info').t`Please confirm your password`,
                  title: c('Title').t`Enter your password`,
              };

        return {
            label,
            message,
            placeholder: label,
            submitLabel: c('Action').t`Authenticate`,
            title,
            type: 'current-password',
        };
    }, [hasExtraPassword]);

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
