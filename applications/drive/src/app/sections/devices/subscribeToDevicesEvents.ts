import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { useDeviceStore } from './devices.store';

export const subscribeToDevicesEvents = () => {
    void getActionEventManager().subscribeSdkEventsMyUpdates('devices');

    const unsubscribeFromEvents = getActionEventManager().subscribe(ActionEventName.ALL, async (event) => {
        const store = useDeviceStore.getState();

        switch (event.type) {
            case ActionEventName.RENAMED_DEVICES:
                event.items.forEach((item) => {
                    store.updateDevice(item.deviceUid, { name: item.newName });
                });
                break;
            case ActionEventName.REMOVED_DEVICES:
                event.deviceUids.forEach((uid) => {
                    store.removeDevice(uid);
                });
                break;
        }
    });

    return () => {
        unsubscribeFromEvents();
        void getActionEventManager().unsubscribeSdkEventsMyUpdates('devices');
    };
};
