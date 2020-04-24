import { useCallback } from 'react';
import { useApi, useEventManager, useUser, useNotifications } from 'react-components';
import { ReadableStream } from 'web-streams-polyfill';
import { DriveFileRevisionResult, CreateFileResult, FileRevisionState, RequestUploadResult } from '../interfaces/file';
import { decryptMessage, encryptMessage } from 'pmcrypto';
import { c } from 'ttag';
import { lookup } from 'mime-types';
import { queryFileRevision, queryCreateFile, queryUpdateFileRevision, queryRequestUpload } from '../api/files';
import {
    generateNodeKeys,
    generateContentKeys,
    encryptUnsigned,
    generateLookupHash,
    getStreamMessage,
    generateContentHash
} from 'proton-shared/lib/keys/driveKeys';
import { binaryStringToArray } from 'proton-shared/lib/helpers/string';
import { range } from 'proton-shared/lib/helpers/array';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { splitExtension } from 'proton-shared/lib/helpers/file';
import { noop } from 'proton-shared/lib/helpers/function';
import { useUploadProvider, BlockMeta } from '../components/uploads/UploadProvider';
import { TransferMeta, TransferState } from '../interfaces/transfer';
import { useDownloadProvider } from '../components/downloads/DownloadProvider';
import { initDownload, StreamTransformer } from '../components/downloads/download';
import { streamToBuffer } from '../utils/stream';
import { HashCheckResult, LinkType } from '../interfaces/link';
import { queryCheckAvailableHashes } from '../api/link';
import { ValidationError, validateLinkName } from '../utils/validation';
import useDriveCrypto from './useDriveCrypto';
import useDrive from './useDrive';
import useDebouncedPromise from './useDebouncedPromise';
import { FILE_CHUNK_SIZE } from '../constants';
import useQueuedFunction from './useQueuedFunction';

const HASH_CHECK_AMOUNT = 10;

function useFiles() {
    const api = useApi();
    const debouncedRequest = useDebouncedPromise();
    const queuedFunction = useQueuedFunction();
    const { createNotification } = useNotifications();
    const { getPrimaryAddressKey, sign } = useDriveCrypto();
    const { getLinkMeta, getLinkKeys, events } = useDrive();
    const { addToDownloadQueue } = useDownloadProvider();
    const { addToUploadQueue, getUploadsImmediate, getUploadsProgresses } = useUploadProvider();
    const [{ MaxSpace, UsedSpace }] = useUser();
    const { call } = useEventManager();

    const findAvailableName = async (
        shareId: string,
        parentLinkID: string,
        filename: string,
        start = 0
    ): Promise<{ filename: string; hash: string }> => {
        const parentKeys = await getLinkKeys(shareId, parentLinkID);

        if (!('hashKey' in parentKeys)) {
            throw Error('Missing hash key on folder link');
        }

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
                    hash: await generateLookupHash(adjustedFileName.toLowerCase(), parentKeys.hashKey)
                };
            })
        );

        const Hashes = hashesToCheck.map(({ hash }) => hash);
        const { AvailableHashes } = await debouncedRequest<HashCheckResult>(
            queryCheckAvailableHashes(shareId, parentLinkID, { Hashes })
        );

        if (!AvailableHashes.length) {
            return findAvailableName(shareId, parentLinkID, filename, start + HASH_CHECK_AMOUNT);
        }

        const availableName = hashesToCheck.find(({ hash }) => hash === AvailableHashes[0]);

        if (!availableName) {
            throw new Error('Backend returned unexpected hash');
        }

        return availableName;
    };

    const generateRootHash = useCallback(
        async (PreviousRootHash: string | null, blockMeta: BlockMeta[]) => {
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
        },
        [sign]
    );

    const uploadDriveFile = async (shareId: string, ParentLinkID: string, file: File) => {
        const setupPromise = (async () => {
            const error = validateLinkName(file.name);

            if (error) {
                throw new ValidationError(error);
            }

            const [parentKeys, addressKeyInfo] = await Promise.all([
                getLinkKeys(shareId, ParentLinkID),
                getPrimaryAddressKey()
            ]);

            const { NodeKey, privateKey, NodePassphrase, signature: NodePassphraseSignature } = await generateNodeKeys(
                parentKeys.privateKey,
                addressKeyInfo.privateKey
            );

            const { sessionKey, ContentKeyPacket } = await generateContentKeys(privateKey);

            if (!ContentKeyPacket) {
                throw new Error('Could not generate ContentKeyPacket');
            }

            const { filename, hash: Hash } = await findAvailableName(shareId, ParentLinkID, file.name);
            const blob = new Blob([file], { type: file.type });

            const Name = await encryptUnsigned({
                message: filename,
                publicKey: parentKeys.privateKey.toPublic()
            });

            const MimeType = lookup(filename) || 'application/octet-stream';

            const { File } = await debouncedRequest<CreateFileResult>(
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

            return {
                File,
                blob,
                Name,
                MimeType,
                sessionKey,
                filename,
                addressKeyInfo
            };
        })();

        addToUploadQueue(
            file,
            setupPromise.then(({ blob, MimeType, File, filename }) => ({
                meta: {
                    size: blob.size,
                    mimeType: MimeType,
                    filename
                },
                info: {
                    blob,
                    ParentLinkID,
                    LinkID: File.ID,
                    RevisionID: File.RevisionID,
                    ShareID: shareId
                }
            })),
            {
                transform: async (data) => {
                    const { sessionKey } = await setupPromise;

                    const res = await encryptMessage({
                        data,
                        sessionKey,
                        armor: false
                    });
                    return res.message.packets.write() as Uint8Array;
                },
                requestUpload: async (BlockList) => {
                    const { File, addressKeyInfo } = await setupPromise;
                    const { signature, address } = await sign(JSON.stringify(BlockList), addressKeyInfo);

                    const { UploadLinks } = await debouncedRequest<RequestUploadResult>(
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
                    const [{ File }, rootHash] = await Promise.all([setupPromise, generateRootHash(null, blockMeta)]);
                    await debouncedRequest(
                        queryUpdateFileRevision(shareId, File.ID, File.RevisionID, {
                            State: FileRevisionState.Active,
                            BlockList: blockMeta.map(({ Index, Token }) => ({
                                Index,
                                Token
                            })),
                            ...rootHash
                        })
                    );

                    // Update quota metrics and drive links
                    call();
                    events.call(shareId);
                }
            }
        );
    };

    const checkHasEnoughSpace = async (files: FileList | File[]) => {
        const calculateRemainingUploadBytes = () => {
            const uploads = getUploadsImmediate();
            const progresses = getUploadsProgresses();
            return uploads.reduce((sum, upload) => {
                const uploadedChunksSize = progresses[upload.id] - (progresses[upload.id] % FILE_CHUNK_SIZE);
                return [TransferState.Initializing, TransferState.Pending, TransferState.Progress].includes(
                    upload.state
                )
                    ? sum + upload.meta.size - uploadedChunksSize
                    : sum;
            }, 0);
        };

        let totalFileListSize = 0;
        for (let i = 0; i < files.length; i++) {
            totalFileListSize += files[i].size;
        }

        const remaining = calculateRemainingUploadBytes();
        await call();
        const result = MaxSpace > UsedSpace + remaining + totalFileListSize;
        return { result, total: totalFileListSize };
    };

    const uploadDriveFiles = queuedFunction(
        'uploadDriveFiles',
        async (shareId: string, ParentLinkID: string, files: FileList | File[]) => {
            const { result, total } = await checkHasEnoughSpace(files);
            const formattedRemaining = humanSize(total);
            if (!result) {
                createNotification({
                    text: c('Notification').t`Not enough space to upload ${formattedRemaining}`,
                    type: 'error'
                });
                throw new Error('Insufficient storage left');
            }

            for (let i = 0; i < files.length; i++) {
                uploadDriveFile(shareId, ParentLinkID, files[i]);
            }
        }
    );

    const decryptBlockStream = (shareId: string, linkId: string): StreamTransformer => async (stream) => {
        // TODO: implement root hash validation when file updates are implemented
        const keys = await getLinkKeys(shareId, linkId);

        if (!('sessionKeys' in keys)) {
            throw new Error('Session key missing on file link');
        }

        const { data } = await decryptMessage({
            message: await getStreamMessage(stream),
            sessionKeys: keys.sessionKeys,
            publicKeys: keys.privateKey.toPublic(),
            streaming: 'web',
            format: 'binary'
        });

        return data as ReadableStream<Uint8Array>;
    };

    const getFileRevision = async (shareId: string, linkId: string): Promise<DriveFileRevisionResult> => {
        let fileMeta = await getLinkMeta(shareId, linkId);

        if (!fileMeta.FileProperties?.ActiveRevision) {
            fileMeta = await getLinkMeta(shareId, linkId, { skipCache: true });
        }

        const revision = fileMeta.FileProperties?.ActiveRevision;

        if (!revision) {
            throw new Error(`Invalid link metadata, expected File (${LinkType.FILE}), got ${fileMeta.Type}`);
        }

        return debouncedRequest<DriveFileRevisionResult>(queryFileRevision(shareId, linkId, revision.ID));
    };

    const getFileBlocks = async (shareId: string, linkId: string) => {
        const { Revision } = await getFileRevision(shareId, linkId);
        return Revision.Blocks;
    };

    const downloadDriveFile = async (shareId: string, linkId: string) => {
        let resolve: (value: Promise<Uint8Array[]>) => void = noop;
        let reject: (reason?: any) => any = noop;

        const contentsPromise = new Promise<Uint8Array[]>((res, rej) => {
            resolve = res;
            reject = rej;
        });

        const { downloadControls } = initDownload({
            transformBlockStream: decryptBlockStream(shareId, linkId),
            onStart: async (stream) => {
                resolve(streamToBuffer(stream));
                return getFileBlocks(shareId, linkId);
            }
        });

        downloadControls.start(api).catch(reject);

        return {
            contents: contentsPromise,
            controls: downloadControls
        };
    };

    const saveFileTransferFromBuffer = async (content: Uint8Array[], meta: TransferMeta) => {
        return addToDownloadQueue(meta, {
            onStart: async () => content
        });
    };

    const startFileTransfer = (shareId: string, linkId: string, meta: TransferMeta) => {
        return addToDownloadQueue(meta, {
            transformBlockStream: decryptBlockStream(shareId, linkId),
            onStart: async () => getFileBlocks(shareId, linkId)
        });
    };

    return {
        startFileTransfer,
        uploadDriveFile,
        uploadDriveFiles,
        downloadDriveFile,
        saveFileTransferFromBuffer
    };
}

export default useFiles;
