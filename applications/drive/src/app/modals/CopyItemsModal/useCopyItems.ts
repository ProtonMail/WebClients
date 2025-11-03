import { useDrive } from '@proton/drive';

import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { handleSdkError } from '../../utils/errorHandling/useSdkErrorHandler';
import { useCopiedItemsNotification } from './useCopiedItemsNotification';

export type CopyModalItem = {
    uid: string;
    name: string;
    linkId: string;
    parentLinkId: string;
    isFile: boolean;
};

export const useCopyItems = () => {
    const { drive } = useDrive();
    const { showCopiedItemsNotifications } = useCopiedItemsNotification();

    const copyItems = async (itemsToCopy: CopyModalItem[], targetFolderUid: string) => {
        const sourceUids = itemsToCopy.map((item) => item.uid);
        const copies = [];
        const errors = [];

        try {
            for await (const result of drive.copyNodes(sourceUids, targetFolderUid)) {
                if (result.ok) {
                    const originalItem = itemsToCopy.find((item) => item.uid === result.uid) as CopyModalItem;
                    copies.push({
                        uid: result.newUid,
                        name: originalItem.name,
                        parentUid: targetFolderUid,
                    });
                } else {
                    errors.push({ error: result.error });
                }
            }
        } catch (error) {
            handleSdkError(error, { extra: { sourceUids, targetFolderUid } });
        }

        await getActionEventManager().emit({ type: ActionEventName.CREATED_NODES, items: copies });
        showCopiedItemsNotifications(copies, errors);
    };

    return copyItems;
};
