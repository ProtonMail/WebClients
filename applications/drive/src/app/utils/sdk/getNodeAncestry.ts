import type { MaybeNode, ProtonDriveClient, ProtonDrivePublicLinkClient, Result } from '@proton/drive/index';

const getParentUid = (node: MaybeNode): string | undefined => {
    return node.ok ? node.value.parentUid : node.error.parentUid;
};

const getNodeParent = async (
    maybeNode: MaybeNode,
    drive: ProtonDriveClient | ProtonDrivePublicLinkClient
): Promise<MaybeNode | null> => {
    const parentUid = getParentUid(maybeNode);
    if (!parentUid) {
        return null;
    }
    return drive.getNode(parentUid);
};

export const getNodeAncestry = async (
    nodeUid: string,
    drive: ProtonDriveClient | ProtonDrivePublicLinkClient
): Promise<Result<MaybeNode[], Error>> => {
    const ancestors: MaybeNode[] = [];
    try {
        const maybeNode = await drive.getNode(nodeUid);
        let currentNode = maybeNode;
        ancestors.push(maybeNode);
        while (getParentUid(currentNode)) {
            const parent = await getNodeParent(currentNode, drive);
            if (parent !== null) {
                ancestors.unshift(parent);
                currentNode = parent;
            }
        }
    } catch (e) {
        return { ok: false, error: e as Error };
    }

    return { ok: true, value: ancestors };
};
