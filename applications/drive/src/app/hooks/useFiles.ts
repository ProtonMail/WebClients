import { useApi, useEventManager, useUser, useNotifications } from 'react-components';
import { ReadableStream } from 'web-streams-polyfill';
import {
    DriveFileRevisionResult,
    CreateFileResult,
    FileRevisionState,
    RequestUploadResult,
    NestedFileStream
} from '../interfaces/file';
import { decryptMessage, encryptMessage } from 'pmcrypto';
import { c } from 'ttag';
import { lookup } from 'mime-types';
import { queryFileRevision, queryCreateFile, queryUpdateFileRevision, queryRequestUpload } from '../api/files';
import {
    generateNodeKeys,
    generateContentKeys,
    encryptUnsigned,
    generateLookupHash,
    getStreamMessage
} from 'proton-shared/lib/keys/driveKeys';
import { range } from 'proton-shared/lib/helpers/array';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { splitExtension } from 'proton-shared/lib/helpers/file';
import { noop } from 'proton-shared/lib/helpers/function';
import { useUploadProvider } from '../components/uploads/UploadProvider';
import { TransferMeta, TransferState } from '../interfaces/transfer';
import { useDownloadProvider } from '../components/downloads/DownloadProvider';
import { initDownload, StreamTransformer } from '../components/downloads/download';
import { streamToBuffer } from '../utils/stream';
import { HashCheckResult, LinkType } from '../interfaces/link';
import { queryCheckAvailableHashes } from '../api/link';
import { ValidationError, validateLinkName } from '../utils/validation';
import useDriveCrypto from './useDriveCrypto';
import useDrive from './useDrive';
import useDebouncedRequest from './useDebouncedRequest';
import { FILE_CHUNK_SIZE } from '../constants';
import useQueuedFunction from './useQueuedFunction';
import { useDriveCache } from '../components/DriveCache/DriveCacheProvider';
import { getMetaForTransfer } from '../components/Drive/Drive';

const HASH_CHECK_AMOUNT = 10;

function useFiles() {
    const api = useApi();
    const cache = useDriveCache();
    const debouncedRequest = useDebouncedRequest();
    const queuedFunction = useQueuedFunction();
    const { createNotification } = useNotifications();
    const { getPrimaryAddressKey, sign } = useDriveCrypto();
    const { getLinkMeta, getLinkKeys, events, fetchAllFolderPages, createNewFolder } = useDrive();
    const { addToDownloadQueue, addFolderToDownloadQueue } = useDownloadProvider();
    const { addToUploadQueue, getUploadsImmediate, getUploadsProgresses } = useUploadProvider();
    const [{ MaxSpace, UsedSpace }] = useUser();
    const { call } = useEventManager();

    const findAvailableName = queuedFunction(
        'findAvailableName',
        async (
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
        },
        5
    );

    const uploadDriveFile = async (
        shareId: string,
        parentLinkID: string | Promise<string>,
        file: File,
        noNameCheck = false
    ) => {
        const setupPromise = (async () => {
            const error = validateLinkName(file.name);

            if (error) {
                throw new ValidationError(error);
            }

            const ParentLinkID = await parentLinkID;

            const [parentKeys, addressKeyInfo] = await Promise.all([
                getLinkKeys(shareId, ParentLinkID),
                getPrimaryAddressKey()
            ]);

            const generateNameHash = async () => {
                if (!('hashKey' in parentKeys)) {
                    throw Error('Missing hash key on folder link');
                }
                return {
                    filename: file.name,
                    hash: await generateLookupHash(file.name.toLowerCase(), parentKeys.hashKey)
                };
            };

            const { NodeKey, privateKey, NodePassphrase, NodePassphraseSignature } = await generateNodeKeys(
                parentKeys.privateKey,
                addressKeyInfo.privateKey
            );

            const { sessionKey, ContentKeyPacket } = await generateContentKeys(privateKey);

            if (!ContentKeyPacket) {
                throw new Error('Could not generate ContentKeyPacket');
            }

            const { filename, hash: Hash } = noNameCheck
                ? await generateNameHash()
                : await findAvailableName(shareId, ParentLinkID, file.name);

            const blob = new Blob([file], { type: file.type });

            const Name = await encryptUnsigned({
                message: filename,
                publicKey: parentKeys.privateKey.toPublic()
            });

            const MIMEType = lookup(filename) || 'application/octet-stream';

            const { File } = await debouncedRequest<CreateFileResult>(
                queryCreateFile(shareId, {
                    Name,
                    MIMEType,
                    Hash,
                    ParentLinkID,
                    NodeKey,
                    NodePassphrase,
                    NodePassphraseSignature,
                    SignatureAddress: addressKeyInfo.address.Email,
                    ContentKeyPacket
                })
            );

            return {
                File,
                blob,
                Name,
                MIMEType,
                sessionKey,
                filename,
                addressKeyInfo,
                ParentLinkID
            };
        })();

        addToUploadQueue(
            file,
            setupPromise.then(({ blob, MIMEType, File, filename, ParentLinkID }) => ({
                meta: {
                    size: blob.size,
                    mimeType: MIMEType,
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
                requestUpload: async (Blocks) => {
                    const { File, addressKeyInfo } = await setupPromise;

                    const getBlockWithSignature = async (block: { Hash: string; Size: number; Index: number }) => {
                        const { signature } = await sign(block.Hash);
                        return {
                            Signature: signature,
                            ...block
                        };
                    };

                    const BlockList = await Promise.all(Blocks.map(getBlockWithSignature));

                    const { UploadLinks } = await debouncedRequest<RequestUploadResult>(
                        queryRequestUpload({
                            BlockList,
                            AddressID: addressKeyInfo.address.ID,
                            LinkID: File.ID,
                            RevisionID: File.RevisionID,
                            ShareID: shareId
                        })
                    );
                    return UploadLinks;
                },
                finalize: async (blockMetas) => {
                    let contentHashes = '';
                    const BlockList = blockMetas.map(({ Index, Token, Hash }) => {
                        contentHashes += Hash;
                        return {
                            Index,
                            Token
                        };
                    });
                    const { File } = await setupPromise;
                    const { signature, address } = await sign(contentHashes);
                    const SignatureAddress = address.Email;

                    await debouncedRequest(
                        queryUpdateFileRevision(shareId, File.ID, File.RevisionID, {
                            State: FileRevisionState.Active,
                            BlockList,
                            ManifestSignature: signature,
                            SignatureAddress
                        })
                    );

                    // Update quota metrics and drive links
                    call();
                    events.call(shareId);
                }
            }
        );
    };

    const checkHasEnoughSpace = async (files: FileList | File[] | { path: string[]; file?: File }[]) => {
        const calculateRemainingUploadBytes = () => {
            const uploads = getUploadsImmediate();
            const progresses = getUploadsProgresses();
            return uploads.reduce((sum, upload) => {
                const uploadedChunksSize = progresses[upload.id] - (progresses[upload.id] % FILE_CHUNK_SIZE);
                return [TransferState.Initializing, TransferState.Pending, TransferState.Progress].includes(
                    upload.state
                ) && upload.meta.size
                    ? sum + upload.meta.size - uploadedChunksSize
                    : sum;
            }, 0);
        };

        let totalFileListSize = 0;
        for (let i = 0; i < files.length; i++) {
            const entry = files[i];
            totalFileListSize += 'path' in entry ? entry.file?.size || 0 : entry.size;
        }

        const remaining = calculateRemainingUploadBytes();
        await call();
        const result = MaxSpace > UsedSpace + remaining + totalFileListSize;
        return { result, total: totalFileListSize };
    };

    /**
     * Accepts either a file list to upload to the parent folder or `{ path, file }` objects, where `path` is
     * a folder path relative to the parent folder (parent folder must be earlier in the list). Uploads without file
     * will only create empty folders.
     */
    const uploadDriveFiles = queuedFunction(
        'uploadDriveFiles',
        async (shareId: string, ParentLinkID: string, files: FileList | File[] | { path: string[]; file?: File }[]) => {
            const { result, total } = await checkHasEnoughSpace(files);
            if (!result) {
                const formattedRemaining = humanSize(total);
                createNotification({
                    text: c('Notification').t`Not enough space to upload ${formattedRemaining}`,
                    type: 'error'
                });
                throw new Error('Insufficient storage left');
            }

            const folderPromises: { [path: string]: ReturnType<typeof createNewFolder> } = {};

            for (let i = 0; i < files.length; i++) {
                setTimeout(() => {
                    const entry = files[i];

                    if (!('path' in entry)) {
                        uploadDriveFile(shareId, ParentLinkID, entry);
                        return;
                    }

                    const file = entry.file;
                    const folders = entry.path;

                    if (folders.length) {
                        const folder = folders.slice(-1)[0];

                        const parent = folders.slice(0, -1).join('/');
                        const path = parent ? folders.join('/') : folder;

                        if (!folderPromises[path]) {
                            let promise: Promise<any>;

                            if (folderPromises[parent]) {
                                // Wait for parent folders to be created first
                                promise = folderPromises[parent].then(({ Folder: { ID } }) =>
                                    createNewFolder(shareId, ID, folder)
                                );
                            } else {
                                // If root folder in a tree, it's name must be checked, all other folders are new ones
                                promise = parent
                                    ? createNewFolder(shareId, ParentLinkID, folder)
                                    : findAvailableName(
                                          shareId,
                                          ParentLinkID,
                                          folder
                                      ).then(({ filename: adjustedName }) =>
                                          createNewFolder(shareId, ParentLinkID, adjustedName)
                                      );
                            }

                            // Fetch events to get keys required for encryption in the new folder
                            folderPromises[path] = promise.then(async (args) => {
                                await events.call(shareId);
                                return args;
                            });
                        }

                        if (!file) {
                            return; // No file to upload
                        }

                        uploadDriveFile(
                            shareId,
                            folderPromises[path].then(({ Folder: { ID } }) => ID),
                            file,
                            true
                        );
                    } else if (file) {
                        uploadDriveFile(shareId, ParentLinkID, file);
                    }
                }, 0);
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

    /**
     * Starts folder download, resolves when all files have been downloaded or rejects on error
     */
    const startFolderTransfer = async (
        folderName: string,
        shareId: string,
        linkId: string,
        cb: {
            onStartFileTransfer: (file: NestedFileStream) => Promise<void>;
            onStartFolderTransfer: (path: string) => Promise<void>;
        }
    ) => {
        const { addDownload, startDownloads } = addFolderToDownloadQueue(folderName);
        const fileStreamPromises: Promise<void>[] = [];

        const downloadFolder = async (linkId: string, filePath = ''): Promise<void> => {
            const isComplete = cache.get.childrenComplete(shareId, linkId);
            const listed = cache.get.listedChildLinks(shareId, linkId);
            if (!isComplete && !listed?.length) {
                await fetchAllFolderPages(shareId, linkId);
            }

            const children = cache.get.childLinkMetas(shareId, linkId);

            if (!children) {
                return;
            }

            const promises = children.map((child) => {
                const path = `${filePath}/${child.Name}`;
                if (child.Type === LinkType.FILE) {
                    const promise = new Promise<void>((resolve, reject) => {
                        addDownload(getMetaForTransfer(child), {
                            transformBlockStream: decryptBlockStream(shareId, child.LinkID),
                            onStart: async (stream) => {
                                cb.onStartFileTransfer({
                                    stream,
                                    path
                                }).catch((err) => reject(err));
                                return getFileBlocks(shareId, child.LinkID);
                            },
                            onFinish: () => {
                                resolve();
                            },
                            onError(err) {
                                reject(err);
                            }
                        });
                    });
                    fileStreamPromises.push(promise);
                } else {
                    cb.onStartFolderTransfer(path).catch((err) => console.error(`Failed to zip empty folder ${err}`));
                    return downloadFolder(child.LinkID, path);
                }
            });

            await Promise.all(promises);
        };

        await downloadFolder(linkId);
        startDownloads();
        await Promise.all(fileStreamPromises);
    };

    return {
        startFileTransfer,
        startFolderTransfer,
        uploadDriveFile,
        uploadDriveFiles,
        downloadDriveFile,
        saveFileTransferFromBuffer
    };
}

export default useFiles;
