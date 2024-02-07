import { ReactNode } from 'react';

import { NotificationsChildren } from '@proton/components/containers';

import { useConfig, useIsInboxElectronApp } from '../../hooks';
import SessionRecoveryLocalStorageManager from '../account/sessionRecovery/SessionRecoveryLocalStorageManager';
import { ContactProvider } from '../contacts';
import { EventNotices } from '../eventManager';
import ForceRefreshProvider from '../forceRefresh/Provider';
import { KeyTransparencyManager } from '../keyTransparency';
import { DensityInjector } from '../layouts';
import { ModalsChildren } from '../modals';
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
