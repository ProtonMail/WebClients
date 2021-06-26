import { useApi, useEventManager, useNotifications, usePreventLeave, useGetUser } from '@proton/components';
import { ReadableStream } from 'web-streams-polyfill';
import { decryptMessage, encryptMessage, getMessage, getSignature } from 'pmcrypto';
import { c } from 'ttag';
import {
    generateNodeKeys,
    generateContentKeys,
    generateLookupHash,
    encryptName,
    getStreamMessage,
} from '@proton/shared/lib/keys/driveKeys';
import { range, mergeUint8Arrays } from '@proton/shared/lib/helpers/array';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { noop } from '@proton/shared/lib/helpers/function';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import {
    DriveFileRevisionResult,
    CreateFileResult,
    FileRevisionState,
    RequestUploadResult,
    NestedFileStream,
    DriveFileBlock,
} from '../../interfaces/file';
import { queryFileRevision, queryCreateFile, queryUpdateFileRevision, queryRequestUpload } from '../../api/files';
import { useUploadProvider } from '../../components/uploads/UploadProvider';
import { TransferMeta, TransferState, DownloadInfo, PreUploadData, TransferCancel } from '../../interfaces/transfer';
import { useDownloadProvider } from '../../components/downloads/DownloadProvider';
import { initDownload, StreamTransformer } from '../../components/downloads/download';
import { streamToBuffer } from '../../utils/stream';
import { HashCheckResult, LinkType } from '../../interfaces/link';
import { queryCheckAvailableHashes } from '../../api/link';
import { ValidationError, validateLinkName } from '../../utils/validation';
import useDriveCrypto from './useDriveCrypto';
import useDrive from './useDrive';
import useDebouncedRequest from '../util/useDebouncedRequest';
import { FILE_CHUNK_SIZE, MAX_SAFE_UPLOADING_FILE_COUNT } from '../../constants';
import useQueuedFunction from '../util/useQueuedFunction';
import { useDriveCache } from '../../components/DriveCache/DriveCacheProvider';
import { countFilesToUpload, isFile } from '../../utils/file';
import { getMetaForTransfer, isTransferCancelError } from '../../utils/transfer';
import { mimeTypeFromFile } from '../../utils/MimeTypeParser/MimeTypeParser';
import useConfirm from '../util/useConfirm';
import { adjustName, splitLinkName } from '../../utils/link';

const HASH_CHECK_AMOUNT = 10;

function useFiles() {
    const api = useApi();
    const { events, deleteChildrenLinks } = useDrive();
    const getUser = useGetUser();
    const cache = useDriveCache();
    const debouncedRequest = useDebouncedRequest();
    const queuedFunction = useQueuedFunction();
    const { createNotification } = useNotifications();
    const { getPrimaryAddressKey, sign } = useDriveCrypto();
    const { getLinkMeta, getLinkKeys, fetchAllFolderPages, createNewFolder } = useDrive();
    const { addToDownloadQueue, addFolderToDownloadQueue } = useDownloadProvider();
    const { addToUploadQueue, getUploadsImmediate, getUploadsProgresses, getAbortController } = useUploadProvider();
    const { preventLeave } = usePreventLeave();
    const { call } = useEventManager();
    const { openConfirmModal } = useConfirm();

    const findAvailableName = queuedFunction(
        'findAvailableName',
        async (shareId: string, parentLinkID: string, filename: string, suppressErrors = false) => {
            const parentKeys = await getLinkKeys(shareId, parentLinkID);

            if (!('hashKey' in parentKeys)) {
                throw Error('Missing hash key on folder link');
            }

            const [namePart, extension] = splitLinkName(filename);

            const findAdjustedName = async (
                start = 0
            ): Promise<{
                filename: string;
                hash: string;
            }> => {
                const hashesToCheck = await Promise.all(
                    range(start, start + HASH_CHECK_AMOUNT).map(async (i) => {
                        const adjustedFileName = adjustName(i, namePart, extension);
                        return {
                            filename: adjustedFileName,
                            hash: await generateLookupHash(adjustedFileName, parentKeys.hashKey),
                        };
                    })
                );

                const Hashes = hashesToCheck.map(({ hash }) => hash);
                const { AvailableHashes } = await debouncedRequest<HashCheckResult>(
                    queryCheckAvailableHashes(shareId, parentLinkID, { Hashes }, suppressErrors)
                );
                if (!AvailableHashes.length) {
                    return findAdjustedName(start + HASH_CHECK_AMOUNT);
                }
                const availableName = hashesToCheck.find(({ hash }) => hash === AvailableHashes[0]);

                if (!availableName) {
                    throw new Error('Backend returned unexpected hash');
                }
                return availableName;
            };
            return findAdjustedName();
        },
        5
    );

    const uploadEmptyFolder = (
        shareId: string,
        ParentLinkID: string,
        folderName: string,
        { checkNameAvailability = true, signal }: { checkNameAvailability?: boolean; signal?: AbortSignal } = {}
    ) => {
        const lowercaseName = folderName.toLowerCase();

        return queuedFunction(`upload_empty_folder:${lowercaseName}`, async () => {
            let adjustedFolderName = folderName;

            if (checkNameAvailability && !signal?.aborted) {
                const checkResult = await findAvailableName(shareId, ParentLinkID, adjustedFolderName);

                adjustedFolderName = checkResult.filename;
            }

            if (signal?.aborted) {
                throw new TransferCancel({ message: `Upload folder "${folderName}" aborted in ${ParentLinkID}` });
            }

            return createNewFolder(shareId, ParentLinkID, adjustedFolderName);
        })();
    };

    const uploadDriveFile = async (
        shareId: string,
        parentLinkID: string | Promise<string>,
        file: File,
        noNameCheck = false
    ) => {
        const queuedFnId = `upload_setup:${file.name}`;
        // Queue for files with same name, to not duplicate names
        // Another queue for uploads in general so that they don't timeout
        const setupPromise = (async () => {
            const error = validateLinkName(file.name);

            if (error) {
                throw new ValidationError(error);
            }

            const [parentKeys, addressKeyInfo] = await Promise.all([
                getLinkKeys(shareId, await parentLinkID),
                getPrimaryAddressKey(),
            ]);

            const { NodeKey, privateKey, NodePassphrase, NodePassphraseSignature } = await generateNodeKeys(
                parentKeys.privateKey,
                addressKeyInfo.privateKey
            );

            const { sessionKey, ContentKeyPacket } = await generateContentKeys(privateKey);

            if (!ContentKeyPacket) {
                throw new Error('Could not generate ContentKeyPacket');
            }

            return {
                NodeKey,
                NodePassphrase,
                NodePassphraseSignature,
                ContentKeyPacket,
                sessionKey,
                privateKey,
                parentKeys,
                addressKeyInfo,
            };
        })();

        // Queue for files with same name, to not duplicate names
        // Another queue for uploads in general so that they don't timeout
        const createFile = queuedFunction(
            'create_file',
            queuedFunction(queuedFnId, async (abortSignal: AbortSignal) => {
                const {
                    addressKeyInfo,
                    parentKeys,
                    ContentKeyPacket,
                    NodePassphrase,
                    NodePassphraseSignature,
                    NodeKey,
                } = await setupPromise;

                if (abortSignal.aborted) {
                    throw new TransferCancel({ message: `Transfer canceled for file "${file.name}"` });
                }

                const generateNameHash = async () => {
                    if (!('hashKey' in parentKeys)) {
                        throw Error('Missing hash key on folder link');
                    }
                    return {
                        filename: file.name,
                        hash: await generateLookupHash(file.name, parentKeys.hashKey),
                    };
                };

                const { filename, hash: Hash } = noNameCheck
                    ? await generateNameHash()
                    : await findAvailableName(shareId, await parentLinkID, file.name);

                const Name = await encryptName(filename, parentKeys.privateKey.toPublic(), addressKeyInfo.privateKey);
                const MIMEType = await mimeTypeFromFile(file);

                if (abortSignal.aborted) {
                    throw new TransferCancel({ message: `Transfer canceled for file "${filename}"` });
                }

                // If create draft hasn't been cancel up to this point do not try to cancel it anymore
                const { File } = await debouncedRequest<CreateFileResult>(
                    queryCreateFile(shareId, {
                        Name,
                        MIMEType,
                        Hash,
                        NodeKey,
                        NodePassphrase,
                        NodePassphraseSignature,
                        SignatureAddress: addressKeyInfo.address.Email,
                        ContentKeyPacket,
                        ParentLinkID: await parentLinkID,
                    })
                );

                return {
                    filename,
                    File,
                    MIMEType,
                };
            }),
            5
        );

        const preUploadData: PreUploadData = {
            file,
            ParentLinkID: parentLinkID,
            ShareID: shareId,
        };

        let createdFile:
            | {
                  ID: string;
                  RevisionID: string;
              }
            | undefined;

        return addToUploadQueue(preUploadData, setupPromise, {
            initialize: async (abortSignal) => {
                const result = await createFile(abortSignal);
                createdFile = result.File;
                return result;
            },
            transform: async (data, attachedSignature = false) => {
                const [{ sessionKey, privateKey: nodePrivateKey }, { privateKey: addressPrivateKey }] =
                    await Promise.all([setupPromise, getPrimaryAddressKey()]);

                // Thumbnail has signature attached, regular file detached.
                if (attachedSignature) {
                    const { message } = await encryptMessage({
                        data,
                        sessionKey,
                        privateKeys: addressPrivateKey,
                        armor: false,
                        detached: false,
                    });
                    return {
                        encryptedData: message.packets.write(),
                    };
                }

                const { message, signature } = await encryptMessage({
                    data,
                    sessionKey,
                    privateKeys: addressPrivateKey,
                    armor: false,
                    detached: true,
                });

                const { data: encryptedSignature } = await encryptMessage({
                    data: signature.packets.write(),
                    sessionKey,
                    publicKeys: nodePrivateKey.toPublic(),
                    armor: true,
                });

                return {
                    encryptedData: message.packets.write(),
                    signature: encryptedSignature,
                };
            },
            requestUpload: async (blocks, thumbnailBlock) => {
                const { addressKeyInfo } = await setupPromise;

                const BlockList = await Promise.all(
                    blocks.map(({ Hash, ...block }) => ({ ...block, Hash: uint8ArrayToBase64String(Hash) }))
                );
                const thumbnailParams = thumbnailBlock
                    ? {
                          Thumbnail: 1,
                          ThumbnailHash: uint8ArrayToBase64String(thumbnailBlock.Hash),
                          ThumbnailSize: thumbnailBlock.Size,
                      }
                    : {};

                if (!createdFile) {
                    throw new Error(`Draft for "${file.name}" hasn't been created prior to uploading`);
                }

                const { UploadLinks, ThumbnailLink } = await debouncedRequest<RequestUploadResult>(
                    queryRequestUpload({
                        BlockList,
                        AddressID: addressKeyInfo.address.ID,
                        LinkID: createdFile.ID,
                        RevisionID: createdFile.RevisionID,
                        ShareID: shareId,
                        ...thumbnailParams,
                    })
                );
                return { UploadLinks, ThumbnailLink };
            },
            finalize: queuedFunction(
                'upload_finalize',
                async (blockTokens, config) => {
                    const hashes: Uint8Array[] = [];
                    const BlockList: { Index: number; Token: string }[] = [];

                    // Thumbnail has index 0, which is optional. If file has
                    // no thumbnail, index starts from 1.
                    const indexStart = blockTokens.get(0) ? 0 : 1;
                    for (let Index = indexStart; Index < indexStart + blockTokens.size; Index++) {
                        const info = blockTokens.get(Index);
                        if (!info) {
                            throw new Error(`Block Token not found for ${Index} in upload ${config?.id}`);
                        }
                        hashes.push(info.Hash);
                        BlockList.push({
                            Index,
                            Token: info.Token,
                        });
                    }

                    const contentHashes = mergeUint8Arrays(hashes);
                    const {
                        signature,
                        address: { Email: SignatureAddress },
                    } = await sign(contentHashes);

                    if (!createdFile) {
                        throw new Error(`Draft for "${file.name}" hasn't been created prior to uploading`);
                    }

                    await debouncedRequest(
                        queryUpdateFileRevision(shareId, createdFile.ID, createdFile.RevisionID, {
                            State: FileRevisionState.Active,
                            BlockList,
                            ManifestSignature: signature,
                            SignatureAddress,
                        })
                    );
                    events.callAll(shareId).catch(console.error);
                },
                5
            ),
            onError: async () => {
                try {
                    if (createdFile) {
                        await deleteChildrenLinks(shareId, await parentLinkID, [createdFile.ID]);
                    }
                } catch (err) {
                    if (!isTransferCancelError(err)) {
                        console.error(err);
                    }
                }
            },
        });
    };

    const checkHasEnoughSpace = async (files: FileList | File[] | { path: string[]; file?: File }[]) => {
        const calculateRemainingUploadBytes = () => {
            const uploads = getUploadsImmediate();
            const progresses = getUploadsProgresses();
            return uploads.reduce((sum, upload) => {
                const uploadedChunksSize = progresses[upload.id] - (progresses[upload.id] % FILE_CHUNK_SIZE);
                return [
                    TransferState.Initializing,
                    TransferState.Pending,
                    TransferState.Progress,
                    TransferState.Paused,
                ].includes(upload.state) && upload.meta.size
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

        const { MaxSpace, UsedSpace } = await getUser();
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
        async (
            shareId: string,
            ParentLinkID: string,
            files: FileList | { path: string[]; file?: File }[],
            filesOnly = false
        ) => {
            const { signal } = getAbortController();
            const { result, total } = await checkHasEnoughSpace(files);
            if (!result && !signal.aborted) {
                const formattedRemaining = humanSize(total);
                createNotification({
                    text: c('Notification').t`Not enough space to upload ${formattedRemaining}`,
                    type: 'error',
                });
                throw new Error('Insufficient storage left');
            }

            const fileCount = countFilesToUpload(files);

            if (fileCount >= MAX_SAFE_UPLOADING_FILE_COUNT) {
                await new Promise<void>((resolve, reject) => {
                    openConfirmModal({
                        canUndo: true,
                        title: c('Title').t`Warning`,
                        confirm: c('Action').t`Continue`,
                        message: c('Info').t`Uploading hundreds of files at once may have a performance impact.`,
                        onConfirm: resolve,
                        onCancel: () =>
                            reject(new TransferCancel({ message: `Upload of ${fileCount} files was canceled` })),
                    });
                });
            }

            const folderPromises = new Map<string, ReturnType<typeof createNewFolder>>();

            for (let i = 0; i < files.length; i++) {
                const entry = files[i];

                const file = 'path' in entry ? entry.file : entry;

                if (signal.aborted) {
                    return;
                }

                const uploadFile = (parentLinkID: string | Promise<string>, file: File, noNameCheck?: boolean) => {
                    if (!signal.aborted) {
                        preventLeave(uploadDriveFile(shareId, parentLinkID, file, noNameCheck)).catch((err) => {
                            if (!isTransferCancelError(err)) {
                                console.error(err);
                            }
                        });
                    }
                };

                const createFolder = (ParentLinkID: string, folderName: string, checkNameAvailability = false) => {
                    return uploadEmptyFolder(shareId, ParentLinkID, folderName, {
                        checkNameAvailability,
                        signal,
                    });
                };

                (file ? isFile(file) : Promise.resolve(false))
                    .then((isEntryFile) => {
                        // MacOS has bug, where you can select folders when uploading files in some cases
                        if (filesOnly && !isEntryFile) {
                            return;
                        }

                        setTimeout(() => {
                            if (!('path' in entry)) {
                                uploadFile(ParentLinkID, entry);
                                return;
                            }

                            const { file } = entry;
                            const folders = entry.path;

                            if (folders.length) {
                                const folder = folders.slice(-1)[0];

                                const parent = folders.slice(0, -1).join('/');
                                const path = parent ? folders.join('/') : folder;

                                if (!folderPromises.has(path)) {
                                    const parentFolderPromise = folderPromises.get(parent);

                                    // Wait for parent folders to be created first
                                    // If root folder's in tree, it's name must be checked, all other folders are new ones
                                    const promise = (
                                        parentFolderPromise
                                            ? parentFolderPromise.then(({ Folder }) => createFolder(Folder.ID, folder))
                                            : createFolder(ParentLinkID, folder, !parent)
                                    ).then(async (args) => {
                                        await events.call(shareId);
                                        return args;
                                    });

                                    // Fetch events to get keys required for encryption in the new folder
                                    folderPromises.set(path, promise);
                                }

                                const folderPromise = folderPromises.get(path)?.then(({ Folder: { ID } }) => ID);

                                if (file && folderPromise) {
                                    const promise = folderPromise;
                                    uploadFile(promise, file, true);
                                }

                                // Log unhandled exceptions
                                folderPromise?.catch((err) => {
                                    if (!isTransferCancelError(err)) {
                                        console.error(err);
                                    }
                                });
                            } else if (file) {
                                uploadFile(ParentLinkID, file);
                            }
                        }, 0);
                    })
                    .catch((err) => {
                        if (!isTransferCancelError(err)) {
                            console.error(err);
                        }
                    });
            }
        }
    );

    const decryptBlockStream =
        (shareId: string, linkId: string): StreamTransformer =>
        async (stream, encSignature) => {
            // TODO: implement root hash validation when file updates are implemented
            const keys = await getLinkKeys(shareId, linkId);
            if (!('sessionKeys' in keys)) {
                throw new Error('Session key missing on file link');
            }

            // NOTE: the message is signed under the uploader's address key, so that's what it should be used here
            // to verify it. Note that getPrimaryAddressKey will give the current user's address key, meaning that
            // if the file was uploaded by a different user, this verification will fail.

            // TODO: Fetch addressPublicKey of signer when we start supporting drive volumes with multiple users.
            const { privateKey: addressPrivateKey } = await getPrimaryAddressKey();

            // Thumbnails have attached signature, regular file detached one.
            if (!encSignature) {
                const message = await getStreamMessage(stream);
                const { data } = await decryptMessage({
                    message,
                    sessionKeys: keys.sessionKeys,
                    publicKeys: addressPrivateKey.toPublic(),
                    streaming: 'web',
                    format: 'binary',
                });
                return data as ReadableStream<Uint8Array>;
            }

            const signatureMessage = await getMessage(encSignature);
            const decryptedSignature = await decryptMessage({
                privateKeys: keys.privateKey,
                message: signatureMessage,
                format: 'binary',
            });
            const [message, signature] = await Promise.all([
                getStreamMessage(stream),
                getSignature(decryptedSignature.data),
            ]);

            const { data } = await decryptMessage({
                message,
                signature,
                sessionKeys: keys.sessionKeys,
                publicKeys: addressPrivateKey.toPublic(),
                streaming: 'web',
                format: 'binary',
            });

            return data as ReadableStream<Uint8Array>;
        };

    const getFileRevision = async (
        shareId: string,
        linkId: string,
        abortSignal?: AbortSignal,
        pagination?: {
            FromBlockIndex: number;
            PageSize: number;
        }
    ): Promise<DriveFileRevisionResult> => {
        let fileMeta = await getLinkMeta(shareId, linkId, { abortSignal });

        if (!fileMeta.FileProperties?.ActiveRevision) {
            fileMeta = await getLinkMeta(shareId, linkId, { skipCache: true, abortSignal });
        }

        const revision = fileMeta.FileProperties?.ActiveRevision;

        if (!revision) {
            throw new Error(`Invalid link metadata, expected File (${LinkType.FILE}), got ${fileMeta.Type}`);
        }

        return debouncedRequest<DriveFileRevisionResult>({
            ...queryFileRevision(shareId, linkId, revision.ID, pagination),
            signal: abortSignal,
        });
    };

    const getFileBlocks = async (
        shareId: string,
        linkId: string,
        abortSignal?: AbortSignal,
        pagination?: {
            FromBlockIndex: number;
            PageSize: number;
        }
    ) => {
        const { Revision } = await getFileRevision(shareId, linkId, abortSignal, pagination);
        return Revision.Blocks;
    };

    // downloadDriveFile downloads the file. If driveBlocks are not passed,
    // it automatically fetches all file blocks to be downloaded.
    const downloadDriveFile = async (shareId: string, linkId: string, driveBlocks?: DriveFileBlock[]) => {
        let resolve: (value: Promise<Uint8Array[]>) => void = noop;
        let reject: (reason?: any) => any = noop;

        const contentsPromise = new Promise<Uint8Array[]>((res, rej) => {
            resolve = res;
            reject = rej;
        });

        const getBlocks = async (
            abortSignal: AbortSignal,
            pagination?: { FromBlockIndex: number; PageSize: number }
        ): Promise<DriveFileBlock[]> => {
            if (driveBlocks) {
                return driveBlocks;
            }
            return getFileBlocks(shareId, linkId, abortSignal, pagination);
        };

        const { downloadControls } = initDownload({
            transformBlockStream: decryptBlockStream(shareId, linkId),
            getBlocks,
            onStart: (stream) => resolve(streamToBuffer(stream)),
        });

        downloadControls.start(api).catch(reject);

        return {
            contents: contentsPromise,
            controls: downloadControls,
        };
    };

    const saveFileTransferFromBuffer = async (content: Uint8Array[], meta: TransferMeta, info: DownloadInfo) => {
        return addToDownloadQueue(meta, info, {
            getBlocks: async () => content,
        });
    };

    const startFileTransfer = (shareId: string, linkId: string, meta: TransferMeta) => {
        return addToDownloadQueue(
            meta,
            { ShareID: shareId, LinkID: linkId },
            {
                transformBlockStream: decryptBlockStream(shareId, linkId),
                getBlocks: async (abortSignal, pagination) => getFileBlocks(shareId, linkId, abortSignal, pagination),
            }
        );
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
        const { addDownload, startDownloads } = addFolderToDownloadQueue(folderName, {
            ShareID: shareId,
            LinkID: linkId,
        });
        const fileStreamPromises: Promise<void>[] = [];
        const abortController = new AbortController();

        const downloadFolder = async (linkId: string, parentPath = ''): Promise<any> => {
            if (abortController.signal.aborted) {
                throw Error(`Folder download canceled for ${parentPath}`);
            }

            await fetchAllFolderPages(shareId, linkId);
            const children = cache.get.childLinkMetas(shareId, linkId);

            if (!children) {
                return;
            }

            const promises = children.map(async (child) => {
                if (child.Type === LinkType.FILE) {
                    const promise = new Promise<void>((resolve, reject) => {
                        addDownload(
                            getMetaForTransfer(child),
                            { ShareID: shareId, LinkID: linkId },
                            {
                                getBlocks: (abortSignal, pagination) =>
                                    getFileBlocks(shareId, child.LinkID, abortSignal, pagination),
                                transformBlockStream: decryptBlockStream(shareId, child.LinkID),
                                onStart: (stream) => {
                                    cb.onStartFileTransfer({
                                        stream,
                                        parentPath,
                                        fileName: child.Name,
                                    }).catch(reject);
                                },
                                onFinish: () => {
                                    resolve();
                                },
                                onError(err) {
                                    reject(err);
                                },
                            }
                        ).catch(reject);
                    }).catch((e) => {
                        if (!abortController.signal.aborted) {
                            console.error(e);
                            abortController.abort();
                            throw e;
                        }
                    });
                    fileStreamPromises.push(
                        promise.catch((e) => {
                            if (!abortController.signal.aborted) {
                                throw e;
                            }
                        })
                    );
                } else if (!abortController.signal.aborted) {
                    const folderPath = `${parentPath}/${child.Name}`;
                    cb.onStartFolderTransfer(folderPath).catch((err) =>
                        console.error(`Failed to zip empty folder ${err}`)
                    );
                    await downloadFolder(child.LinkID, folderPath);
                }
            });

            await Promise.all(promises);
        };

        await downloadFolder(linkId);
        await startDownloads();
        await Promise.all(fileStreamPromises);
    };

    return {
        startFileTransfer,
        startFolderTransfer,
        uploadDriveFile,
        uploadDriveFiles,
        downloadDriveFile,
        saveFileTransferFromBuffer,
    };
}

export default useFiles;
