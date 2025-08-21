import type { DriveEvent, ProtonDriveClient } from '@protontech/drive-sdk';

import type { LatestEventIdProvider } from './latestEventIdProvider';

/**
 * Creates a proxy of ProtonDriveClient with event tracking functionality.
 * The idea here is to handle the logic of saveLatestEventId transparently for the client
 */
export function proxyDriveClientWithEventTracking(
    client: ProtonDriveClient,
    latestEventIdProvider: LatestEventIdProvider
): ProtonDriveClient {
    return new Proxy(client, {
        get(target: ProtonDriveClient, prop: string | symbol) {
            if (prop === 'subscribeToTreeEvents') {
                return async (treeEventScopeId: string, callback: (event: DriveEvent) => Promise<void>) => {
                    const wrappedCallback = async (event: DriveEvent) => {
                        try {
                            await callback(event);
                        } finally {
                            latestEventIdProvider.saveLatestEventId(treeEventScopeId, event.eventId);
                        }
                    };

                    const subscription = target.subscribeToTreeEvents(treeEventScopeId, wrappedCallback);

                    return subscription.then(({ dispose }) => {
                        return {
                            dispose: () => {
                                dispose();
                                latestEventIdProvider.removeEventScope(treeEventScopeId);
                            },
                        };
                    });
                };
            }

            return Reflect.get(target, prop);
        },
    });
}
