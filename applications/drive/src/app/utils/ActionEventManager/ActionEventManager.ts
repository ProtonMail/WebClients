import type { DriveEvent } from '@protontech/drive-sdk';
import type { EventSubscription } from '@protontech/drive-sdk/dist/internal/events/interface';

import { DriveEventType, getDrive } from '@proton/drive';
import { getItem } from '@proton/shared/lib/helpers/storage';

import { sendErrorReport } from '../errorHandling';
import { EnrichedError } from '../errorHandling/EnrichedError';
import { handleSdkError } from '../errorHandling/useSdkErrorHandler';
import {
    type ActionEvent,
    type ActionEventListener,
    type ActionEventMap,
    ActionEventName,
} from './ActionEventManagerTypes';

/**
 * ActionEventManager - A type-safe event bus system for folder actions
 *
 * Provides a centralized way to emit and listen to folder-related actions throughout the application.
 * Each event type has a specific shape that is enforced at compile time.
 *
 * @example
 * // Basic usage with the singleton instance
 * import { getActionEventManager, ActionEventName } from './ActionEventManager';
 *
 * const eventBus = getActionEventManager();
 *
 * // Subscribe to specific events
 * eventBus.subscribe(ActionEventName.TRASH_NODES_OPTIMISTIC, (event) => {
 *    event.uids.forEach((uid) => {
 *        useFolderStore.getState().removeItem(uid);
 *    });
 * });
 *
 * // Subscribe to all events
 * eventBus.subscribe(ActionEventName.ALL, (event) => {
 *     switch (event.type) {
 *         case ActionEventName.TRASH_NODES_OPTIMISTIC:
 *             event.uids.forEach((uid) => {
 *                 useFolderStore.getState().removeItem(uid);
 *             });
 *             break;
 *         case ActionEventName.CREATED_NODES:
 *             event.nodes.forEach((node) => {
 *                 useFolderStore.getState().addNode(node);
 *             });
 *             break;
 *     }
 * });
 *
 * // Later, unsubscribe
 * unsubscribe();
 *
 * // Emit events
 * eventBus.emit({
 *   type: ActionEventName.TRASH_NODES_OPTIMISTIC,
 *   uids: ['123', '456']
 * });
 *
 *
 * @example
 * // Different event types with their specific shapes
 * import { getActionEventManager, ActionEventName } from './ActionEventManager';
 *
 * const eventBus = getActionEventManager();
 *
 * // Trash items event
 * eventBus.emit({
 *   type: ActionEventName.TRASH_NODES_OPTIMISTIC,
 *   uids: ['1', '2']
 * });
 *
 * // Create nodes event
 * eventBus.emit({
 *   type: ActionEventName.CREATED_NODES,
 *   nodes: [getNodeEntity(maybeNode)]
 * });

 */
class ActionEventManager {
    private listeners = new Map<string, ActionEventListener<ActionEvent>[]>();

    private myFilesRootFolderTreeEventScopeId: string | undefined;

    private treeEventSubscriptions = new Map<
        string,
        {
            subscription: Promise<EventSubscription>;
            contexts: Set<string>;
        }
    >();

    private driveEventSubscription:
        | {
              subscription: Promise<EventSubscription>;
              contexts: Set<string>;
          }
        | undefined;

    private debugMode: boolean;

    // TODO: Create an helper to get the value
    constructor() {
        const debugValue = getItem('proton-drive-debug', 'false');
        this.debugMode = debugValue === 'true';
    }

    async emit(event: ActionEvent): Promise<void> {
        const eventListeners = this.listeners.get(event.type) || [];
        const allEventListeners = this.listeners.get(ActionEventName.ALL) || [];

        const allListeners = [...eventListeners, ...allEventListeners];

        // TODO: We need to verify the logic when we will have persisted storage
        await Promise.allSettled(
            allListeners.map(async (listener) => {
                try {
                    await listener(event);
                } catch (error) {
                    sendErrorReport(new EnrichedError('Error in action event listener', { extra: { event, error } }));
                }
            })
        );
    }

    /**
     * Subscribes a listener to a specific event type.
     *
     * @param eventType - The type of event to listen for
     * @param listener - The callback function to execute when the event is emitted
     * @returns A function that can be called to unsubscribe the listener
     */
    subscribe<K extends keyof ActionEventMap>(
        eventType: K,
        listener: (event: ActionEventMap[K]) => Promise<void>
    ): () => void {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        const listeners = this.listeners.get(eventType);
        if (listeners) {
            if (listeners.some((l) => l === listener)) {
                throw new Error(`The same event listener for ${eventType} event has been added twice`);
            }
            listeners.push(listener as ActionEventListener<ActionEvent>);
        }

        return () => this.unsubscribe(eventType, listener);
    }

    /**
     * Unsubscribes a listener from a specific event type.
     * This method is private and should only be called through the function returned by subscribe.
     *
     * @param eventType - The type of event to stop listening for
     * @param listener - The callback function to remove
     */
    private unsubscribe<K extends keyof ActionEventMap>(
        eventType: K,
        listener: (event: ActionEventMap[K]) => Promise<void>
    ): void {
        const eventListeners = this.listeners.get(eventType);
        if (eventListeners) {
            const index = eventListeners.indexOf(listener as ActionEventListener<ActionEvent>);
            if (index > -1) {
                eventListeners.splice(index, 1);
            }
        }
    }

    /**
     * Removes all listeners from all event types.
     * Useful for cleanup in tests or resetting the event bus state.
     */
    clear(): void {
        this.listeners.clear();
    }

    /**
     * Subscribe to my updates sdk events (Basically user main volume events)
     * @param context - A unique context identifier (e.g., 'trashContainer', 'folderView')
     */
    async subscribeSdkEventsMyUpdates(context: string): Promise<void> {
        const drive = getDrive();
        let treeEventScopeId = this.myFilesRootFolderTreeEventScopeId;
        try {
            if (!treeEventScopeId) {
                const rootFolderResult = await drive.getMyFilesRootFolder();
                treeEventScopeId = rootFolderResult.ok
                    ? rootFolderResult.value.treeEventScopeId
                    : rootFolderResult.error.treeEventScopeId;

                this.myFilesRootFolderTreeEventScopeId = treeEventScopeId;
            }
            this.subscribeSdkEventsScope(treeEventScopeId, context);
        } catch (error) {
            handleSdkError(error);
        }
    }

    /**
     * Unsubscribe from  Subscribe to my updates sdk events for a given context
     * Only reset myFilesRootFolderTreeEventScopeId when no contexts remain
     * @param context - The context identifier that was used when subscribing
     */
    async unsubscribeSdkEventsMyUpdates(context: string): Promise<void> {
        if (!this.myFilesRootFolderTreeEventScopeId) {
            console.warn(
                `[ActionEventManager] Trying to unsubscribe to SdkEventsMyUpdates without having the treeEventScopeId for it`,
                { context }
            );
            return;
        }

        await this.unsubscribeSdkEventsScope(this.myFilesRootFolderTreeEventScopeId, context);

        // We only reset in case there is no more subscription to it
        if (!this.treeEventSubscriptions.get(this.myFilesRootFolderTreeEventScopeId)) {
            this.myFilesRootFolderTreeEventScopeId = undefined;
        }
    }

    /**
     * Subscribe to a specific tree event scope with context tracking
     * @param treeEventScopeId - The tree event scope ID to subscribe to
     * @param context - A unique context identifier (e.g., 'trashContainer', 'folderView')
     */
    subscribeSdkEventsScope(treeEventScopeId: string, context: string) {
        const existing = this.treeEventSubscriptions.get(treeEventScopeId);

        if (existing) {
            existing.contexts.add(context);
            if (this.debugMode) {
                // eslint-disable-next-line no-console
                console.debug('[ActionEventManager] Added context to existing SDK scope subscription', {
                    treeEventScopeId,
                    context,
                    totalContexts: existing.contexts.size,
                    allContexts: Array.from(existing.contexts),
                });
            }
            return;
        }

        const drive = getDrive();
        const subscription = drive.subscribeToTreeEvents(treeEventScopeId, async (event: DriveEvent) => {
            await this.handleSdkEvent(event);
        });

        this.treeEventSubscriptions.set(treeEventScopeId, {
            subscription,
            contexts: new Set([context]),
        });

        if (this.debugMode) {
            // eslint-disable-next-line no-console
            console.debug('[ActionEventManager] Subscribed to new SDK scope events', {
                treeEventScopeId,
                context,
                totalScopes: this.treeEventSubscriptions.size,
            });
        }
    }

    /**
     * Unsubscribe from a specific tree event scope for a given context
     * Only disposes the actual subscription when no contexts remain
     * @param treeEventScopeId - The tree event scope ID to unsubscribe from
     * @param context - The context identifier that was used when subscribing
     */
    async unsubscribeSdkEventsScope(treeEventScopeId: string, context: string): Promise<void> {
        const existing = this.treeEventSubscriptions.get(treeEventScopeId);
        if (!existing) {
            console.warn(
                `[ActionEventManager] Trying to unsubscribe to SdkEventsScope without having the treeEventScopeId for it`,
                { treeEventScopeId, context }
            );
            return;
        }

        existing.contexts.delete(context);

        if (existing.contexts.size === 0) {
            await existing.subscription.then(({ dispose }) => dispose());
            this.treeEventSubscriptions.delete(treeEventScopeId);
            if (this.debugMode) {
                // eslint-disable-next-line no-console
                console.debug('[ActionEventManager] Unsubscribed from SDK scope events', {
                    treeEventScopeId,
                    remainingScopes: this.treeEventSubscriptions.size,
                });
            }
        } else if (this.debugMode) {
            // eslint-disable-next-line no-console
            console.debug('[ActionEventManager] Removed context from SDK scope subscription', {
                treeEventScopeId,
                removedContext: context,
                remainingContexts: existing.contexts.size,
                allContexts: Array.from(existing.contexts),
            });
        }
    }

    /**
     * Subscribe to general drive sdk events
     * @param context - A unique context identifier (e.g., 'trashContainer', 'folderView')
     */
    async subscribeSdkDriveEvents(context: string): Promise<void> {
        if (this.driveEventSubscription) {
            this.driveEventSubscription.contexts.add(context);
            if (this.debugMode) {
                // eslint-disable-next-line no-console
                console.debug('[ActionEventManager] Added context to existing SDK drive events subscription', {
                    context,
                    totalContexts: this.driveEventSubscription.contexts.size,
                    allContexts: Array.from(this.driveEventSubscription.contexts),
                });
            }
        } else {
            const drive = getDrive();
            const subscription = drive.subscribeToDriveEvents(async (event: DriveEvent) => {
                await this.handleSdkEvent(event);
            });
            this.driveEventSubscription = {
                subscription,
                contexts: new Set([context]),
            };
            if (this.debugMode) {
                // eslint-disable-next-line no-console
                console.debug('[ActionEventManager] Subscribed to SDK drive events', { context });
            }
        }
    }

    /**
     * Subscribe to general drive sdk events
     * @param context - A unique context identifier (e.g., 'trashContainer', 'folderView')
     */
    async unsubscribeSdkDriveEvents(context: string): Promise<void> {
        const existing = this.driveEventSubscription;
        if (!existing) {
            console.warn(
                `[ActionEventManager] Trying to unsubscribe to general drive sdk event without having the treeEventScopeId for it`,
                { context }
            );
            return;
        }

        existing.contexts.delete(context);

        if (existing.contexts.size === 0) {
            await existing.subscription.then(({ dispose }) => dispose());
            this.driveEventSubscription = undefined;
            if (this.debugMode) {
                // eslint-disable-next-line no-console
                console.debug('[ActionEventManager] Unsubscribed from SDK drive events');
            }
        } else if (this.debugMode) {
            // eslint-disable-next-line no-console
            console.debug('[ActionEventManager] Removed context from SDK drive events subscription', {
                removedContext: context,
                remainingContexts: existing.contexts.size,
                allContexts: Array.from(existing.contexts),
            });
        }
    }

    /**
     * Handle incoming SDK events and emit corresponding ActionEvents
     */
    private async handleSdkEvent(event: DriveEvent): Promise<void> {
        if (this.debugMode) {
            // eslint-disable-next-line no-console
            console.debug('[ActionEventManager] Handling SDK event', {
                eventType: event.type,
                nodeUid: 'nodeUid' in event ? event.nodeUid : undefined,
            });
        }

        try {
            switch (event.type) {
                case DriveEventType.NodeCreated:
                    await this.emit({
                        type: ActionEventName.CREATED_NODES,
                        items: [
                            {
                                uid: event.nodeUid,
                                parentUid: event.parentNodeUid,
                                isTrashed: event.isTrashed,
                                isShared: event.isShared,
                            },
                        ],
                    });
                    break;
                case DriveEventType.NodeUpdated:
                    await this.emit({
                        type: ActionEventName.UPDATED_NODES,
                        items: [
                            {
                                uid: event.nodeUid,
                                parentUid: event.parentNodeUid,
                                isTrashed: event.isTrashed,
                                isShared: event.isShared,
                            },
                        ],
                    });
                    break;
                case DriveEventType.NodeDeleted:
                    await this.emit({
                        type: ActionEventName.DELETED_NODES,
                        uids: [event.nodeUid],
                    });
                    break;
                case DriveEventType.SharedWithMeUpdated:
                    await this.emit({
                        type: ActionEventName.REFRESH_SHARED_WITH_ME,
                    });
                    break;
            }
        } catch (error) {
            sendErrorReport(new EnrichedError('Error handling SDK event', { extra: { event, error } }));
        }
    }
}

let ActionEventManagerInstance: ActionEventManager | null = null;

/**
 * Gets the singleton instance of the ActionEventManager.
 * Creates a new instance if one doesn't exist.
 *
 * @returns The ActionEventManager singleton instance
 */
export function getActionEventManager(): ActionEventManager {
    if (!ActionEventManagerInstance) {
        ActionEventManagerInstance = new ActionEventManager();
    }
    return ActionEventManagerInstance;
}
