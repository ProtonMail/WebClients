import { useEffect, useState } from 'react';

import { useApi } from '@proton/components';
import { serverTime } from '@proton/crypto';
import { useDriveDiagnostics } from '@proton/drive/diagnostic';
import { queryUserSettings } from '@proton/shared/lib/api/drive/user';

import config from '../../config';
import { useSearchLibrary } from '../../store';

export type DeviceState = {
    versions: {
        sdkVersion: string;
        appVersion: string;
    };
    time: {
        currentTime: string;
        timezone: string;
        serverTime: string;
    };
    browser: {
        userAgent: string;
    };
    serviceWorker: {
        available: boolean;
        state: ServiceWorkerState | undefined;
    };
    opfs: {
        available: boolean;
        quota?: number;
        usage?: number;
    };
    search: string;
    api: {
        drive: string;
    };
};

export const useDeviceState = (): DeviceState => {
    const api = useApi();
    const { sdkVersion } = useDriveDiagnostics();
    const { esStatus } = useSearchLibrary();

    const [opfs, setOpfs] = useState<
        | {
              quota?: number;
              usage?: number;
          }
        | undefined
    >(undefined);

    const [apiStatusDrive, setApiStatusDrive] = useState<string | undefined>(undefined);

    useEffect(() => {
        navigator.storage?.estimate().then((estimate) => {
            setOpfs({
                quota: estimate.quota,
                usage: estimate.usage,
            });
        });

        const query = queryUserSettings();
        api({ ...query, silence: true })
            .then(() => {
                setApiStatusDrive('OK');
            })
            .catch((error) => {
                setApiStatusDrive(`Error: ${JSON.stringify(error)}`);
            });
    }, []);

    return {
        versions: {
            sdkVersion,
            appVersion: config.APP_VERSION,
        },
        time: {
            currentTime: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            serverTime: serverTime().toISOString(),
        },
        browser: {
            userAgent: navigator.userAgent,
        },
        serviceWorker: {
            available: navigator.serviceWorker !== undefined,
            state: navigator.serviceWorker?.controller?.state,
        },
        opfs: {
            available: navigator.storage !== undefined,
            quota: opfs?.quota,
            usage: opfs?.usage,
        },
        search: esStatus.esEnabled ? 'Enabled' : 'Disabled',
        api: {
            drive: apiStatusDrive ? apiStatusDrive : '...',
        },
    };
};
