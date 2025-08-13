import { useState } from 'react';

import { VERSION } from '@protontech/drive-sdk';
import { type Diagnostic, initDiagnostic } from '@protontech/drive-sdk/dist/diagnostic';

import { getClientID } from '@proton/shared/lib/apps/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { getAppVersionHeaders } from '@proton/shared/lib/fetch/headers';

import { initOpenPGPCryptoModule } from './lib/openPGPCryptoModule';
import { useAccount } from './lib/useAccount';
import { useHttpClient } from './lib/useHttpClient';
import { useSrpModule } from './lib/useSrpModule';

export { type Diagnostic, type DiagnosticResult } from '@protontech/drive-sdk/dist/diagnostic';

export function useDriveDiagnostics() {
    const [appVersionHeaders, setAppVersionHeaders] = useState<[string, string][]>();

    const httpClient = useHttpClient(appVersionHeaders);
    const account = useAccount();
    const srpModule = useSrpModule();
    const openPGPCryptoModule = initOpenPGPCryptoModule();

    const init = async (options: { appName: APP_NAMES; appVersion: string }): Promise<Diagnostic> => {
        setAppVersionHeaders(Object.entries(getAppVersionHeaders(getClientID(options.appName), options.appVersion)));

        return initDiagnostic({
            httpClient,
            account,
            openPGPCryptoModule,
            srpModule,
            config: {
                baseUrl: `${window.location.host}/api`,
            },
        });
    };

    return {
        init,
        sdkVersion: VERSION,
    };
}
