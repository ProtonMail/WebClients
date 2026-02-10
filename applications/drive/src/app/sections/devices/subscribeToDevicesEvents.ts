import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { useDeviceStore } from './devices.store';

export const subscribeToDevicesEvents = () => {
    void getBusDriver().subscribeSdkEventsMyUpdates('devices');

    const unsubscribeFromEvents = getBusDriver().subscribe(BusDriverEventName.ALL, async (event) => {
        const store = useDeviceStore.getState();

        switch (event.type) {
            case BusDriverEventName.RENAMED_DEVICES:
                for (const item of event.items) {
                    store.updateDevice(item.deviceUid, { name: item.newName });
                }
                break;
            case BusDriverEventName.REMOVED_DEVICES:
                for (const uid of event.deviceUids) {
                    store.removeDevice(uid);
                }
                break;
        }
    });

    return () => {
        unsubscribeFromEvents();
        void getBusDriver().unsubscribeSdkEventsMyUpdates('devices');
    };
};
