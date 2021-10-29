import { useEventManager } from '@proton/components';
import { ShareEvent, useDriveEventManager } from '../../components/DriveEventManager/DriveEventManagerProvider';

let lastSubscriptionId: string | undefined;

const useDriveEvents = () => {
    const { getShareEventManager, createShareEventManager, stopListeningForShareEvents } = useDriveEventManager();

    const eventManager = useEventManager();

    const call = (shareId: string) => {
        return getShareEventManager(shareId)?.call();
    };

    const callAll = (shareId: string) => Promise.all([eventManager.call(), call(shareId)]);

    const unsubscribeFromShareEvents = (shareId?: string) => {
        if (!shareId) {
            return;
        }
        stopListeningForShareEvents(shareId);
    };

    const listenForShareEvents = async (
        shareId: string,
        listener: ({ Events }: { Events: ShareEvent[] }) => unknown
    ) => {
        const eventManager = getShareEventManager(shareId);

        if (lastSubscriptionId === shareId) {
            return;
        }

        if (lastSubscriptionId) {
            unsubscribeFromShareEvents(lastSubscriptionId);
        }

        lastSubscriptionId = shareId;
        if (eventManager) {
            eventManager.start();
            eventManager.call().catch(console.warn);

            return;
        }

        const newEventManager = await createShareEventManager(shareId);
        newEventManager.subscribe(listener);
        newEventManager.start();
    };

    return {
        listenForShareEvents,
        call,
        callAll,
    };
};

export default useDriveEvents;
