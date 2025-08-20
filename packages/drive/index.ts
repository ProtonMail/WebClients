import { useCallback, useState } from 'react';

import { MemoryCache, ProtonDriveClient, VERSION } from '@protontech/drive-sdk';
import type { MemoryLogHandler } from '@protontech/drive-sdk/dist/telemetry';
// TODO: Remove that when sdk will be transpile with bun
import 'core-js/actual/array/from-async';

import { useLocalState } from '@proton/components';
import { getClientID } from '@proton/shared/lib/apps/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { getAppVersionHeaders } from '@proton/shared/lib/fetch/headers';

import { initOpenPGPCryptoModule } from './lib/openPGPCryptoModule';
import type { UserPlan } from './lib/telemetry';
import { initTelemetry } from './lib/telemetry';
import { useAccount } from './lib/useAccount';
import { useHttpClient } from './lib/useHttpClient';
import { useSrpModule } from './lib/useSrpModule';

export {
    /** @deprecated only for transition to sdk */
    splitInvitationUid,
    /** @deprecated only for transition to sdk */
    splitNodeRevisionUid,
    /** @deprecated only for transition to sdk */
    splitNodeUid,
    /** @deprecated only for transition to sdk */
    splitPublicLinkUid,
} from '@protontech/drive-sdk/dist/internal/uids';

export { generateNodeUid } from '@protontech/drive-sdk';

/* Type export */
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
    ShareResult,
    ProtonInvitation,
    NonProtonInvitation,
    Member,
    ShareNodeSettings,
    Author,
    InvalidNameError,
    ProtonDriveClient,
    ProtonInvitationWithNode,
    MaybeBookmark,
    Bookmark,
    BookmarkOrUid,
} from '@protontech/drive-sdk';

/* Other export */
export {
    DeviceType,
    NodeType,
    MemberRole,
    RevisionState,
    ThumbnailType,
    ProtonDriveError,
    ValidationError,
    AbortError,
    RateLimitedError,
    ConnectionError,
    NonProtonInvitationState,
    DriveEventType,
    ServerError,
} from '@protontech/drive-sdk';

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
    const srpModule = useSrpModule();
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
            console.debug(`[drive] Configuring ProtonDriveClient ${VERSION}`, options);

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
                srpModule,
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
    };
}

export const getDrive = (): ProtonDriveClient => {
    return driveSingleton;
};
