import type { BusDriverClient } from '@proton/drive/internal/BusDriver';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getFormattedNodeLocation } from '../../utils/sdk/getNodeLocation';
import { getSignatureIssues } from '../../utils/sdk/getSignatureIssues';
import { trashLogDebug } from './trashLogger';
import { createTrashItem, useTrashStore } from './useTrash.store';

const getNode = async (uid: string, client: BusDriverClient) => {
    try {
        const maybeNode = await client.getNode(uid);
        const location = await getFormattedNodeLocation(client, maybeNode);
        const { node } = getNodeEntity(maybeNode);
        const haveSignatureIssues = !getSignatureIssues(maybeNode).ok;
        return { node, location, haveSignatureIssues };
    } catch (error) {
        handleSdkError(error, { showNotification: false, fallbackMessage: 'Unhandled Error', extra: { uid } });
    }
    return {};
};

export const subscribeToTrashEvents = () => {
    const eventManager = getBusDriver();
    void eventManager.subscribeSdkEventsMyUpdates('trashFiles');
    void eventManager.subscribePhotosEventsMyUpdates('trashPhotos');
    const unsubscribeFromEvents = eventManager.subscribe(BusDriverEventName.ALL, async (event, client) => {
        const store = useTrashStore.getState();
        trashLogDebug('trash event', { type: event.type });
        switch (event.type) {
            case BusDriverEventName.RESTORED_NODES:
                for (const item of event.items) {
                    store.removeItem(item.uid);
                }
                break;
            case BusDriverEventName.TRASHED_NODES:
                for (const uid of event.uids) {
                    const { node, location, haveSignatureIssues } = await getNode(uid, client);
                    if (node) {
                        store.setItem(await createTrashItem(node, location, client, haveSignatureIssues));
                    }
                }
                break;
            case BusDriverEventName.DELETED_NODES:
                for (const uid of event.uids) {
                    store.removeItem(uid);
                }
                break;
        }
    });

    return () => {
        unsubscribeFromEvents();
        void getBusDriver().unsubscribeSdkEventsMyUpdates('trashFiles');
        void getBusDriver().unsubscribePhotosEventsMyUpdates('trashPhotos');
    };
};
