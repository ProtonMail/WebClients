import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { MemberRole, type ProtonDriveClient } from '@proton/drive/index';

import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getNodeAncestry } from '../../utils/sdk/getNodeAncestry';
import { getNodeEffectiveRole } from '../../utils/sdk/getNodeEffectiveRole';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';

type SelectedItemsConfig = {
    nodeUid: string;
    parentNodeUid: string | undefined;
};

// Hook to check if some items can be moved into a target folder.
export const useMoveEligibility = (
    selectedItemConfigs: SelectedItemsConfig[],
    targetFolderUid: string | undefined,
    drive: ProtonDriveClient
) => {
    const [isInvalidMove, setIsInvalidMove] = useState(true);
    const [invalidMoveMessage, setInvalidMoveMessage] = useState<string | undefined>();

    useEffect(() => {
        const fn = async () => {
            if (!targetFolderUid) {
                setIsInvalidMove(true);
                setInvalidMoveMessage(c('Info').t`Select a destination folder`);
                return;
            }

            // Check: Moving item to the same location is no-op and invalid.
            const isMovingInSameFolder = selectedItemConfigs.some((item) => item.parentNodeUid === targetFolderUid);
            if (isMovingInSameFolder) {
                setIsInvalidMove(true);
                setInvalidMoveMessage(c('Info').t`Already in this folder`);
                return;
            }

            // Check: Can't move a folder into itself.
            const ancestryNodesResult = await getNodeAncestry(targetFolderUid, drive);
            if (!ancestryNodesResult.ok) {
                handleSdkError(ancestryNodesResult.error, { showNotification: false });
                return;
            }
            const ancestryNodeUids = ancestryNodesResult.value.map((maybeNode) => getNodeEntity(maybeNode).node.uid);
            const selectedItemUids = selectedItemConfigs.map((config) => config.nodeUid);
            const isMovingIntoDescendant = ancestryNodeUids.some((ancestorUid) =>
                selectedItemUids.includes(ancestorUid)
            );

            if (isMovingIntoDescendant) {
                setIsInvalidMove(true);
                setInvalidMoveMessage(c('Info').t`Can't move a folder into itself`);
                return;
            }

            try {
                const targetNode = await drive.getNode(targetFolderUid);
                const targetNodeEntity = getNodeEntity(targetNode).node;
                const targetEffectiveRole = await getNodeEffectiveRole(targetNodeEntity, drive);
                const isReadOnly = targetEffectiveRole === MemberRole.Viewer;

                if (isReadOnly) {
                    setIsInvalidMove(true);
                    setInvalidMoveMessage(c('Info').t`Can't write into folder`);
                    return;
                }
            } catch (e) {
                handleSdkError(e);
                return;
            }

            // Everything's good, this is a valid move target.
            setIsInvalidMove(false);
            setInvalidMoveMessage(undefined);
        };
        void fn();
    }, [selectedItemConfigs, targetFolderUid, drive]);

    return { isInvalidMove, invalidMoveMessage };
};
