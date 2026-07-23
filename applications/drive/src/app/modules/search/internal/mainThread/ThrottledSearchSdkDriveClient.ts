import type { NodeEntity, NodeType, ProtonDriveClient } from '@protontech/drive-sdk';

import { SDKEvent } from '@proton/drive';

import { createRollingWindowRateLimiter } from '../../../../utils/createRollingWindowRateLimiter';
import { Logger } from '../shared/Logger';
import type { SdkDriveClient } from './MainThreadBridge';

export type ThrottledSearchSdkDriveClient = {
    client: SdkDriveClient;
    dispose(): void;
};

/**
 * Request quota for background indexing's SDK calls: at most SEARCH_INDEXING_SDK_QUOTA_REQUEST
 * requests per SEARCH_INDEXING_SDK_QUOTA_INTERVAL_MS.
 *
 * This can only be a rough estimate, not an exact count, because:
 *  - the SDK caches some calls internally, so a "request" on our side may never hit the backend
 *  - the SDK batches in both directions: iterating many nodes can be split into several HTTP
 *    requests, while several quick calls can be merged into one
 *
 * Given that, we pick a conservative ballpark number rather than trying to compute an exact
 * budget:
 *  - the server allows roughly 1000 requests / 60s overall
 *  - we reserve well under half of that (400) for search background indexing, leaving headroom
 *    for downloads, uploads, and interactive UI requests sharing the same overall limit
 *
 * Longer term, this quota should be replaced by a shared budget measured at the SDK/HTTP level
 * across all consumers, not approximated per-feature like this.
 *
 * The request-throttled/unthrottled handling below has the same limitation: it isn't coordinated
 * with the other SDK-consuming components (downloads, uploads, UI). Without that coordination,
 * all components can pause together and then resume together, instantly recreating the same
 * SDK-wide quota bottleneck that caused the throttling in the first place.
 *
 * A proper cross-component, lower-level implementation is tracked in DRVWEB-5551:
 * https://protonag.atlassian.net/browse/DRVWEB-5551
 */
export const SEARCH_INDEXING_SDK_QUOTA_REQUEST = 400;
export const SEARCH_INDEXING_SDK_QUOTA_INTERVAL_MS = 60_000;

/**
 * Wraps a drive client so every node-fetch call used by background indexing goes through one
 * request quota, and pauses that quota while the SDK reports it's being throttled server-side.
 */
export function createThrottledSearchSdkDriveClient(
    driveClient: SdkDriveClient & Pick<ProtonDriveClient, 'onMessage'>
): ThrottledSearchSdkDriveClient {
    const rateLimiter = createRollingWindowRateLimiter(
        SEARCH_INDEXING_SDK_QUOTA_REQUEST,
        SEARCH_INDEXING_SDK_QUOTA_INTERVAL_MS
    );

    let needsToLogQuotaReached = true;

    async function acquire(): Promise<void> {
        const usage = rateLimiter.getUsage();
        if (usage.used >= usage.max) {
            if (needsToLogQuotaReached) {
                Logger.warn(`Search background indexing quota reached`);
                needsToLogQuotaReached = false;
            }
        } else if (usage.used < usage.max * 0.8) {
            // Since this is a rolling window, usage can dip just below max and burst right back over it
            // moments later. Resetting this flag as soon as we're under max would still spam the log
            // during bursty traffic near the limit, so instead it only re-arms once usage drops below
            // 80% of max, i.e. once activity has actually slowed down and moved away from the limit.
            // Getting back close to 100% after that is treated as a new event worth logging again.
            needsToLogQuotaReached = true;
        }
        await rateLimiter.acquire();
    }

    const unsubscribeThrottled = driveClient.onMessage(SDKEvent.RequestsThrottled, () => rateLimiter.pause());
    const unsubscribeUnthrottled = driveClient.onMessage(SDKEvent.RequestsUnthrottled, () => rateLimiter.resume());

    const client: SdkDriveClient = {
        async getNode(nodeUid: string): Promise<NodeEntity> {
            await acquire();
            return driveClient.getNode(nodeUid);
        },

        async *iterateFolderChildrenNodeUids(parentNodeUid: string, filterOptions?: { type?: NodeType }) {
            await acquire();
            yield* driveClient.iterateFolderChildrenNodeUids(parentNodeUid, filterOptions);
        },

        async *iterateNodes(uids: string[]) {
            await acquire();
            yield* driveClient.iterateNodes(uids);
        },

        getMyFilesRootFolder(): Promise<NodeEntity> {
            // Not rate-limited: the SDK will probably caches this top-rinternally.
            return driveClient.getMyFilesRootFolder();
        },
    };

    return {
        client,
        dispose(): void {
            unsubscribeThrottled();
            unsubscribeUnthrottled();
        },
    };
}
