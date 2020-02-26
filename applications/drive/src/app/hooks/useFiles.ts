import { useCallback } from 'react';
import { useApi, useEventManager } from 'react-components';
import { ReadableStream } from 'web-streams-polyfill';
import {
    DriveFile,
    DriveFileRevisionResult,
    DriveFileResult,
    CreateFileResult,
    FileRevisionState,
    RequestUploadResult
} from '../interfaces/file';
import { decryptPrivateKey, decryptMessage, encryptMessage } from 'pmcrypto';
import useShare from './useShare';
import { deserializeUint8Array } from 'proton-shared/lib/helpers/serialization';
import {
    queryFileRevision,
    queryCreateFile,
    queryFile,
    queryUpdateFileRevision,
    queryRequestUpload
} from '../api/files';
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
import { useUploadProvider, BlockMeta } from '../components/uploads/UploadProvider';
import { TransferMeta } from '../interfaces/transfer';
import { useDownloadProvider } from '../components/downloads/DownloadProvider';
import { initDownload, StreamTransformer } from '../components/downloads/download';
import { streamToBuffer } from '../utils/stream';
import { HashCheckResult } from '../interfaces/link';
import { lookup } from 'mime-types';
import { noop } from 'proton-shared/lib/helpers/function';
import useDriveCrypto from './useDriveCrypto';
import { binaryStringToArray } from 'proton-shared/lib/helpers/string';
import { decryptPassphrase } from 'proton-shared/lib/keys/calendarKeys';
import useCachedResponse from './useCachedResponse';
import { range } from 'proton-shared/lib/helpers/array';
import { queryCheckAvailableHashes } from '../api/link';
import { splitExtension } from 'proton-shared/lib/helpers/file';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

const HASH_CHECK_AMOUNT = 10;

function useFiles(shareId: string) {
    const api = useApi();
    const { getCachedResponse } = useCachedResponse();
    const { getPrimaryAddressKey, sign, getVerificationKeys } = useDriveCrypto();
    const { getFolderMeta, decryptLink, clearFolderContentsCache } = useShare(shareId);
    const { addToDownloadQueue } = useDownloadProvider();
    const { addToUploadQueue, uploads } = useUploadProvider();
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

    const findAvailableName = async (
        parentLinkID: string,
        filename: string,
        start = 0
    ): Promise<{ filename: string; hash: string }> => {
        const { hashKey } = await getFolderMeta(parentLinkID);
        const [namePart, extension] = splitExtension(filename);

        const adjustName = (i: number) => {
            if (i === 0) {
                return filename;
            }

            if (!namePart) {
                return [`.${extension}`, `(${i})`].filter(isTruthy).join(' ');
            }

            const newNamePart = [namePart, `(${i})`].filter(isTruthy).join(' ');
            return extension ? [newNamePart, extension].join('.') : newNamePart;
        };

        const hashesToCheck = await Promise.all(
            range(start, start + HASH_CHECK_AMOUNT).map(async (i) => {
                const adjustedFileName = adjustName(i);
                return {
                    filename: adjustedFileName,
                    hash: await generateLookupHash(adjustedFileName.toLowerCase(), hashKey)
                };
            })
        );

        const Hashes = hashesToCheck.map(({ hash }) => hash);
        const { AvailableHashes } = await api<HashCheckResult>(
            queryCheckAvailableHashes(shareId, parentLinkID, { Hashes })
        );

        if (!AvailableHashes.length) {
            return findAvailableName(parentLinkID, filename, start + HASH_CHECK_AMOUNT);
        }

        const availableName = hashesToCheck.find(({ hash }) => hash === AvailableHashes[0]);

        if (!availableName) {
            throw new Error('Backend returned unexpected hash');
        }

        return availableName;
    };

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
            const [{ privateKey: parentKey }, addressKeyInfo] = await Promise.all([
                getFolderMeta(ParentLinkID),
                getPrimaryAddressKey()
            ]);

            const { NodeKey, privateKey, NodePassphrase, signature: NodePassphraseSignature } = await generateNodeKeys(
                parentKey,
                addressKeyInfo.privateKey
            );

            const { sessionKey, ContentKeyPacket } = await generateContentKeys(privateKey);

            if (!ContentKeyPacket) {
                throw new Error('Could not generate ContentKeyPacket');
            }

            // TODO: create initially with original name, rename after check is done
            const { filename, hash: Hash } = await findAvailableName(ParentLinkID, file.name);
            const blob = new Blob([file], { type: file.type });

            const Name = await encryptUnsigned({
                message: filename,
                privateKey: parentKey
            });

            const MimeType = lookup(filename) || 'application/octet-stream';

            const { File } = await api<CreateFileResult>(
                queryCreateFile(shareId, {
                    Name,
                    MimeType,
                    Hash,
                    ParentLinkID,
                    NodeKey,
                    NodePassphrase,
                    NodePassphraseSignature,
                    SignatureAddressID: addressKeyInfo.address.ID,
                    ContentKeyPacket
                })
            );

            addToUploadQueue(
                {
                    size: blob.size,
                    mimeType: MimeType,
                    filename
                },
                {
                    blob,
                    ParentLinkID,
                    LinkID: File.ID,
                    RevisionID: File.RevisionID,
                    ShareID: shareId
                },
                {
                    transform: async (data) => {
                        const res = await encryptMessage({
                            data,
                            sessionKey,
                            armor: false
                        });
                        return res.message.packets.write() as Uint8Array;
                    },
                    requestUpload: async (BlockList) => {
                        const { signature, address } = await sign(JSON.stringify(BlockList), addressKeyInfo);

                        const { UploadLinks } = await api<RequestUploadResult>(
                            queryRequestUpload({
                                BlockList,
                                AddressID: address.ID,
                                Signature: signature,
                                LinkID: File.ID,
                                RevisionID: File.RevisionID,
                                ShareID: shareId
                            })
                        );
                        return UploadLinks;
                    },
                    finalize: async (blockMeta) => {
                        const rootHash = await generateRootHash(null, blockMeta);
                        await api(
                            queryUpdateFileRevision(shareId, File.ID, File.RevisionID, {
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
