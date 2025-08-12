import type { NodeEntity } from '@proton/drive/index';
import { useDrive } from '@proton/drive/index';

import useListNotifications from '../../../store/_actions/useListNotifications';
import { useSdkErrorHandler } from '../../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';

type Item = { uid: string; name: string };

export const useTrashActions = () => {
    const { drive } = useDrive();
    const { handleError } = useSdkErrorHandler();
    const { createTrashedItemsNotifications } = useListNotifications();
    const restoreItems = async (items: Item[]) => {
        const restored: NodeEntity[] = [];
        try {
            const uids = items.map((t) => t.uid);
            for await (const result of drive.restoreNodes(uids)) {
                if (result.ok) {
                    const { node } = getNodeEntity(await drive.getNode(result.uid));
                    restored.push(node);
                }
            }
        } catch (e) {
            handleError(e);
        }
    };

    const trashItems = async (items: Item[]) => {
        const itemsMapped = items.map((d) => ({ ...d, linkId: d.uid }));
        const uids = itemsMapped.map((t) => t.uid);
        const success = [];
        const failure = [];

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

        createTrashedItemsNotifications(itemsMapped, success, failure, () => restoreItems(items));
    };

    return {
        trashItems,
    };
};
