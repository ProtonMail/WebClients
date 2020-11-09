import { useApi, useEventManager, useNotifications, usePreventLeave, useGetUser } from 'react-components';
import { ReadableStream } from 'web-streams-polyfill';
import { decryptMessage, encryptMessage } from 'pmcrypto';
import { c } from 'ttag';
import { lookup } from 'mime-types';
import {
    generateNodeKeys,
    generateContentKeys,
    encryptName,
    generateLookupHash,
    getStreamMessage,
} from 'proton-shared/lib/keys/driveKeys';
import { range, mergeUint8Arrays } from 'proton-shared/lib/helpers/array';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { splitExtension } from 'proton-shared/lib/helpers/file';
import { noop } from 'proton-shared/lib/helpers/function';
import { uint8ArrayToBase64String } from 'proton-shared/lib/helpers/encoding';
import { FEATURE_FLAGS } from 'proton-shared/lib/constants';
import {
    DriveFileRevisionResult,
    CreateFileResult,
    FileRevisionState,
    RequestUploadResult,
    NestedFileStream,
} from '../../interfaces/file';
import { queryFileRevision, queryCreateFile, queryUpdateFileRevision, queryRequestUpload } from '../../api/files';
import { useUploadProvider } from '../../components/uploads/UploadProvider';
import {
    TransferMeta,
    TransferState,
    DownloadInfo,
    PreUploadData,
    UploadInfo,
    TransferCancel,
} from '../../interfaces/transfer';
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
import useEvents from './useEvents';
import { mimeTypeFromFile } from '../../utils/MimeTypeParser/MimeTypeParser';
import useConfirm from '../util/useConfirm';

const HASH_CHECK_AMOUNT = 10;

function useFiles() {
    const api = useApi();
    const { deleteChildrenLinks } = useDrive();
    const getUser = useGetUser();
    const cache = useDriveCache();
    const debouncedRequest = useDebouncedRequest();
    const queuedFunction = useQueuedFunction();
    const { createNotification } = useNotifications();
    const { getPrimaryAddressKey, sign } = useDriveCrypto();
    const { getLinkMeta, getLinkKeys, fetchAllFolderPages, createNewFolder } = useDrive();
    const events = useEvents();
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

            const findAdjustedName = async (
                start = 0
            ): Promise<{
                filename: string;
                hash: string;
            }> => {
                const hashesToCheck = await Promise.all(
                    range(start, start + HASH_CHECK_AMOUNT).map(async (i) => {
                        const adjustedFileName = adjustName(i);
                        return {
                            filename: adjustedFileName,
                            hash: await generateLookupHash(adjustedFileName.toLowerCase(), parentKeys.hashKey),
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
        const lowercaseName = file.name.toLowerCase();
        let canceled = false;
        // Queue for files with same name, to not duplicate names
        // Another queue for uploads in general so that they don't timeout
        const setupPromise = queuedFunction(
            'upload_setup',
            queuedFunction(`upload_setup:${lowercaseName}`, async () => {
                const error = validateLinkName(file.name);

                if (error) {
                    throw new ValidationError(error);
                }

                const ParentLinkID = await parentLinkID;

                const [parentKeys, addressKeyInfo] = await Promise.all([
                    getLinkKeys(shareId, ParentLinkID),
                    getPrimaryAddressKey(),
                ]);

                const generateNameHash = async () => {
                    if (!('hashKey' in parentKeys)) {
                        throw Error('Missing hash key on folder link');
                    }
                    return {
                        filename: file.name,
                        hash: await generateLookupHash(lowercaseName, parentKeys.hashKey),
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

                if (canceled) {
                    throw new TransferCancel({ message: `Transfer canceled for file "${file.name}"` });
                }

                const { filename, hash: Hash } = noNameCheck
                    ? await generateNameHash()
                    : await findAvailableName(shareId, ParentLinkID, file.name);

                const Name = await encryptName(filename, parentKeys.privateKey.toPublic(), addressKeyInfo.privateKey);

                const fileMimeType = FEATURE_FLAGS.includes('drive-sprint-25')
                    ? await mimeTypeFromFile(file)
                    : undefined;

                const MIMEType = fileMimeType || lookup(filename) || 'application/octet-stream';

                if (canceled) {
                    throw new TransferCancel({ message: `Transfer canceled for file "${filename}"` });
                }

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
                        ContentKeyPacket,
                    })
                );

                return {
                    File,
                    filename,
                    Name,
                    MIMEType,
                    sessionKey,
                    privateKey,
                    addressKeyInfo,
                    ParentLinkID,
                };
            }),
            5
        )();

        const preUploadData: PreUploadData = {
            file,
            ParentLinkID: parentLinkID,
            ShareID: shareId,
        };

        return addToUploadQueue(
            preUploadData,
            setupPromise.then(({ filename, MIMEType, File, ParentLinkID }): {
                meta: TransferMeta;
                info: UploadInfo;
            } => ({
                meta: {
                    size: file.size,
                    mimeType: MIMEType,
                    filename,
                },
                info: {
                    ParentLinkID,
                    LinkID: File.ID,
                    RevisionID: File.RevisionID,
                },
            })),
            {
                transform: async (data) => {
                    const [
                        { sessionKey, privateKey: nodePrivateKey },
                        { privateKey: addressPrivateKey },
                    ] = await Promise.all([setupPromise, getPrimaryAddressKey()]);

                    const { message, signature } = await encryptMessage({
                        data,
                        sessionKey,
                        privateKeys: addressPrivateKey,
                        armor: false,
                        detached: true,
                    });

                    const { data: encryptedSignature } = await encryptMessage({
                        data: signature.packets.write(),
                        publicKeys: nodePrivateKey.toPublic(),
                        armor: true,
                    });

                    return {
                        encryptedData: message.packets.write(),
                        signature: encryptedSignature,
                    };
                },
                requestUpload: async (Blocks) => {
                    const { File, addressKeyInfo } = await setupPromise;

                    const BlockList = await Promise.all(
                        Blocks.map(({ Hash, ...block }) => ({ ...block, Hash: uint8ArrayToBase64String(Hash) }))
                    );

                    const { UploadLinks } = await debouncedRequest<RequestUploadResult>(
                        queryRequestUpload({
                            BlockList,
                            AddressID: addressKeyInfo.address.ID,
                            LinkID: File.ID,
                            RevisionID: File.RevisionID,
                            ShareID: shareId,
                        })
                    );
                    return UploadLinks;
                },
                finalize: queuedFunction(
                    'upload_finalize',
                    async (blockTokens, config) => {
                        const hashes: Uint8Array[] = [];
                        const BlockList: { Index: number; Token: string }[] = [];

                        for (let Index = 1; Index <= blockTokens.size; Index++) {
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
                        const [
                            { File },
                            {
                                signature,
                                address: { Email: SignatureAddress },
                            },
                        ] = await Promise.all([setupPromise, sign(contentHashes)]);

                        await debouncedRequest(
                            queryUpdateFileRevision(shareId, File.ID, File.RevisionID, {
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
                        canceled = true;
                        const { File, ParentLinkID } = await setupPromise;
                        await deleteChildrenLinks(shareId, ParentLinkID, [File.ID]);
                    } catch (err) {
                        if (!isTransferCancelError(err)) {
                            console.error(err);
                        }
                    }
                },
            }
        );
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
                await new Promise((resolve, reject) => {
                    openConfirmModal({
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
                                    const promise = (parentFolderPromise
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
            format: 'binary',
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
            },
        });

        downloadControls.start(api).catch(reject);

        return {
            contents: contentsPromise,
            controls: downloadControls,
        };
    };

    const saveFileTransferFromBuffer = async (content: Uint8Array[], meta: TransferMeta, info: DownloadInfo) => {
        return addToDownloadQueue(meta, info, {
            onStart: async () => content,
        });
    };

    const startFileTransfer = (shareId: string, linkId: string, meta: TransferMeta) => {
        return addToDownloadQueue(
            meta,
            { ShareID: shareId, LinkID: linkId },
            {
                transformBlockStream: decryptBlockStream(shareId, linkId),
                onStart: async () => getFileBlocks(shareId, linkId),
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

        const downloadFolder = async (linkId: string, filePath = ''): Promise<any> => {
            if (abortController.signal.aborted) {
                throw Error(`Folder download canceled for ${filePath}`);
            }

            await fetchAllFolderPages(shareId, linkId);
            const children = cache.get.childLinkMetas(shareId, linkId);

            if (!children) {
                return;
            }

            const promises = children.map(async (child) => {
                const path = `${filePath}/${child.Name}`;
                if (child.Type === LinkType.FILE) {
                    const promise = new Promise<void>((resolve, reject) => {
                        addDownload(
                            getMetaForTransfer(child),
                            { ShareID: shareId, LinkID: linkId },
                            {
                                transformBlockStream: decryptBlockStream(shareId, child.LinkID),
                                onStart: async (stream) => {
                                    cb.onStartFileTransfer({
                                        stream,
                                        path,
                                    }).catch(reject);
                                    return getFileBlocks(shareId, child.LinkID);
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
                    cb.onStartFolderTransfer(path).catch((err) => console.error(`Failed to zip empty folder ${err}`));
                    await downloadFolder(child.LinkID, path);
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
