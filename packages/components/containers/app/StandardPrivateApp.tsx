import { type ReactNode, useCallback, useRef } from 'react';

import useConfig from '../../hooks/useConfig';
import useIsInboxElectronApp from '../../hooks/useIsInboxElectronApp';
import SessionRecoveryLocalStorageManager from '../account/sessionRecovery/SessionRecoveryLocalStorageManager';
import LocaleInjector from '../app/LocaleInjector';
import EventNotices from '../eventManager/EventNotices';
import ForceRefreshProvider from '../forceRefresh/Provider';
import type { RefreshFn } from '../forceRefresh/context';
import KeyTransparencyManager from '../keyTransparency/KeyTransparencyManager';
import DensityInjector from '../layouts/DensityInjector';
import ModalsChildren from '../modals/Children';
import NotificationsChildren from '../notifications/Children';
import PaymentSwitcher from '../payments/PaymentSwitcher';
import { ThemeInjector } from '../themes/ThemeInjector';
import ElectronBlockedContainer from './ElectronBlockedContainer';
import KeyBackgroundManager from './KeyBackgroundManager';
import StorageListener from './StorageListener';

interface Props {
    children: ReactNode;
    noModals?: boolean;
    hasPrivateMemberKeyGeneration?: boolean;
    hasReadableMemberKeyActivation?: boolean;
    hasMemberKeyMigration?: boolean;
}

const StandardPrivateApp = ({
    children,
    hasPrivateMemberKeyGeneration,
    hasMemberKeyMigration,
    hasReadableMemberKeyActivation,
    noModals,
}: Props) => {
    const { APP_NAME } = useConfig();
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
            <KeyTransparencyManager appName={APP_NAME}>
                <SessionRecoveryLocalStorageManager>
                    <EventNotices />
                    <ThemeInjector />
                    <DensityInjector />
                    <NotificationsChildren />
                    <LocaleInjector onRerender={refresh} />
                    {!noModals && <ModalsChildren />}
                    <KeyBackgroundManager
                        hasPrivateMemberKeyGeneration={hasPrivateMemberKeyGeneration}
                        hasReadableMemberKeyActivation={hasReadableMemberKeyActivation}
                        hasMemberKeyMigration={hasMemberKeyMigration}
                    />
                    <StorageListener />
                    <ForceRefreshProvider ref={refreshRef}>{children}</ForceRefreshProvider>
                </SessionRecoveryLocalStorageManager>
            </KeyTransparencyManager>
        </PaymentSwitcher>
    );
};

export default StandardPrivateApp;
