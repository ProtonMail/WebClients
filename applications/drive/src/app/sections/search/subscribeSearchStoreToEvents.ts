import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { useSearchViewStore } from './store';

export const subscribeSearchStoreToEvents = () => {
    const unsubscribeFromEvents = getBusDriver().subscribe(BusDriverEventName.ALL, async (event) => {
        const store = useSearchViewStore.getState();

        switch (event.type) {
            case BusDriverEventName.UPDATED_NODES:
            case BusDriverEventName.RENAMED_NODES:
            case BusDriverEventName.CREATED_NODES:
            case BusDriverEventName.TRASHED_NODES:
            case BusDriverEventName.MOVED_NODES:
            case BusDriverEventName.DELETED_NODES:
                // Simple and brutal refetch all strategy.
                // TODO: Implement a better store strategy that syncs properly with the search index changes.
                store.markStoreAsDirty(true);
                break;
        }
    });

    return () => {
        unsubscribeFromEvents();
    };
};
