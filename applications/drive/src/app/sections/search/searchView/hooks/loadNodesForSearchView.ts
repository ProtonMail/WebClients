import { handleSdkError } from '@proton/drive/legacy/errorHandling';
import {
    getFormattedNodeLocationFromHierarchy,
    getNodeEffectiveRoleFromHierarchy,
    getNodeName,
    isMissingNode,
} from '@proton/drive/modules/nodes';
import type { NodeEntity, ProtonDriveClient } from '@proton/drive/sdk';
import { getDrive } from '@proton/drive/sdk';

import { createDebouncedBuffer } from '../../../../utils/createDebouncedBuffer';
import { getSignatureIssues } from '../../../../utils/sdk/getSignatureIssues';
import type { SearchResultItemUI } from '../../searchView/store';
import { useSearchViewStore } from '../../searchView/store';

const resolveNode = async (node: NodeEntity, drive: ProtonDriveClient): Promise<SearchResultItemUI | null> => {
    // The legacy search library indexes trashed items.
    // We need to filter them out after loading since trash information
    // is only available after fetching the metadata.
    if (node.trashTime) {
        return null;
    }

    // Nodes don't inherit trashTime when their parent folder is trashed,
    // so we must check ancestors.
    const hierarchy = await drive.getNodeHierarchy(node.uid);
    if (hierarchy.some((ancestor) => ancestor.trashTime)) {
        return null;
    }

    const location = await getFormattedNodeLocationFromHierarchy(drive, hierarchy);
    const role = getNodeEffectiveRoleFromHierarchy(hierarchy);

    const signatureResult = getSignatureIssues(node);

    return {
        nodeUid: node.uid,
        parentUid: node.parentUid,
        name: getNodeName(node),
        type: node.type,
        role,
        mediaType: node.mediaType,
        activeRevisionUid: node.activeRevision?.uid,
        size: node.totalStorageSize,
        modificationTime: node.modificationTime || node.creationTime,
        location,
        haveSignatureIssues: !signatureResult.ok,
    };
};

export type LoadNodesResult = {
    hadPartialErrors: boolean;
};

// Stream all nodeUids through iterateNodes in one call. Re-renders the list
// progressively via a debounced buffer as nodes resolve.
export const loadNodesForSearchView = async (
    nodeUids: string[],
    abortSignal: AbortSignal
): Promise<LoadNodesResult> => {
    const drive = getDrive();
    let hadPartialErrors = false;

    const buffer = createDebouncedBuffer<SearchResultItemUI>((items) => {
        useSearchViewStore.getState().addSearchResultItems(items);
    });

    for await (const maybeMissingNode of drive.iterateNodes(nodeUids, abortSignal)) {
        try {
            if (isMissingNode(maybeMissingNode)) {
                continue;
            }
            const item = await resolveNode(maybeMissingNode, drive);
            if (item) {
                buffer.push(item);
            }
        } catch (e) {
            handleSdkError(e, { showNotification: false });
            hadPartialErrors = true;
        }
    }

    buffer.drain();

    return { hadPartialErrors };
};
