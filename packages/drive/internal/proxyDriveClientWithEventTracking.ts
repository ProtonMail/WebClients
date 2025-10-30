import type { DriveEvent, ProtonDriveClient } from '@protontech/drive-sdk';
import type { ProtonDrivePhotosClient } from '@protontech/drive-sdk/dist/protonDrivePhotosClient';

import type { LatestEventIdProvider } from './latestEventIdProvider';

/**
 * Creates a proxy of ProtonDriveClient with event tracking functionality.
 * The idea here is to handle the logic of saveLatestEventId transparently for the client
 */
export function proxyDriveClientWithEventTracking<T extends ProtonDriveClient | ProtonDrivePhotosClient>(
    client: T,
    latestEventIdProvider: LatestEventIdProvider
): T {
    return new Proxy<T>(client, {
        get(target: T, prop: keyof ProtonDriveClient) {
            switch (prop) {
                case 'subscribeToTreeEvents':
                    return async (treeEventScopeId: string, callback: (event: DriveEvent) => Promise<void>) => {
                        const wrappedCallback = async (event: DriveEvent) => {
                            try {
                                await callback(event);
                            } finally {
                                latestEventIdProvider.saveLatestEventId(event.treeEventScopeId, event.eventId);
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
                case 'subscribeToDriveEvents': {
                    return async (callback: (event: DriveEvent) => Promise<void>) => {
                        let treeEventScopeId: string;
                        const wrappedCallback = async (event: DriveEvent) => {
                            try {
                                await callback(event);
                            } finally {
                                latestEventIdProvider.saveLatestEventId(event.treeEventScopeId, event.eventId);
                                treeEventScopeId = event.treeEventScopeId;
                            }
                        };

                        const subscription = target.subscribeToDriveEvents(wrappedCallback);

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
                default:
                    return Reflect.get(target, prop);
            }
        },
    });
}
