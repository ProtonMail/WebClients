import { handleSdkError } from '@proton/drive/legacy/errorHandling';
import { getNodeEntity } from '@proton/drive/legacy/sdkUtils/getNodeEntity';
import type { BusDriverClient } from '@proton/drive/modules/busDriver';
import { BusDriverEventName, getBusDriver } from '@proton/drive/modules/busDriver';
import { getFormattedNodeLocation } from '@proton/drive/modules/nodes';

import { getSignatureIssues } from '../../utils/sdk/getSignatureIssues';
import { trashLogDebug } from './trashLogger';
import { createTrashItem, useTrashStore } from './useTrash.store';

const getNode = async (uid: string, client: BusDriverClient) => {
    try {
        const node = await client.getNode(uid);
        const location = await getFormattedNodeLocation(client, node);
        const { node: normalizedNode } = getNodeEntity(node);
        const haveSignatureIssues = !getSignatureIssues(node).ok;
        return { rawNode: node, node: normalizedNode, location, haveSignatureIssues };
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
                    const { rawNode, node, location, haveSignatureIssues } = await getNode(uid, client);
                    if (rawNode && node) {
                        store.setItem(await createTrashItem(rawNode, node, location, client, haveSignatureIssues));
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
