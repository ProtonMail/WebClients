import { type ReactNode, useCallback, useRef } from 'react';

import useIsInboxElectronApp from '../../hooks/useIsInboxElectronApp';
import SessionRecoveryLocalStorageManager from '../account/sessionRecovery/SessionRecoveryLocalStorageManager';
import LocaleInjector from '../app/LocaleInjector';
import ForceRefreshProvider from '../forceRefresh/Provider';
import type { RefreshFn } from '../forceRefresh/context';
import DensityInjector from '../layouts/DensityInjector';
import ModalsChildren from '../modals/Children';
import NotificationsChildren from '../notifications/Children';
import PaymentSwitcher from '../payments/PaymentSwitcher';
import { ThemeInjector } from '../themes/ThemeInjector';
import ElectronBlockedContainer from './ElectronBlockedContainer';
import StorageListener from './StorageListener';

interface Props {
    children: ReactNode;
    noModals?: boolean;
}

const StandardPrivateApp = ({ children, noModals }: Props) => {
    const { isElectronDisabled } = useIsInboxElectronApp();
    const refreshRef = useRef<RefreshFn>(() => {});
    const refresh = useCallback(() => {
        return refreshRef.current();
    }, []);

    if (isElectronDisabled) {
        return <ElectronBlockedContainer />;
    }

    return (
        <PaymentSwitcher>
            <SessionRecoveryLocalStorageManager>
                <ThemeInjector />
                <DensityInjector />
                <NotificationsChildren />
                <LocaleInjector onRerender={refresh} />
                {!noModals && <ModalsChildren />}
                <StorageListener />
                <ForceRefreshProvider ref={refreshRef}>{children}</ForceRefreshProvider>
            </SessionRecoveryLocalStorageManager>
        </PaymentSwitcher>
    );
};

export default StandardPrivateApp;
