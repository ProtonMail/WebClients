import { useCallback, useMemo, useState } from 'react';

import { useLocalState } from '@proton/components';
import { MemoryCache, ProtonDriveClient, generateNodeUid } from '@proton/drive-sdk';
import { splitNodeRevisionUid, splitNodeUid } from '@proton/drive-sdk/dist/internal/uids';
import type { MemoryLogHandler } from '@proton/drive-sdk/dist/telemetry';
import { getClientID } from '@proton/shared/lib/apps/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { getAppVersionHeaders } from '@proton/shared/lib/fetch/headers';

import { initOpenPGPCryptoModule } from './lib/openPGPCryptoModule';
import type { UserPlan } from './lib/telemetry';
import { initTelemetry } from './lib/telemetry';
import { useAccount } from './lib/useAccount';
import { useHttpClient } from './lib/useHttpClient';

export type {
    Device,
    MaybeNode,
    MaybeMissingNode,
    NodeEntity,
    DegradedNode,
    MissingNode,
    Revision,
    MetricEvent,
    Thumbnail,
} from '@proton/drive-sdk';
export {
    DeviceType,
    NodeType,
    MemberRole,
    RevisionState,
    MetricContext,
    ThumbnailType,
    ProtonDriveError,
    ValidationError,
    AbortError,
    RateLimitedError,
    ConnectionError,
} from '@proton/drive-sdk';

let driveSingleton: ProtonDriveClient;
let memoryLogHandlerSingleton: MemoryLogHandler | undefined;

/**
 * Provides access to Drive SDK connected to the clients monorepo.
 *
 * Before using the Drive SDK, you must call `configure` function to set up
 * the SDK with the application name, version, and user plan.
 */
export function useDrive() {
    const [appVersionHeaders, setAppVersionHeaders] = useState<[string, string][]>();

    const [debug] = useLocalState(false, 'proton-drive-debug');
    const httpClient = useHttpClient(appVersionHeaders);
    const account = useAccount();
    const openPGPCryptoModule = initOpenPGPCryptoModule();

    /**
     * Configure the Drive SDK with the application.
     *
     * This function should be called once at the start of your application.
     * Second attempt will throw an error.
     *
     * @param options.appName Pass from your app config. Example "proton-drive".
     * @param options.appVersion Pass from your app config. Example "5.0.0".
     * @param options.userPlan Should be "paid" for any paid user, "free" for not paid, and "anonymous" for public access. Keep "unknown" or unset if not known.
     */
    const init = useCallback(
        (options: { appName: APP_NAMES; appVersion: string; userPlan?: UserPlan }) => {
            // eslint-disable-next-line no-console
            console.debug('[drive] Configuring ProtonDriveClient', options);

            if (driveSingleton) {
                throw new Error('ProtonDriveClient is already configured. You can only configure it once.');
            }

            setAppVersionHeaders(
                Object.entries(getAppVersionHeaders(getClientID(options.appName), options.appVersion))
            );

            const { telemetry, memoryLogHandler } = initTelemetry(options.userPlan, debug);

            driveSingleton = new ProtonDriveClient({
                httpClient,
                entitiesCache: new MemoryCache(),
                cryptoCache: new MemoryCache(),
                account,
                openPGPCryptoModule,
                config: {
                    baseUrl: `${window.location.host}/api`,
                },
                telemetry,
            });

            memoryLogHandlerSingleton = memoryLogHandler;
        },
        [setAppVersionHeaders, debug, httpClient, account, openPGPCryptoModule]
    );

    return {
        init,
        /**
         * Returns the configured ProtonDriveClient instance.
         *
         * You must call `configure` before to initialize the client.
         */
        drive: driveSingleton,
        /**
         * Returns the logs from the SDK.
         *
         * Can be used to debug issues or be attached to the user report.
         *
         * Set `proton-drive-debug` local state to `true` to enable debug logs.
         */
        getLogs: useCallback(() => {
            return memoryLogHandlerSingleton?.getLogs() || [];
        }, []),
        /**
         * Internal methods that can be changed or removed anytime.
         */
        internal: useMemo(
            () => ({
                generateNodeUid,
                splitNodeRevisionUid,
                splitNodeUid,
            }),
            []
        ),
    };
}
