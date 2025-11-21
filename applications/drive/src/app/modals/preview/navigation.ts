export function getNavigation(
    nodeUid: string,
    previewableNodeUids: string[] | undefined,
    onNodeChange: (nodeUid: string) => void
) {
    // Navigation is not supported if client does not provide other nodes to
    // preview, or if there is only one node to preview (e.g. when previewing
    // a single file in a folder), or if the previewed node is not in the list
    // of nodes to preview (e.g. when opening a file preview for a file that
    // has not supported previewing in the browser and thus not in the list).
    if (!previewableNodeUids || previewableNodeUids.length < 2 || !previewableNodeUids.includes(nodeUid)) {
        return undefined;
    }

    return {
        currentPosition: previewableNodeUids.indexOf(nodeUid) + 1,
        totalCount: previewableNodeUids.length,
        loadPrevious: () => {
            const currentIndex = previewableNodeUids.indexOf(nodeUid);
            if (currentIndex > 0) {
                const previousNodeUid = previewableNodeUids[currentIndex - 1];
                onNodeChange(previousNodeUid);
            }
        },
        loadNext: () => {
            const nextNodeUid = previewableNodeUids[previewableNodeUids.indexOf(nodeUid) + 1];
            if (nextNodeUid) {
                onNodeChange(nextNodeUid);
            }
        },
    };
}
