import type { ProtonDriveClient } from '@protontech/drive-sdk';

import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import type { Api } from '@proton/shared/lib/interfaces';

import { startImportTask } from '../../../../api';
import type { DriveImportFolder, LaunchImportPayload } from '../../../../interface';
import { IMPORT_ERROR } from '../../../../interface';

const sanitizeFolderNamePart = (name: string) => name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-');

// We only support google for now
const getDriveImportFolderName = (importedEmail: string) => {
    const accountName = sanitizeFolderNamePart(importedEmail.split('@')[0]);
    return `google-drive-${accountName}`;
};

/**
 * Builds the Drive `ImportFolder` payload for the import start endpoint. The SDK
 * prepares the crypto material for an orphaned folder under My files (no folder is
 * created on the server); the volume and parent link come from the My files root.
 */
const prepareDriveImportFolder = async (
    drive: ProtonDriveClient,
    folderName: string,
    useAvailableName: boolean
): Promise<DriveImportFolder> => {
    // getMyFilesRootFolder creates the main volume if none exists yet (new accounts).
    const rootFolder = await drive.getMyFilesRootFolder();
    const [volumeId, nodeId] = rootFolder.uid.split('~');
    const name = useAvailableName ? await drive.getAvailableName(rootFolder, folderName) : folderName;
    const folder = await drive.experimental.prepareImportFolder(name);

    return {
        VolumeID: volumeId,
        ParentLinkID: nodeId,
        Name: folder.encryptedName,
        Hash: folder.hash,
        NodePassphrase: folder.armoredNodePassphrase,
        NodePassphraseSignature: folder.armoredNodePassphraseSignature,
        NodeKey: folder.armoredKey,
        NodeHashKey: folder.armoredHashKey,
        SignatureAddress: folder.signatureEmail,
        NodePassphraseClearText: folder.base64Passphrase,
        ...(folder.armoredExtendedAttributes !== undefined && { XAttr: folder.armoredExtendedAttributes }),
    };
};

interface StartDriveImportTaskProps {
    api: Api;
    drive: ProtonDriveClient;
    importPayload: LaunchImportPayload;
    importedEmail: string;
    onPrepareFolderError: (error: unknown) => void;
}

/**
 * Starts the import task with a Drive import folder. The folder name is tried first as is;
 * if the backend reports it already exists, the task is retried once with the next available name.
 */
export const startDriveImportTask = async ({
    api,
    drive,
    importPayload,
    importedEmail,
    onPrepareFolderError,
}: StartDriveImportTaskProps) => {
    const folderName = getDriveImportFolderName(importedEmail);

    const withImportFolder = async (useAvailableName: boolean): Promise<LaunchImportPayload> => {
        try {
            return {
                ...importPayload,
                Drive: { ImportFolder: await prepareDriveImportFolder(drive, folderName, useAvailableName) },
            };
        } catch (e) {
            onPrepareFolderError(e);
            throw e;
        }
    };

    try {
        await api({
            ...startImportTask(await withImportFolder(false)),
            silence: [IMPORT_ERROR.ALREADY_EXISTS],
        });
    } catch (e) {
        if (getApiError(e).code !== IMPORT_ERROR.ALREADY_EXISTS) {
            throw e;
        }
        await api(startImportTask(await withImportFolder(true)));
    }
};
