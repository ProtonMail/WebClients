import { useCallback, useState } from 'react';

import type { MetricEvent, ProtonDriveCryptoCache, Telemetry } from '@protontech/drive-sdk';
import { MemoryCache, NodeType, ProtonDriveClient, VERSION } from '@protontech/drive-sdk';
import { ProtonDrivePhotosClient } from '@protontech/drive-sdk/dist/protonDrivePhotosClient';
import type { LogHandler, MetricHandler, MetricRecord } from '@protontech/drive-sdk/dist/telemetry';
// TODO: Remove that when sdk will be transpile with bun
import 'core-js/actual/array/from-async';

import useLocalState from '@proton/components/hooks/useLocalState';
import { getClientID } from '@proton/shared/lib/apps/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { getAppVersionHeaders } from '@proton/shared/lib/fetch/headers';

import { getClientUid } from './internal/clientUid';
import { LatestEventIdProvider } from './internal/latestEventIdProvider';
import { initOpenPGPCryptoModule } from './internal/openPGPCryptoModule';
import { proxyDriveClientWithEventTracking } from './internal/proxyDriveClientWithEventTracking';
import type { UserPlan } from './internal/telemetry';
import { initTelemetry } from './internal/telemetry';
import { useAccount } from './internal/useAccount';
import { useHttpClient } from './internal/useHttpClient';
import { useSrpModule } from './internal/useSrpModule';
import { Logging } from './modules/logging';

export {
    /** @deprecated only for transition to sdk */
    makeInvitationUid as generateInvitationUid,
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
    Author,
    Bookmark,
    BookmarkOrUid,
    DegradedNode,
    Device,
    DownloadController,
    DriveEvent,
    InvalidNameError,
    MaybeBookmark,
    MaybeMissingNode,
    MaybeNode,
    Member,
    MetricEvent,
    MissingNode,
    NodeEntity,
    NonProtonInvitation,
    PhotoAttributes,
    PhotoNode,
    ProtonDriveClient,
    ProtonInvitation,
    ProtonInvitationWithNode,
    Result,
    Revision,
    SeekableReadableStream,
    ShareNodeSettings,
    ShareResult,
    Thumbnail,
    UploadController,
} from '@protontech/drive-sdk';
export type { ProtonDrivePhotosClient } from '@protontech/drive-sdk/dist/protonDrivePhotosClient';
export type { ProtonDrivePublicLinkClient } from '@protontech/drive-sdk/dist/protonDrivePublicLinkClient';
export type SDKMetricRecord = MetricRecord<MetricEvent>;

/* Other export */
export {
    AbortError,
    ConnectionError,
    DecryptionError,
    DeviceType,
    DriveEventType,
    MemberRole,
    NodeType,
    NodeWithSameNameExistsValidationError,
    NonProtonInvitationState,
    ProtonDriveError,
    RateLimitedError,
    RevisionState,
    SDKEvent,
    ServerError,
    ThumbnailType,
    ValidationError,
} from '@protontech/drive-sdk';

// Shared config and telemetry for all SDK instances.
let config: { baseUrl: string; clientUid: string } | undefined;
let telemetry: Telemetry<MetricEvent> | undefined;

let driveLatestEventIdProvider: LatestEventIdProvider;
let driveSingleton: ProtonDriveClient;
let driveEntitiesCacheSingleton: MemoryCache<string> | undefined;
let driveCryptoCacheSingleton: ProtonDriveCryptoCache | undefined;

let photosLatestEventIdProvider: LatestEventIdProvider;
let photosSingleton: ProtonDrivePhotosClient;
let photosEntitiesCacheSingleton: MemoryCache<string> | undefined;

let loggingSingleton: (LogHandler & { getLogs: () => string[] }) | undefined;

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
     * @param options.logging A custom logging handler to use instead of the default one. Useful for combining SDK logs with the application logging system.
     * @param options.metricHandler A custom metric handler for ability to react to SDK metric events.
     */
    const init = useCallback(
        (options: {
            appName: APP_NAMES;
            appVersion: string;
            userPlan?: UserPlan;
            logging?: LogHandler & { getLogs: () => string[] };
            metricHandler?: MetricHandler<MetricEvent>;
        }) => {
            const clientUid = getClientUid();
            config = {
                baseUrl: `${window.location.host}/api`,
                clientUid,
            };

            // eslint-disable-next-line no-console
            console.debug(`[drive] Configuring ProtonDriveClient ${VERSION}`, { options, config });

            if (driveSingleton) {
                throw new Error('ProtonDriveClient is already configured. You can only configure it once.');
            }

            setAppVersionHeaders(
                Object.entries(getAppVersionHeaders(getClientID(options.appName), options.appVersion))
            );

            loggingSingleton = options.logging || new Logging({ sentryComponent: 'drive-sdk-log' });
            telemetry = initTelemetry(options.userPlan, loggingSingleton, options.metricHandler, debug);

            driveLatestEventIdProvider = new LatestEventIdProvider();
            driveCryptoCacheSingleton = new MemoryCache();
            driveEntitiesCacheSingleton = new MemoryCache<string>();

            const driveClient = new ProtonDriveClient({
                httpClient,
                entitiesCache: driveEntitiesCacheSingleton,
                cryptoCache: driveCryptoCacheSingleton,
                account,
                openPGPCryptoModule,
                srpModule,
                latestEventIdProvider: driveLatestEventIdProvider,
                config,
                telemetry,
            });
            driveSingleton = proxyDriveClientWithEventTracking(driveClient, driveLatestEventIdProvider);

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
                config,
                telemetry,
            });
            photosSingleton = proxyDriveClientWithEventTracking(photosClient, photosLatestEventIdProvider);
            photosEntitiesCacheSingleton = photosEntitiesCache;
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
            return loggingSingleton?.getLogs() || [];
        }, []),

        /**
         * Internal namespace - Do not use without permission.
         */
        internal: {
            /**
             * Returns the configured ProtonDrivePhotosClient instance.
             *
             * You must call `configure` before to initialize the client.
             *
             * This is an experimental feature that might change without a warning.
             */
            photos: photosSingleton,

            /**
             * Create a dedicated search SDK instance with a customizable LatestEventIdProvider
             * @param params Create
             * @returns
             */
            createSearchDriveInstance: (params: { latestEventIdProvider: LatestEventIdProvider }) => {
                if (!driveEntitiesCacheSingleton) {
                    throw new Error('[createSearchDriveInstance] Entity cache required');
                }
                if (!driveCryptoCacheSingleton) {
                    throw new Error('[createSearchDriveInstance] Crypto cache required');
                }
                if (!config) {
                    throw new Error('[createSearchDriveInstance] SDK config required');
                }
                if (!telemetry) {
                    throw new Error('[createSearchDriveInstance] SDK telemetry required');
                }

                return new ProtonDriveClient({
                    httpClient,
                    entitiesCache: driveEntitiesCacheSingleton,
                    cryptoCache: driveCryptoCacheSingleton,
                    account,
                    openPGPCryptoModule,
                    srpModule,
                    latestEventIdProvider: params.latestEventIdProvider,
                    config: config,
                    telemetry: telemetry,
                });
            },

            /** Only used for transition to sdk */
            unsafeRemoveNodeFromCache: useCallback(async (nodeUid: string) => {
                await driveEntitiesCacheSingleton?.removeEntities([`node-${nodeUid}`]);
                await photosEntitiesCacheSingleton?.removeEntities([`node-${nodeUid}`]);
            }, []),

            /** Temporary function for lumo to be able to clear sdk cache. */
            clearCache: useCallback(async () => {
                await driveEntitiesCacheSingleton?.clear();
            }, []),
        },
    };
}

export function getDrive(): ProtonDriveClient {
    return driveSingleton;
}

export function getDriveForPhotos(): ProtonDrivePhotosClient {
    return photosSingleton;
}

export function getDrivePerNodeType(nodeType: NodeType): ProtonDriveClient | ProtonDrivePhotosClient {
    return nodeType === NodeType.Photo || nodeType === NodeType.Album ? photosSingleton : driveSingleton;
}
