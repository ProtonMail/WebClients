import type { ReactNode } from 'react';

import { ContactProvider, EventNotices } from '@proton/components';
import NotificationsChildren from '@proton/components/containers/notifications/Children';

import { useConfig, useIsInboxElectronApp } from '../../hooks';
import SessionRecoveryLocalStorageManager from '../account/sessionRecovery/SessionRecoveryLocalStorageManager';
import ForceRefreshProvider from '../forceRefresh/Provider';
import KeyTransparencyManager from '../keyTransparency/KeyTransparencyManager';
import DensityInjector from '../layouts/DensityInjector';
import ModalsChildren from '../modals/Children';
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
    loader: ReactNode;
}

const StandardPrivateApp = ({
    children,
    hasPrivateMemberKeyGeneration,
    hasMemberKeyMigration,
    hasReadableMemberKeyActivation,
    noModals,
    loader,
}: Props) => {
    const { APP_NAME } = useConfig();
    const { isElectronDisabled } = useIsInboxElectronApp();

    if (isElectronDisabled) {
        return <ElectronBlockedContainer />;
    }

    return (
        <PaymentSwitcher loader={loader}>
            <ContactProvider>
                <KeyTransparencyManager appName={APP_NAME}>
                    <SessionRecoveryLocalStorageManager>
                        <EventNotices />
                        <ThemeInjector />
                        <DensityInjector />
                        <NotificationsChildren />
                        {!noModals && <ModalsChildren />}
                        <KeyBackgroundManager
                            hasPrivateMemberKeyGeneration={hasPrivateMemberKeyGeneration}
                            hasReadableMemberKeyActivation={hasReadableMemberKeyActivation}
                            hasMemberKeyMigration={hasMemberKeyMigration}
                        />
                        <StorageListener />
                        <ForceRefreshProvider>{children}</ForceRefreshProvider>
                    </SessionRecoveryLocalStorageManager>
                </KeyTransparencyManager>
            </ContactProvider>
        </PaymentSwitcher>
    );
};

export default StandardPrivateApp;
