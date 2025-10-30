import { useCallback, useState } from 'react';

import { MemoryCache, ProtonDriveClient, VERSION } from '@protontech/drive-sdk';
import { ProtonDrivePhotosClient } from '@protontech/drive-sdk/dist/protonDrivePhotosClient';
import type { MemoryLogHandler } from '@protontech/drive-sdk/dist/telemetry';
// TODO: Remove that when sdk will be transpile with bun
import 'core-js/actual/array/from-async';

import { useLocalState } from '@proton/components';
import { getClientID } from '@proton/shared/lib/apps/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { getAppVersionHeaders } from '@proton/shared/lib/fetch/headers';

import { LatestEventIdProvider } from './lib/latestEventIdProvider';
import { initOpenPGPCryptoModule } from './lib/openPGPCryptoModule';
import { proxyDriveClientWithEventTracking } from './lib/proxyDriveClientWithEventTracking';
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

export { generateThumbnail } from './lib/thumbnails/thumbnailGenerator';
export type { ThumbnailResult } from './lib/thumbnails/utils';

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
    DriveEvent,
    UploadController,
    Result,
} from '@protontech/drive-sdk';
export type { ProtonDrivePhotosClient } from '@protontech/drive-sdk/dist/protonDrivePhotosClient';

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
    DecryptionError,
    NodeWithSameNameExistsValidationError,
    SDKEvent,
} from '@protontech/drive-sdk';

let driveLatestEventIdProvider: LatestEventIdProvider;
let driveSingleton: ProtonDriveClient;
let driveEntitiesCacheSingleton: MemoryCache<string> | undefined;

let photosLatestEventIdProvider: LatestEventIdProvider;
let photosSingleton: ProtonDrivePhotosClient;
let photosEntitiesCacheSingleton: MemoryCache<string> | undefined;

let memoryLogHandlerSingleton: MemoryLogHandler | undefined;

/** @deprecated only for transition to sdk */

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

            driveLatestEventIdProvider = new LatestEventIdProvider();
            const driveEntitiesCache = new MemoryCache<string>();
            const driveClient = new ProtonDriveClient({
                httpClient,
                entitiesCache: driveEntitiesCache,
                cryptoCache: new MemoryCache(),
                account,
                openPGPCryptoModule,
                srpModule,
                latestEventIdProvider: driveLatestEventIdProvider,
                config: {
                    baseUrl: `${window.location.host}/api`,
                },
                telemetry,
            });
            driveSingleton = proxyDriveClientWithEventTracking(driveClient, driveLatestEventIdProvider);
            driveEntitiesCacheSingleton = driveEntitiesCache;

            photosLatestEventIdProvider = new LatestEventIdProvider();
            const photosEntitiesCache = new MemoryCache<string>();
            const photosClient = new ProtonDrivePhotosClient({
                httpClient,
                entitiesCache: photosEntitiesCache,
                cryptoCache: new MemoryCache(),
                account,
                openPGPCryptoModule,
                srpModule,
                latestEventIdProvider: photosLatestEventIdProvider,
                config: {
                    baseUrl: `${window.location.host}/api`,
                },
                telemetry,
            });
            photosSingleton = proxyDriveClientWithEventTracking(photosClient, photosLatestEventIdProvider);
            photosEntitiesCacheSingleton = photosEntitiesCache;

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
         * Returns the configured ProtonDrivePhotosClient instance.
         *
         * You must call `configure` before to initialize the client.
         *
         * @deprecated This is an experimental feature that might change without a warning.
         */
        photos: photosSingleton,
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
        /** @deprecated only for transition to sdk */
        unsafeRemoveNodeFromCache: useCallback(async (nodeUid: string) => {
            await driveEntitiesCacheSingleton?.removeEntities([`node-${nodeUid}`]);
            await photosEntitiesCacheSingleton?.removeEntities([`node-${nodeUid}`]);
        }, []),
    };
}

export const getDrive = (): ProtonDriveClient => {
    return driveSingleton;
};
