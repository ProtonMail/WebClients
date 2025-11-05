import { useDrive } from '@proton/drive';

import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { handleSdkError } from '../../utils/errorHandling/useSdkErrorHandler';
import { useCopiedItemsNotification } from './useCopiedItemsNotification';

interface Item {
    uid: string;
    name: string;
}

export const useCopyItems = () => {
    const { drive } = useDrive();
    const { showCopiedItemsNotifications, showUndoCopyNotification } = useCopiedItemsNotification();

    const undoCopy = async (copies: Item[]) => {
        const itemsByUid = Object.fromEntries(copies.map((item) => [item.uid, item]));
        const uidsToDelete = Object.keys(itemsByUid);
        const deleted = [];
        const errors = [];

        try {
            for await (const result of drive.trashNodes(uidsToDelete)) {
                const { uid, ok } = result;
                if (ok) {
                    deleted.push({ uid, name: itemsByUid[uid].name });
                } else {
                    errors.push({ error: result.error });
                }
            }
        } catch (error) {
            handleSdkError(error, { extra: { uidsToDelete, errors } });
        }

        showUndoCopyNotification(deleted, errors);
    };

    const copyItems = async (itemsToCopy: Item[], targetFolderUid: string) => {
        const itemsByUid = Object.fromEntries(itemsToCopy.map((item) => [item.uid, item]));
        const sourceUids = Object.keys(itemsByUid);
        const copies: { uid: string; name: any; parentUid: string }[] = [];
        const errors = [];

        try {
            for await (const result of drive.copyNodes(sourceUids, targetFolderUid)) {
                if (result.ok) {
                    copies.push({
                        uid: result.newUid,
                        name: itemsByUid[result.uid].name,
                        parentUid: targetFolderUid,
                    });
                } else {
                    errors.push({ error: result.error });
                }
            }
        } catch (error) {
            handleSdkError(error, { extra: { sourceUids, targetFolderUid, errors } });
        }

        await getActionEventManager().emit({ type: ActionEventName.CREATED_NODES, items: copies });
        const undoHandler = async () => {
            await undoCopy(copies);
        };
        showCopiedItemsNotifications(copies, errors, undoHandler);
    };

    return copyItems;
};
