import { ReactNode } from 'react';

import { useConfig, useIsInboxElectronApp } from '../../hooks';
import SessionRecoveryLocalStorageManager from '../account/sessionRecovery/SessionRecoveryLocalStorageManager';
import { ContactProvider } from '../contacts';
import { EventNotices } from '../eventManager';
import ForceRefreshProvider from '../forceRefresh/Provider';
import { KeyTransparencyManager } from '../keyTransparency';
import { DensityInjector } from '../layouts';
import { ModalsChildren } from '../modals';
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

    if (isElectronDisabled) {
        return <ElectronBlockedContainer />;
    }

    return (
        <ContactProvider>
            <KeyTransparencyManager appName={APP_NAME}>
                <SessionRecoveryLocalStorageManager>
                    <EventNotices />
                    <ThemeInjector />
                    <DensityInjector />
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
    );
};

export default StandardPrivateApp;
