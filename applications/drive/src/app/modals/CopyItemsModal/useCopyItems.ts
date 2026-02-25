import { NodeWithSameNameExistsValidationError, useDrive } from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
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
            handleSdkError(error, { showNotification: false, extra: { uidsToDelete, errors } });
        }

        showUndoCopyNotification(deleted, errors);
    };

    const copyItems = async (itemsToCopy: Item[], targetFolderUid: string) => {
        const itemsByUid = Object.fromEntries(itemsToCopy.map((item) => [item.uid, item]));
        const copies: Record<string, { uid: string; name: any; parentUid: string }> = {};
        const errors = [];

        try {
            for await (const result of drive.copyNodes(itemsToCopy, targetFolderUid)) {
                if (result.ok) {
                    copies[result.newUid] = {
                        uid: result.newUid,
                        name: itemsByUid[result.uid].name,
                        parentUid: targetFolderUid,
                    };
                } else {
                    if (result.error instanceof NodeWithSameNameExistsValidationError) {
                        // Try creating file with a different name in case of a conflict
                        const availableName = await drive.getAvailableName(
                            targetFolderUid,
                            itemsByUid[result.uid].name
                        );
                        const { done, value } = await drive
                            .copyNodes([{ uid: result.uid, name: availableName }], targetFolderUid)
                            .next();
                        if (!done) {
                            const conflict = value;
                            if (conflict.ok) {
                                copies[conflict.newUid] = {
                                    uid: conflict.newUid,
                                    name: availableName,
                                    parentUid: targetFolderUid,
                                };
                            } else {
                                errors.push({ error: conflict.error.toString() });
                            }

                            continue;
                        }
                    }
                    errors.push({ error: result.error.toString() });
                }
            }
        } catch (error) {
            handleSdkError(error, { showNotification: false, extra: { itemsToCopy, targetFolderUid, errors } });
        }

        const copiesList = Object.values(copies);
        await getBusDriver().emit({ type: BusDriverEventName.CREATED_NODES, items: copiesList });
        const undoHandler = async () => {
            await undoCopy(copiesList);
        };
        showCopiedItemsNotifications(copiesList, errors, undoHandler);
    };

    return copyItems;
};
