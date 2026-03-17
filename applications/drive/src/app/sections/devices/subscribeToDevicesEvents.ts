import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { useDevicesStore } from './useDevices.store';

export const subscribeToDevicesEvents = () => {
    void getBusDriver().subscribeSdkEventsMyUpdates('devices');

    const unsubscribeFromEvents = getBusDriver().subscribe(BusDriverEventName.ALL, async (event) => {
        const store = useDevicesStore.getState();

        switch (event.type) {
            case BusDriverEventName.RENAMED_DEVICES:
                for (const item of event.items) {
                    store.updateItem(item.deviceUid, { name: item.newName });
                }
                break;
            case BusDriverEventName.REMOVED_DEVICES:
                for (const uid of event.deviceUids) {
                    store.removeItem(uid);
                }
                break;
        }
    });

    return () => {
        unsubscribeFromEvents();
        void getBusDriver().unsubscribeSdkEventsMyUpdates('devices');
    };
};
