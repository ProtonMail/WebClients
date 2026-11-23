import type { ReactNode } from 'react';
import { Suspense, createContext, lazy, useContext, useState } from 'react';

import { useAvailableApps } from '@proton/account/availableApps/hooks';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import type { ProtonDriveClient } from '@proton/drive/sdk';
import { APPS } from '@proton/shared/lib/constants';
import { SentryMailInitiatives } from '@proton/shared/lib/helpers/sentry';
import { MailFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';

// Drive's code (the SDK and its polyfill) must only ever be reached through this import, never statically.
const DriveStarter = lazy(() => import(/* webpackChunkName: "mail-drive-starter" */ './DriveStarter'));

// Null until the Drive client has started, and whenever Save to Drive isn't available.
const MailDriveContext = createContext<ProtonDriveClient | null>(null);

interface MailDrive {
    drive: ProtonDriveClient | null;
    isDriveAvailable: boolean;
}

export const useMailDrive = (): MailDrive => {
    const drive = useContext(MailDriveContext);
    return { drive, isDriveAvailable: drive !== null };
};

interface MailDriveProviderProps {
    children: ReactNode;
}

/**
 * Loads and starts Drive for people with Save to Drive on and Drive in their app list.
 * The starter sits beside Mail rather than around it, so Drive arriving or failing never remounts Mail.
 */
export const MailDriveProvider = ({ children }: MailDriveProviderProps) => {
    const isFlagOn = useFlag(MailFeatureFlag.MailSaveToDrive);
    const availableApps = useAvailableApps();
    const isEnabled = isFlagOn && availableApps.includes(APPS.PROTONDRIVE);

    const [drive, setDrive] = useState<ProtonDriveClient | null>(null);
    // A failed download or start stays failed until the next page load.
    const [hasFailed, setHasFailed] = useState(false);

    const handleError = () => {
        setHasFailed(true);
    };

    return (
        <MailDriveContext.Provider value={isEnabled ? drive : null}>
            {children}
            {isEnabled && !hasFailed && (
                <ErrorBoundary component={null} initiative={SentryMailInitiatives.SAVE_TO_DRIVE} onError={handleError}>
                    <Suspense fallback={null}>
                        <DriveStarter onReady={setDrive} />
                    </Suspense>
                </ErrorBoundary>
            )}
        </MailDriveContext.Provider>
    );
};
