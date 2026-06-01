import { useState } from 'react';

import { getDrive, useDrive } from '../../../index';
import { BusDriverEventName, type NodeEventMeta, getBusDriver } from '../../../internal/BusDriver';
import { handleSdkError } from '../../../legacy/errorHandling';
import { useMovedItemsNotification } from './useMovedItemsNotification';

export type MoveNodeItem = {
    name: string;
    parentUid: string;
};

export type MoveNodesItemMap = Record<string, MoveNodeItem>;

export const useMoveNodes = () => {
    const { drive } = useDrive();
    const { createMovedItemsNotifications } = useMovedItemsNotification();
    const [isLoading, setIsLoading] = useState(false);

    const undoMove = async (itemMap: MoveNodesItemMap) => {
        const successItems = [];
        const failedItems = [];
        const eventItems: NodeEventMeta[] = [];

        // Group UIDs by parent folder so we can batch the move operation
        const uidsByParent = Object.keys(itemMap).reduce(
            (acc, uid) => {
                const parentUid = itemMap[uid].parentUid;
                if (parentUid) {
                    const current = acc[parentUid];
                    acc[parentUid] = current ? [...current, uid] : [uid];
                }
                return acc;
            },
            {} as Record<string, string[]>
        );

        for (const [toFolderUid, uids] of Object.entries(uidsByParent)) {
            try {
                for await (const result of drive.moveNodes(uids, toFolderUid)) {
                    const { uid, ok } = result;
                    if (ok) {
                        successItems.push({ uid: result.uid, name: itemMap[uid].name });
                        eventItems.push({ uid, parentUid: toFolderUid });
                    } else {
                        failedItems.push({ uid: result.uid, error: result.error });
                    }
                }
            } catch (e) {
                handleSdkError(e, { extra: { itemsUId: uids, toFolderUid } });
            }
        }

        await getBusDriver().emit({ type: BusDriverEventName.MOVED_NODES, items: eventItems }, getDrive());
        createMovedItemsNotifications(successItems, failedItems);
    };

    const moveNodes = async (itemMap: MoveNodesItemMap, targetFolderUid: string) => {
        const successItems = [];
        const failedItems = [];
        const eventItems = [];
        const uids = Object.keys(itemMap);

        try {
            setIsLoading(true);
            for await (const result of drive.moveNodes(uids, targetFolderUid)) {
                const { uid, ok } = result;
                if (ok) {
                    successItems.push({ uid: result.uid, name: itemMap[uid]?.name || '' });
                    eventItems.push({ uid, parentUid: targetFolderUid });
                } else {
                    failedItems.push({ uid: result.uid, error: result.error });
                }
            }

            // Only pass successfully moved items to undo function
            const successItemMap = successItems.reduce((acc, item) => {
                acc[item.uid] = itemMap[item.uid];
                return acc;
            }, {} as MoveNodesItemMap);

            const undoFunc = () => undoMove(successItemMap);
            createMovedItemsNotifications(successItems, failedItems, undoFunc);

            await getBusDriver().emit(
                {
                    type: BusDriverEventName.MOVED_NODES,
                    items: eventItems,
                },
                getDrive()
            );
        } catch (e) {
            handleSdkError(e, { extra: { itemsUId: uids, targetFolderUid } });
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        moveNodes,
        isLoading,
    };
};
