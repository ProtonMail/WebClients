import { useCallback } from 'react';
import { useApi, useCache } from 'react-components';
import {
    DriveFile,
    DriveFileRevisionResult,
    DriveFileResult,
    CreateFileResult,
    FileRevisionState
} from '../interfaces/file';
import { decryptMessage, encryptMessage } from 'pmcrypto/lib/pmcrypto';
import useShare from './useShare';
import { getPromiseValue } from 'react-components/hooks/useCachedModelResult';
import { deserializeUint8Array } from 'proton-shared/lib/helpers/serialization';
import { useDownloadProvider } from '../components/downloads/DownloadProvider';
import { queryFileRevision, queryCreateFile, queryFile, queryUpdateFileRevision } from '../api/files';
import {
    decryptUnsigned,
    generateNodeKeys,
    generateContentKeys,
    encryptUnsigned,
    generateLookupHash,
    getStreamMessage
} from 'proton-shared/lib/keys/driveKeys';
import { decryptPrivateKeyArmored } from 'proton-shared/lib/keys/keys';
import { getDecryptedSessionKey } from 'proton-shared/lib/calendar/decrypt';
import { FOLDER_PAGE_SIZE } from '../constants';
import { useUploadProvider, Upload } from '../components/uploads/UploadProvider';
import { DriveLink } from '../interfaces/folder';

const adjustFileName = (
    file: File,
    uploads: Upload[],
    contents: DriveLink[],
    index = 0
): { blob: Blob; filename: string } => {
    const extensionRx = /\.[^/.]+$/g;
    const extension = file.name.match(extensionRx)?.[0] ?? '';
    const adjustedFileName = index ? `${file.name.replace(extensionRx, '')} (${index})${extension}` : file.name;
    const fileNameExists = contents.some((item) => item.Name === adjustedFileName);
    const fileNameUploading = uploads.some((item) => item.info.filename === adjustedFileName);
    return fileNameExists || fileNameUploading
        ? adjustFileName(file, uploads, contents, index + 1)
        : { blob: new Blob([file], { type: file.type }), filename: adjustedFileName };
};

export interface UploadFileMeta {
    Name: string;
}

function useFiles(shareId: string) {
    const api = useApi();
    const cache = useCache();
    const { getFolderMeta, getFolderContents } = useShare(shareId);
    const { startDownload } = useDownloadProvider();
    const { startUpload, uploads } = useUploadProvider();

    const getFileMeta = useCallback(
        async (linkId: string): Promise<{ File: DriveFile; privateKey: any }> =>
            getPromiseValue(cache, `drive/shares/${shareId}/file/${linkId}`, async () => {
                const { File }: DriveFileResult = await api(queryFile(shareId, linkId));
                const { privateKey: parentKey } = await getFolderMeta(File.ParentLinkID);
                const decryptedFilePassphrase = await decryptUnsigned({
                    armoredMessage: File.Passphrase,
                    privateKey: parentKey
                });
                const privateKey = await decryptPrivateKeyArmored(File.Key, decryptedFilePassphrase);
                return {
                    File,
                    privateKey
                };
            }),
        [shareId]
    );

    const getFileRevision = useCallback(
        async ({ ID, ActiveRevision }: DriveFile): Promise<DriveFileRevisionResult> =>
            getPromiseValue(cache, `drive/shares/${shareId}/file/${ID}/${ActiveRevision.ID}`, () =>
                api(queryFileRevision(shareId, ID, ActiveRevision.ID))
            ),
        [shareId]
    );

    const uploadDriveFile = useCallback(
        async (ParentLinkID: string, file: File) => {
            const { privateKey: parentKey } = await getFolderMeta(ParentLinkID);
            const { NodeKey, privateKey, NodePassphrase, rawPassphrase } = await generateNodeKeys(parentKey);
            const { sessionKey, ContentKeyPacket } = await generateContentKeys(privateKey);

            // TODO: contents will have pages, need to load all pages to check.
            const contents = await getFolderContents(ParentLinkID, 0, FOLDER_PAGE_SIZE, true);
            const { blob, filename } = adjustFileName(file, uploads, contents);

            startUpload(
                { blob, filename, shareId, linkId: ParentLinkID },
                {
                    initialize: async () => {
                        const Name = await encryptUnsigned({
                            message: filename,
                            privateKey: parentKey
                        });

                        const MimeType = blob.type || 'application/octet-stream';
                        const Hash = await generateLookupHash(filename, rawPassphrase);

                        const { File }: CreateFileResult = await api(
                            queryCreateFile(shareId, {
                                Name,
                                MimeType,
                                Hash,
                                ParentLinkID,
                                NodeKey,
                                NodePassphrase,
                                ContentKeyPacket
                            })
                        );
                        return File;
                    },
                    transform: async (data) => {
                        const res = await encryptMessage({
                            data,
                            sessionKey,
                            armor: false
                        });
                        return res.message.packets.write();
                    },
                    finalize: async ({ ID, RevisionID }, BlockList) => {
                        await api(
                            queryUpdateFileRevision(shareId, ID, RevisionID, {
                                State: FileRevisionState.Active,
                                BlockList
                            })
                        );
                    }
                }
            );
        },
        [shareId, uploads]
    );

    const downloadDriveFile = useCallback(
        async (linkId: string, filename: string) => {
            const { File, privateKey } = await getFileMeta(linkId);
            const { Revision } = await getFileRevision(File);
            const blockKeys = deserializeUint8Array(File.ContentKeyPacket);
            const sessionKeys = await getDecryptedSessionKey(blockKeys, privateKey);
            const publicKeys = privateKey.toPublic();

            await startDownload({ File, Revision, filename }, async (stream) => {
                const { data } = await decryptMessage({
                    message: await getStreamMessage(stream),
                    sessionKeys,
                    publicKeys,
                    streaming: 'web',
                    format: 'binary'
                });
                return data;
            });
        },
        [shareId]
    );

    return { downloadDriveFile, uploadDriveFile };
}

export default useFiles;
