import type { ProtonDriveClient } from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { useTrashNotifications } from '../trash/useTrashNotifications';

type Item = { uid: string; parentUid: string | undefined; name: string };
type Drive = Pick<ProtonDriveClient, 'restoreNodes' | 'trashNodes' | 'getNode'>;

export const useTrashActions = () => {
    const { createTrashedItemsNotifications } = useTrashNotifications();
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
        const uids = items.map((d) => d.uid);
        const itemsMap: Record<string, Item> = items.reduce((acc, item) => ({ ...acc, [item.uid]: item }), {});
        const success = [];
        const failures = [];
        await getBusDriver().emit({ type: BusDriverEventName.TRASHED_NODES, uids }, drive);
        try {
            for await (const result of drive.trashNodes(uids)) {
                const item = itemsMap[result.uid];
                if (result.ok) {
                    success.push(item);
                } else {
                    failures.push({ uid: result.uid, error: result.error });
                }
            }
        } catch (e) {
            handleSdkError(e);
        }

        createTrashedItemsNotifications(success, failures, () => restoreItems(drive, items));
    };

    return {
        trashItems,
    };
};
