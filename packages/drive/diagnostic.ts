import { useState } from 'react';

import { VERSION } from '@protontech/drive-sdk';
import { type Diagnostic, initDiagnostic } from '@protontech/drive-sdk/dist/diagnostic';

import { getClientID } from '@proton/shared/lib/apps/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { getAppVersionHeaders } from '@proton/shared/lib/fetch/headers';

import { initOpenPGPCryptoModule } from './internal/openPGPCryptoModule';
import { useAccount } from './internal/useAccount';
import { useHttpClient } from './internal/useHttpClient';
import { useSrpModule } from './internal/useSrpModule';

export { type Diagnostic, type DiagnosticResult } from '@protontech/drive-sdk/dist/diagnostic';
export { type ExcpectedTreeNode } from '@protontech/drive-sdk/dist/diagnostic/interface';

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
