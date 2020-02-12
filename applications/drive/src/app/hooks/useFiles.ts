import { useCallback } from 'react';
import { useApi, useEventManager } from 'react-components';
import { ReadableStream } from 'web-streams-polyfill';
import {
    DriveFile,
    DriveFileRevisionResult,
    DriveFileResult,
    CreateFileResult,
    FileRevisionState
} from '../interfaces/file';
import { decryptPrivateKey, decryptMessage, encryptMessage } from 'pmcrypto';
import useShare from './useShare';
import { deserializeUint8Array } from 'proton-shared/lib/helpers/serialization';
import { queryFileRevision, queryCreateFile, queryFile, queryUpdateFileRevision } from '../api/files';
import {
    generateNodeKeys,
    generateContentKeys,
    encryptUnsigned,
    generateLookupHash,
    getStreamMessage,
    generateContentHash
} from 'proton-shared/lib/keys/driveKeys';
import { getDecryptedSessionKey } from 'proton-shared/lib/calendar/decrypt';
import { FOLDER_PAGE_SIZE } from '../constants';
import { useUploadProvider, Upload, BlockMeta } from '../components/uploads/UploadProvider';
import { TransferState, TransferMeta } from '../interfaces/transfer';
import { useDownloadProvider } from '../components/downloads/DownloadProvider';
import { initDownload, StreamTransformer } from '../components/downloads/download';
import { streamToBuffer } from '../utils/stream';
import { DriveLink } from '../interfaces/link';
import { lookup } from 'mime-types';
import { noop } from 'proton-shared/lib/helpers/function';
import useDriveCrypto from './useDriveCrypto';
import { binaryStringToArray } from 'proton-shared/lib/helpers/string';
import { decryptPassphrase } from 'proton-shared/lib/keys/calendarKeys';
import useCachedResponse from './useCachedResponse';

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
    const fileNameUploading = uploads.some((item) => item.meta.filename === adjustedFileName);
    return fileNameExists || fileNameUploading
        ? adjustFileName(file, uploads, contents, index + 1)
        : { blob: new Blob([file], { type: file.type }), filename: adjustedFileName };
};

export interface UploadFileMeta {
    Name: string;
}

function useFiles(shareId: string) {
    const api = useApi();
    const { getCachedResponse } = useCachedResponse();
    const { getPrimaryAddressKey, sign, getVerificationKeys } = useDriveCrypto();
    const { getFolderMeta, getFolderContents, decryptLink, clearFolderContentsCache } = useShare(shareId);
    const { addToDownloadQueue } = useDownloadProvider();
    const { startUpload, uploads } = useUploadProvider();
    const { call } = useEventManager();

    const getFileMeta = useCallback(
        async (linkId: string) =>
            getCachedResponse(`drive/shares/${shareId}/file/${linkId}`, async () => {
                const { File } = await api<DriveFileResult>(queryFile(shareId, linkId));
                const { privateKey: parentKey } = await getFolderMeta(File.ParentLinkID);
                const { publicKeys } = await getVerificationKeys(File.SignatureAddressID);
                const decryptedFilePassphrase = await decryptPassphrase({
                    armoredPassphrase: File.Passphrase,
                    armoredSignature: File.PassphraseSignature,
                    privateKeys: [parentKey],
                    publicKeys
                });
                const privateKey = await decryptPrivateKey(File.Key, decryptedFilePassphrase);
                const blockKeys = deserializeUint8Array(File.ContentKeyPacket);
                const sessionKeys = await getDecryptedSessionKey(blockKeys, privateKey);
                return {
                    File: await decryptLink(File),
                    sessionKeys,
                    privateKey
                };
            }),
        [shareId]
    );

    const getFileRevision = useCallback(
        async ({ ID, ActiveRevision }: DriveFile) =>
            getCachedResponse(`drive/shares/${shareId}/file/${ID}/${ActiveRevision.ID}`, () =>
                api<DriveFileRevisionResult>(queryFileRevision(shareId, ID, ActiveRevision.ID))
            ),
        [shareId]
    );

    const generateRootHash = async (PreviousRootHash: string | null, blockMeta: BlockMeta[]) => {
        const BlockHashes = blockMeta.map(({ Index, Hash }) => ({
            Index,
            Hash
        }));
        const { BlockHash: RootHash } = await generateContentHash(
            binaryStringToArray(
                JSON.stringify({
                    PreviousRootHash,
                    BlockHashes
                })
            )
        );

        const {
            signature: RootHashSignature,
            address: { ID: AuthorAddressID }
        } = await sign(RootHash);
        return { RootHash, RootHashSignature, AuthorAddressID };
    };

    const uploadDriveFile = useCallback(
        async (ParentLinkID: string, file: File) => {
            const { privateKey: parentKey } = await getFolderMeta(ParentLinkID);
            const { privateKey: addressKey, address } = await getPrimaryAddressKey();
            const {
                NodeKey,
                privateKey,
                NodePassphrase,
                rawPassphrase,
                signature: NodePassphraseSignature
            } = await generateNodeKeys(parentKey, addressKey);
            const { sessionKey, ContentKeyPacket } = await generateContentKeys(privateKey);

            if (!ContentKeyPacket) {
                throw new Error('Could not generate ContentKeyPacket');
            }

            // Name checks only among uploads to the same parent link
            const activeUploads = uploads.filter(
                ({ state, meta }) =>
                    meta.linkId === ParentLinkID &&
                    meta.shareId === shareId &&
                    (state === TransferState.Done ||
                        state === TransferState.Pending ||
                        state === TransferState.Progress)
            );

            // TODO: contents will have pages, need to load all pages to check.
            clearFolderContentsCache(ParentLinkID, 0, FOLDER_PAGE_SIZE);
            const contents = await getFolderContents(ParentLinkID, 0, FOLDER_PAGE_SIZE);
            const { blob, filename } = adjustFileName(file, activeUploads, contents);

            startUpload(
                { blob, filename, shareId, linkId: ParentLinkID },
                {
                    initialize: async () => {
                        const Name = await encryptUnsigned({
                            message: filename,
                            privateKey: parentKey
                        });

                        const MimeType = lookup(filename) || 'application/octet-stream';
                        const Hash = await generateLookupHash(filename, rawPassphrase);

                        const { File }: CreateFileResult = await api(
                            queryCreateFile(shareId, {
                                Name,
                                MimeType,
                                Hash,
                                ParentLinkID,
                                NodeKey,
                                NodePassphrase,
                                NodePassphraseSignature,
                                SignatureAddressID: address.ID,
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
                        return res.message.packets.write() as Uint8Array;
                    },
                    finalize: async ({ ID, RevisionID }, blockMeta) => {
                        const rootHash = await generateRootHash(null, blockMeta);
                        await api(
                            queryUpdateFileRevision(shareId, ID, RevisionID, {
                                State: FileRevisionState.Active,
                                BlockList: blockMeta.map(({ Index, Token }) => ({
                                    Index,
                                    Token
                                })),
                                ...rootHash
                            })
                        );

                        // TODO: clear all cached pages after upload, or only last one
                        clearFolderContentsCache(ParentLinkID, 0, FOLDER_PAGE_SIZE);

                        // Update quota metrics
                        call();
                    }
                }
            );
        },
        [shareId, uploads]
    );

    const decryptBlockStream = (linkId: string): StreamTransformer => async (stream) => {
        // TODO: implement root hash validation when file updates are implemented
        const { privateKey, sessionKeys } = await getFileMeta(linkId);
        const publicKeys = privateKey.toPublic();
        const { data } = await decryptMessage({
            message: await getStreamMessage(stream),
            sessionKeys,
            publicKeys,
            streaming: 'web',
            format: 'binary'
        });

        return data as ReadableStream<Uint8Array>;
    };

    const getFileBlocks = async (linkId: string) => {
        const { File } = await getFileMeta(linkId);
        const { Revision } = await getFileRevision(File);
        return Revision.Blocks;
    };

    const downloadDriveFile = useCallback(
        async (linkId: string) => {
            let resolve: (value: Promise<Uint8Array[]>) => void = noop;
            let reject: (reason?: any) => any = noop;

            const contentsPromise = new Promise<Uint8Array[]>((res, rej) => {
                resolve = res;
                reject = rej;
            });

            const { downloadControls } = initDownload({
                transformBlockStream: decryptBlockStream(linkId),
                onStart: async (stream) => {
                    resolve(streamToBuffer(stream));
                    return getFileBlocks(linkId);
                }
            });

            downloadControls.start(api).catch(reject);

            return {
                contents: contentsPromise,
                controls: downloadControls
            };
        },
        [shareId]
    );

    const saveFileTransferFromBuffer = async (content: Uint8Array[], meta: TransferMeta) => {
        return addToDownloadQueue(meta, {
            onStart: async () => content
        });
    };

    const startFileTransfer = useCallback(
        (linkId: string, meta: TransferMeta) => {
            return addToDownloadQueue(meta, {
                transformBlockStream: decryptBlockStream(linkId),
                onStart: () => getFileBlocks(linkId)
            });
        },
        [shareId]
    );

    return {
        startFileTransfer,
        uploadDriveFile,
        downloadDriveFile,
        getFileMeta,
        saveFileTransferFromBuffer
    };
}

export default useFiles;
