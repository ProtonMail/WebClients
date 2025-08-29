import { c } from 'ttag';

import { type MaybeNode, NodeType } from '@proton/drive';

import { getNodeName } from './getNodeName';
import { isOwnFile } from './isOwnFile';

function getNodeParentUid(node: MaybeNode): string | undefined {
    if (node.ok) {
        return node.value.parentUid;
    }
    return node.error.parentUid;
}

export async function getNodeLocation(
    drive: {
        getNode: (uid: string) => Promise<MaybeNode>;
        getMyFilesRootFolder: () => Promise<MaybeNode>;
    },
    node: MaybeNode
): Promise<string> {
    const nodeType = node.ok ? node.value.type : node.error.type;
    if (nodeType === NodeType.Album) {
        return c('Title').t`Photos`;
    }

    if (!isOwnFile(node)) {
        return c('Title').t`Shared with me`;
    }

    const myFilesRootFolder = await drive.getMyFilesRootFolder();
    const myFilesRootFolderUid = myFilesRootFolder.ok ? myFilesRootFolder.value.uid : myFilesRootFolder.error.uid;

    const location = [];

    try {
        let parentNodeUid = getNodeParentUid(node);
        while (parentNodeUid) {
            const parentNode = await drive.getNode(parentNodeUid);
            parentNodeUid = getNodeParentUid(parentNode);
            if (parentNodeUid) {
                location.push(getNodeName(parentNode));
            } else {
                const nodeUid = parentNode.ok ? parentNode.value.uid : parentNode.error.uid;
                if (nodeUid === myFilesRootFolderUid) {
                    location.push(c('Title').t`My files`);
                } else {
                    // Root of the device includes the device name.
                    location.push(getNodeName(parentNode));
                    location.push(c('Title').t`Devices`);
                }
            }
        }
    } catch (error: unknown) {
        console.error(error);
        return c('Error').t`Unknown location`;
    }

    return `/${location.reverse().join('/')}`;
}
