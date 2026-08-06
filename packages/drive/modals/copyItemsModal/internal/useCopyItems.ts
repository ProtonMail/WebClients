import { NodeWithSameNameExistsValidationError } from '@protontech/drive-sdk';
import { c } from 'ttag';

import { ProtonDriveError, getDrive, useDrive } from '../../../index';
import { handleSdkError } from '../../../legacy/errorHandling';
import { BusDriverEventName, getBusDriver } from '../../../modules/busDriver';
import { useCopiedItemsNotification } from './useCopiedItemsNotification';

interface Item {
    uid: string;
    name: string;
}

/**
 * A ProtonDriveError message is meant for the user, so it is displayed as is.
 * Any other error is not, so it is reported and a generic message is shown instead.
 */
const getErrorMessage = (error: Error | unknown, extra: {}) => {
    if (error instanceof ProtonDriveError) {
        return error.message;
    }

    handleSdkError(error, { showNotification: false, extra });

    return c('Error').t`Something went wrong, please try again later`;
};

export const useCopyItems = () => {
    const { drive } = useDrive();
    const { showCopiedItemsNotifications, showUndoCopyNotification } = useCopiedItemsNotification();

    const undoCopy = async (copies: Item[]) => {
        const itemsByUid = Object.fromEntries(copies.map((item) => [item.uid, item]));
        const uidsToDelete = Object.keys(itemsByUid);
        const deleted = [];
        const errors: { error: string }[] = [];

        try {
            for await (const result of drive.trashNodes(uidsToDelete)) {
                const { uid, ok } = result;
                if (ok) {
                    deleted.push({ uid, name: itemsByUid[uid].name });
                } else {
                    errors.push({ error: getErrorMessage(result.error, { uid, uidsToDelete }) });
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
        const errors: { error: string }[] = [];

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
                                errors.push({
                                    error: getErrorMessage(conflict.error, { uid: result.uid, targetFolderUid }),
                                });
                            }

                            continue;
                        }
                    }
                    errors.push({ error: getErrorMessage(result.error, { uid: result.uid, targetFolderUid }) });
                }
            }
        } catch (error) {
            handleSdkError(error, {
                showNotification: false,
                extra: { itemsToCopy: itemsToCopy.map((item) => item.uid), targetFolderUid, errors },
            });
        }

        const copiesList = Object.values(copies);
        await getBusDriver().emit(
            {
                type: BusDriverEventName.CREATED_NODES,
                items: copiesList,
            },
            getDrive()
        );
        const undoHandler = async () => {
            await undoCopy(copiesList);
        };
        showCopiedItemsNotifications(copiesList, errors, undoHandler);
    };

    return copyItems;
};
