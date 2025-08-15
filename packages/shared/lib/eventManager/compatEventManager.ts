import type { EventManager } from './eventManager';

/**
 * Temporary function to allow backwards compatibility with legacy usage of for example
 * `useEventManager`.
 * NOTE: Subscribe is not supported since the return value of the new event loops
 * is not compatible with the old one.
 */
const createCompatEventManager = <EventResult>({
    eventManagers,
}: {
    eventManagers: EventManager<any>[];
}): EventManager<EventResult> => {
    return {
        // Not supported
        setEventID: () => {},
        // Not supported
        getEventID: () => '',
        start: () => {
            eventManagers.forEach((eventManager) => eventManager.start());
        },
        stop: () => {
            eventManagers.forEach((eventManager) => eventManager.stop());
        },
        call: async () => {
            await Promise.all(eventManagers.map((eventManager) => eventManager.call()));
        },
        reset: () => {
            eventManagers.forEach((eventManager) => eventManager.reset());
        },
        // Not supported
        subscribe: () => {
            return () => {};
        },
    };
};

export default createCompatEventManager;
