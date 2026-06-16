import type { NodeEntity, Result } from '@protontech/drive-sdk';

type DriveClient = {
    getNode: (uid: string) => Promise<NodeEntity>;
};

export const getNodeAncestry = async (
    nodeUid: string,
    drive: DriveClient,
    includeSelf: boolean = true
): Promise<Result<NodeEntity[], Error>> => {
    const ancestors: NodeEntity[] = [];
    try {
        const node = await drive.getNode(nodeUid);
        let currentNode = node;
        if (includeSelf) {
            ancestors.push(node);
        }
        while (currentNode.parentUid) {
            const parent = await drive.getNode(currentNode.parentUid);
            ancestors.unshift(parent);
            currentNode = parent;
        }
    } catch (e) {
        return { ok: false, error: e as Error };
    }

    return { ok: true, value: ancestors };
};
