import type { ProtonDriveClient } from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import useListNotifications from '../../store/_actions/useListNotifications';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';

type Item = { uid: string; parentUid: string | undefined };
type Drive = Pick<ProtonDriveClient, 'restoreNodes' | 'trashNodes' | 'getNode'>;

export const useTrashActions = () => {
    const { createTrashedItemsNotifications } = useListNotifications();
    const restoreItems = async (drive: Drive, items: Item[]) => {
        const restored = [];
        await getBusDriver().emit({ type: BusDriverEventName.RESTORED_NODES, items }, drive);

        try {
            const uids = items.map((t) => t.uid);
            for await (const result of drive.restoreNodes(uids)) {
                if (result.ok) {
                    restored.push(result.uid);
                }
            }
        } catch (e) {
            handleSdkError(e);
        }
    };

    const trashItems = async (drive: Drive, items: Item[]) => {
        const itemsMap = items.map((d) => ({ ...d, linkId: d.uid }));
        const uids = items.map((d) => d.uid);
        const success = [];
        const failures = [];
        await getBusDriver().emit({ type: BusDriverEventName.TRASHED_NODES, uids }, drive);

        try {
            for await (const result of drive.trashNodes(uids)) {
                if (result.ok) {
                    success.push(result.uid);
                } else {
                    failures.push({ nodeToTrash: result.uid, error: result.error });
                }
            }
        } catch (e) {
            handleSdkError(e);
        }
        createTrashedItemsNotifications(Object.values(itemsMap), success, failures, () => restoreItems(drive, items));
    };

    return {
        trashItems,
    };
};
