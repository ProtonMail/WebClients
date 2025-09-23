import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { useDeviceStore } from './devices.store';

export const subscribeToDevicesEvents = () => {
    void getActionEventManager().subscribeSdkEventsMyUpdates('devices');

    const unsubscribeFromEvents = getActionEventManager().subscribe(ActionEventName.ALL, async (event) => {
        const store = useDeviceStore.getState();

        switch (event.type) {
            case ActionEventName.RENAMED_DEVICES:
                for (const item of event.items) {
                    store.updateDevice(item.deviceUid, { name: item.newName });
                }
                break;
            case ActionEventName.REMOVED_DEVICES:
                for (const uid of event.deviceUids) {
                    store.removeDevice(uid);
                }
                break;
        }
    });

    return () => {
        unsubscribeFromEvents();
        void getActionEventManager().unsubscribeSdkEventsMyUpdates('devices');
    };
};
