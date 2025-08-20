import { useDrive } from '@proton/drive/index';

import useListNotifications from '../../../store/_actions/useListNotifications';
import { getActionEventManager } from '../../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../../utils/ActionEventManager/ActionEventManagerTypes';
import { useSdkErrorHandler } from '../../../utils/errorHandling/useSdkErrorHandler';

type Item = { uid: string; parentUid: string | undefined };

export const useTrashActions = () => {
    const { drive } = useDrive();
    const { handleError } = useSdkErrorHandler();
    const { createTrashedItemsNotifications } = useListNotifications();
    const restoreItems = async (items: Item[]) => {
        const uids = items.map((d) => d.uid);
        const restored = [];
        getActionEventManager().emit({ type: ActionEventName.RESTORED_NODES, uids });

        try {
            const uids = items.map((t) => t.uid);
            for await (const result of drive.restoreNodes(uids)) {
                if (result.ok) {
                    restored.push(result.uid);
                }
            }
        } catch (e) {
            handleError(e);
        }
    };

    const trashItems = async (items: Item[]) => {
        const itemsMap = items.map((d) => ({ ...d, linkId: d.uid }));
        const uids = items.map((d) => d.uid);
        const success = [];
        const failure = [];
        getActionEventManager().emit({ type: ActionEventName.TRASHED_NODES, uids });

        try {
            for await (const result of drive.trashNodes(uids)) {
                if (result.ok) {
                    success.push(result.uid);
                } else {
                    failure.push(result.uid);
                }
            }
        } catch (e) {
            handleError(e);
        }
        createTrashedItemsNotifications(Object.values(itemsMap), success, failure, () => restoreItems(items));
    };

    return {
        trashItems,
    };
};
