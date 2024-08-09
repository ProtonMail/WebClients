import type { PropsWithChildren } from 'react';
import { type FC, createContext, useContext } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { type UseAsyncModalHandle, useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import { selectExtraPasswordEnabled } from '@proton/pass/store/selectors';

import { PasswordModal, type PasswordModalProps } from './PasswordModal';

type PasswordUnlockContextValue = UseAsyncModalHandle<string, PasswordModalProps>;
const PasswordUnlockContext = createContext<PasswordUnlockContextValue>(async () => {});

export const PasswordUnlockProvider: FC<PropsWithChildren> = ({ children }) => {
    const hasExtraPassword = useSelector(selectExtraPasswordEnabled);

    const { handler, abort, resolver, state, key } = useAsyncModalHandles<string, PasswordModalProps>({
        getInitialModalState: () => ({
            message: hasExtraPassword
                ? c('Info').t`Please confirm your extra password`
                : c('Info').t`Please confirm your password`,
            submitLabel: c('Action').t`Authenticate`,
            title: hasExtraPassword ? c('Title').t`Enter your extra password` : c('Title').t`Enter your password`,
            type: 'current-password',
            label: hasExtraPassword ? c('Label').t`Extra password` : c('Label').t`Password`,
            placeholder: hasExtraPassword ? c('Label').t`Extra password` : c('Label').t`Password`,
        }),
    });

    return (
        <PasswordUnlockContext.Provider value={handler}>
            {children}
            <PasswordModal onSubmit={resolver} onClose={abort} {...state} key={key} />
        </PasswordUnlockContext.Provider>
    );
};

export const usePasswordUnlock = () => useContext(PasswordUnlockContext);
