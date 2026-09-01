import type { ProtonDriveClient } from '@proton/drive';
import { NodeType, getDrive } from '@proton/drive';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';

import { BACKGROUNDS_FOLDER_PATH } from '../constants';
import { isTransientDriveError } from './driveErrors';

const getFolderUidStorageKey = (namespace: string) => `${namespace}.meetBackgroundsFolderUid`;

export const forgetBackgroundsFolderUid = (namespace: string) => {
    removeItem(getFolderUidStorageKey(namespace));
};

const findChildFolderUid = async (
    drive: ProtonDriveClient,
    parentUid: string,
    name: string,
    signal?: AbortSignal
): Promise<string | undefined> => {
    const childUids: string[] = [];

    for await (const uid of drive.iterateFolderChildrenNodeUids(parentUid, { type: NodeType.Folder }, signal)) {
        childUids.push(uid);
    }

    if (!childUids.length) {
        return undefined;
    }

    for await (const node of drive.iterateNodes(childUids, signal)) {
        if (!('missingUid' in node) && node.name.ok && node.name.value === name && !node.trashTime) {
            return node.uid;
        }
    }

    return undefined;
};

interface ResolveParams {
    namespace: string;
    /** Only an upload passes true; a listing must not bring the folder into existence. */
    create: boolean;
    signal?: AbortSignal;
}

/**
 * Resolves `Proton Meet/Backgrounds`. The remembered UID is tried first because it survives
 * rename and move, which the name walk does not.
 */
export const resolveBackgroundsFolderUid = async ({
    namespace,
    create,
    signal,
}: ResolveParams): Promise<string | undefined> => {
    const drive = getDrive();
    const storageKey = getFolderUidStorageKey(namespace);
    const remembered = getItem(storageKey);

    if (remembered) {
        try {
            const node = await drive.getNode(remembered);

            if (node.type === NodeType.Folder && !node.trashTime) {
                return remembered;
            }
        } catch (error) {
            if (isTransientDriveError(error)) {
                throw error;
            }

            // Trashed, deleted, or on a volume we can no longer reach: fall back to the name walk.
        }

        removeItem(storageKey);
    }

    const root = await drive.getMyFilesRootFolder();
    let currentUid = root.uid;

    for (const name of BACKGROUNDS_FOLDER_PATH) {
        const existing = await findChildFolderUid(drive, currentUid, name, signal);

        if (!existing && !create) {
            return undefined;
        }

        currentUid = existing ?? (await drive.createFolder(currentUid, name)).uid;
    }

    setItem(storageKey, currentUid);

    return currentUid;
};
