import { useDrive } from '@proton/drive/index';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import useListNotifications from '../../store/_actions/useListNotifications';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';

type Item = { uid: string; parentUid: string | undefined };

export const useTrashActions = () => {
    const { drive } = useDrive();
    const { handleError } = useSdkErrorHandler();
    const { createTrashedItemsNotifications } = useListNotifications();
    const restoreItems = async (items: Item[]) => {
        const restored = [];
        await getBusDriver().emit({ type: BusDriverEventName.RESTORED_NODES, items });

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
        const failures = [];
        await getBusDriver().emit({ type: BusDriverEventName.TRASHED_NODES, uids });

        try {
            for await (const result of drive.trashNodes(uids)) {
                if (result.ok) {
                    success.push(result.uid);
                } else {
                    failures.push({ nodeToTrash: result.uid, error: result.error });
                }
            }
        } catch (e) {
            handleError(e);
        }
        createTrashedItemsNotifications(Object.values(itemsMap), success, failures, () => restoreItems(items));
    };

    return {
        trashItems,
    };
};
