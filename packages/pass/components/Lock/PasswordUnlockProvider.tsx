import { type PropsWithChildren, useMemo } from 'react';
import { type FC, createContext, useContext } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { type UseAsyncModalHandle, useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import { selectExtraPasswordEnabled, selectIsSSO } from '@proton/pass/store/selectors';

import { PasswordModal, type PasswordModalProps } from './PasswordModal';

type PasswordUnlockContextValue = UseAsyncModalHandle<string, PasswordModalProps>;
const PasswordUnlockContext = createContext<PasswordUnlockContextValue>(async () => {});

export const PasswordUnlockProvider: FC<PropsWithChildren> = ({ children }) => {
    const hasExtraPassword = useSelector(selectExtraPasswordEnabled);
    const isSSO = useSelector(selectIsSSO);

    const [message, title, label] = useMemo(() => {
        if (isSSO) {
            return [
                c('Info').t`Please confirm your backup password`,
                c('Title').t`Enter your backup password`,
                c('Label').t`Backup password`,
            ];
        }

        if (hasExtraPassword) {
            return [
                c('Info').t`Please confirm your extra password`,
                c('Title').t`Enter your extra password`,
                c('Label').t`Extra password`,
            ];
        }

        return [c('Info').t`Please confirm your password`, c('Title').t`Enter your password`, c('Label').t`Password`];
    }, [isSSO, hasExtraPassword]);

    const { handler, abort, resolver, state, key } = useAsyncModalHandles<string, PasswordModalProps>({
        getInitialModalState: () => ({
            message,
            submitLabel: c('Action').t`Authenticate`,
            title,
            type: 'current-password',
            label,
            placeholder: label,
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
