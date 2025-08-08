import { sendErrorReport } from '../errorHandling';
import { EnrichedError } from '../errorHandling/EnrichedError';
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

    /**
     * Emits an event to all subscribed listeners for the event type.
     * Errors in individual listeners are caught and logged without stopping other listeners.
     *
     * @param event - The event to emit with type-specific payload
     */
    emit(event: ActionEvent): void {
        const eventListeners = this.listeners.get(event.type) || [];
        const allEventListeners = this.listeners.get(ActionEventName.ALL) || [];

        const allListeners = [...eventListeners, ...allEventListeners];

        for (const listener of allListeners) {
            try {
                listener(event);
            } catch (error) {
                sendErrorReport(new EnrichedError('Error in action event listener', { extra: { event, error } }));
            }
        }
    }

    /**
     * Subscribes a listener to a specific event type.
     *
     * @param eventType - The type of event to listen for
     * @param listener - The callback function to execute when the event is emitted
     * @returns A function that can be called to unsubscribe the listener
     */
    subscribe<K extends keyof ActionEventMap>(eventType: K, listener: (event: ActionEventMap[K]) => void): () => void {
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
        listener: (event: ActionEventMap[K]) => void
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
