import { ReadableStream } from 'web-streams-polyfill';
import { OpenPGPKey, SessionKey, decryptMessage, encryptMessage, getMessage, getSignature } from 'pmcrypto';
import { c } from 'ttag';

import { useApi, useEventManager, useNotifications, usePreventLeave, useGetUser } from '@proton/components';
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
    CreateFileRevisionResult,
    FileRevisionState,
    RequestUploadResult,
    NestedFileStream,
    DriveFileBlock,
} from '../../interfaces/file';
import {
    queryFileRevision,
    queryCreateFile,
    queryCreateFileRevision,
    queryUpdateFileRevision,
    queryDeleteFileRevision,
    queryRequestUpload,
} from '../../api/files';
import { useUploadProvider } from '../../components/uploads/UploadProvider';
import { TransferConflictStrategy } from '../../components/uploads/upload';
import {
    TransferMeta,
    TransferState,
    DownloadInfo,
    PreUploadData,
    TransferCancel,
    TransferConflict,
} from '../../interfaces/transfer';
import { useDownloadProvider } from '../../components/downloads/DownloadProvider';
import { initDownload, StreamTransformer } from '../../components/downloads/download';
import { streamToBuffer } from '../../utils/stream';
import { HashCheckResult, LinkType, FileLinkMeta, isFolderLinkMeta, LinkMeta } from '../../interfaces/link';
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
import useTrash from './useTrash';
import { FileBrowserItem } from '../../components/FileBrowser/interfaces';

const HASH_CHECK_AMOUNT = 10;

interface FileRevision {
    isNewFile: boolean;
    MIMEType: string;
    filename: string;
    fileID: string;
    revisionID: string;
    previousRevisionID?: string;
    sessionKey: SessionKey;
    privateKey: OpenPGPKey;
}

interface Folder {
    isNewFolder: boolean;
    folderID: string;
}

function useFiles() {
    const api = useApi();
    const { events, deleteChildrenLinks } = useDrive();
    const getUser = useGetUser();
    const cache = useDriveCache();
    const debouncedRequest = useDebouncedRequest();
    const queuedFunction = useQueuedFunction();
    const { createNotification } = useNotifications();
    const { getPrimaryAddressKey, getPrimaryAddressKeys, sign } = useDriveCrypto();
    const { getLinkMeta, getLinkKeys, fetchAllFolderPages, createNewFolder } = useDrive();
    const { addToDownloadQueue, addFolderToDownloadQueue } = useDownloadProvider();
    const {
        addToUploadQueue,
        getUploadsImmediate,
        getUploadsProgresses,
        getAbortController,
        getFolderConflictStrategy,
    } = useUploadProvider();
    const { preventLeave } = usePreventLeave();
    const { call } = useEventManager();
    const { openConfirmModal } = useConfirm();
    const { trashLinks } = useTrash();

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

    const getLinkByName = async (shareId: string, parentLinkID: string, name: string) => {
        await fetchAllFolderPages(shareId, parentLinkID);
        const children = cache.get.childLinkMetas(shareId, parentLinkID);
        return children?.find((link) => link.Name === name);
    };

    const createEmptyFolder = async (shareId: string, parentLinkID: string, folderName: string): Promise<Folder> => {
        const {
            Folder: { ID: folderID },
        } = await createNewFolder(shareId, parentLinkID, folderName);
        await events.call(shareId);
        return {
            folderID,
            isNewFolder: true,
        };
    };

    const getFolder = async (
        shareId: string,
        parentLinkID: string,
        folderName: string,
        abortSignal?: AbortSignal
    ): Promise<Folder> => {
        const link = await getLinkByName(shareId, parentLinkID, folderName);
        if (!link) {
            throw Error('Folder not found');
        }
        if (!isFolderLinkMeta(link)) {
            throw Error('File cannot be merged with folder');
        }
        if (abortSignal?.aborted) {
            throw new TransferCancel({ message: `Transfer canceled for file "${folderName}"` });
        }

        return {
            folderID: link.LinkID,
            isNewFolder: false,
        };
    };

    const replaceFolder = async (
        shareId: string,
        parentLinkID: string,
        folderName: string,
        abortSignal?: AbortSignal
    ): Promise<Folder> => {
        const link = await getLinkByName(shareId, parentLinkID, folderName);
        if (!link) {
            throw Error('Folder or file not found');
        }
        if (abortSignal?.aborted) {
            throw new TransferCancel({ message: `Transfer canceled for file "${folderName}"` });
        }

        await trashLinks(shareId, parentLinkID, [link.LinkID]);
        return createEmptyFolder(shareId, parentLinkID, folderName);
    };

    const prepareFolder = (
        shareId: string,
        parentLinkID: string,
        folderName: string,
        { checkNameAvailability = true, signal }: { checkNameAvailability?: boolean; signal?: AbortSignal } = {}
    ): Promise<Folder> => {
        const lowercaseName = folderName.toLowerCase();

        return queuedFunction(`upload_empty_folder:${lowercaseName}`, async () => {
            let adjustedFolderName = folderName;
            if (checkNameAvailability && !signal?.aborted) {
                const checkResult = await findAvailableName(shareId, parentLinkID, adjustedFolderName);
                adjustedFolderName = checkResult.filename;
            }

            if (signal?.aborted) {
                throw new TransferCancel({ message: `Upload folder "${folderName}" aborted in ${parentLinkID}` });
            }

            if (folderName === adjustedFolderName) {
                return createEmptyFolder(shareId, parentLinkID, folderName);
            }

            const link = await getLinkByName(shareId, parentLinkID, folderName);
            const originalIsFolder = link ? isFolderLinkMeta(link) : false;
            const conflictStrategy = await getFolderConflictStrategy(parentLinkID, folderName, originalIsFolder);
            if (conflictStrategy === TransferConflictStrategy.Rename) {
                return createEmptyFolder(shareId, parentLinkID, adjustedFolderName);
            }
            if (conflictStrategy === TransferConflictStrategy.Replace) {
                return replaceFolder(shareId, parentLinkID, folderName, signal);
            }
            if (conflictStrategy === TransferConflictStrategy.Merge) {
                return getFolder(shareId, parentLinkID, folderName, signal);
            }
            if (conflictStrategy === TransferConflictStrategy.Skip) {
                throw new TransferCancel({ message: `Upload folder "${folderName}" skipped` });
            }
            throw new Error(`Unknown conflict strategy: ${conflictStrategy}`);
        })();
    };

    const uploadDriveFile = async (shareId: string, parentLinkID: string | Promise<string>, file: File) => {
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
            const { sessionKey, ContentKeyPacket, ContentKeyPacketSignature } = await generateContentKeys(
                privateKey,
                addressKeyInfo.privateKey
            );

            if (!ContentKeyPacket) {
                throw new Error('Could not generate ContentKeyPacket');
            }

            return {
                NodeKey,
                NodePassphrase,
                NodePassphraseSignature,
                ContentKeyPacket,
                ContentKeyPacketSignature,
                sessionKey,
                privateKey,
                parentKeys,
                addressKeyInfo,
            };
        })();

        const createFile = async (abortSignal: AbortSignal, filename: string, hash: string): Promise<FileRevision> => {
            const {
                addressKeyInfo,
                ContentKeyPacket,
                ContentKeyPacketSignature,
                NodeKey,
                NodePassphrase,
                NodePassphraseSignature,
                parentKeys,
                privateKey,
                sessionKey,
            } = await setupPromise;

            const MIMEType = await mimeTypeFromFile(file);
            const Name = await encryptName(filename, parentKeys.privateKey.toPublic(), addressKeyInfo.privateKey);

            if (abortSignal.aborted) {
                throw new TransferCancel({ message: `Transfer canceled for file "${filename}"` });
            }

            // If create draft hasn't been cancel up to this point do not try to cancel it anymore
            const { File: createdFile } = await debouncedRequest<CreateFileResult>(
                queryCreateFile(shareId, {
                    ContentKeyPacket,
                    ContentKeyPacketSignature,
                    Hash: hash,
                    MIMEType,
                    Name,
                    NodeKey,
                    NodePassphrase,
                    NodePassphraseSignature,
                    ParentLinkID: await parentLinkID,
                    SignatureAddress: addressKeyInfo.address.Email,
                })
            );

            return {
                fileID: createdFile.ID,
                filename,
                isNewFile: true,
                MIMEType,
                privateKey,
                revisionID: createdFile.RevisionID,
                sessionKey,
            };
        };

        const createRevision = async (abortSignal: AbortSignal, link: FileLinkMeta): Promise<FileRevision> => {
            const currentActiveRevisionID = link.FileProperties.ActiveRevision?.ID;
            if (!currentActiveRevisionID) {
                throw Error('Missing active link revision');
            }

            const keys = await getLinkKeys(shareId, link.LinkID);
            if (!('sessionKeys' in keys)) {
                throw new Error('Session key missing on file link');
            }

            if (abortSignal.aborted) {
                throw new TransferCancel({ message: `Transfer canceled for file "${link.Name}"` });
            }

            const { Revision } = await debouncedRequest<CreateFileRevisionResult>(
                queryCreateFileRevision(shareId, link.LinkID, currentActiveRevisionID)
            ).catch((err) => {
                if (err.data?.Code === 2500) {
                    throw Error('The new revision of original file is not uploaded yet. Please try again later.');
                }
                throw err;
            });

            const MIMEType = await mimeTypeFromFile(file);

            return {
                isNewFile: false,
                MIMEType,
                filename: file.name,
                fileID: link.LinkID,
                revisionID: Revision.ID,
                previousRevisionID: currentActiveRevisionID,
                sessionKey: keys.sessionKeys as SessionKey,
                privateKey: keys.privateKey,
            };
        };

        // Replace file loads all children in the target folder and finds the link
        // which is about to be replaced. In case of the replacing link is folder,
        // the whole folder is moved to trash and new file is created. In case of
        // replacing file, new revision is created.
        const replaceFile = async (abortSignal: AbortSignal, filename: string): Promise<FileRevision> => {
            const link = await getLinkByName(shareId, await parentLinkID, file.name);
            // If collision happened but the link is not present, that means
            // the file is just being uploaded.
            if (!link) {
                throw Error('The original file is not uploaded yet. Please try again later.');
            }

            if (abortSignal.aborted) {
                throw new TransferCancel({ message: `Transfer canceled for file "${filename}"` });
            }

            if (isFolderLinkMeta(link)) {
                const { parentKeys } = await setupPromise;
                if (!('hashKey' in parentKeys)) {
                    throw Error('Missing hash key on folder link');
                }
                const hash = await generateLookupHash(file.name, parentKeys.hashKey);

                await trashLinks(shareId, await parentLinkID, [link.LinkID]);
                return createFile(abortSignal, file.name, hash);
            }
            return createRevision(abortSignal, link);
        };

        // Double queue: one deduplicated by file name to not upload file
        // with the same name in parallel, and one more queue around it
        // to not timeout (so the creation do not wait too long).
        const createFileRevision = queuedFunction(
            'create_file_revision',
            queuedFunction(
                `upload_setup:${file.name}`,
                async (abortSignal: AbortSignal, conflictStrategy?: string): Promise<FileRevision> => {
                    const { filename: newName, hash } = await findAvailableName(shareId, await parentLinkID, file.name);
                    if (abortSignal.aborted) {
                        throw new TransferCancel({ message: `Transfer canceled for file "${file.name}"` });
                    }
                    if (file.name === newName) {
                        return createFile(abortSignal, file.name, hash);
                    }
                    if (!conflictStrategy) {
                        throw new TransferConflict({ message: `Transfer conflict for file "${file.name}"` });
                    }
                    if (conflictStrategy === TransferConflictStrategy.Rename) {
                        return createFile(abortSignal, newName, hash);
                    }
                    if (
                        conflictStrategy === TransferConflictStrategy.Replace ||
                        conflictStrategy === TransferConflictStrategy.Merge
                    ) {
                        return replaceFile(abortSignal, file.name);
                    }
                    if (conflictStrategy === TransferConflictStrategy.Skip) {
                        throw new TransferCancel({ message: `Transfer skipped for file "${file.name}"` });
                    }
                    throw new Error(`Unknown conflict strategy: ${conflictStrategy}`);
                }
            ),
            5
        );

        const preUploadData: PreUploadData = {
            file,
            ParentLinkID: parentLinkID,
            ShareID: shareId,
        };

        let createdFileRevision: FileRevision | undefined;

        return addToUploadQueue(preUploadData, setupPromise, {
            initialize: async (abortSignal, conflictStrategy) => {
                const result = await createFileRevision(abortSignal, conflictStrategy);
                createdFileRevision = result;
                return result;
            },
            transform: async (data, attachedSignature = false) => {
                if (!createdFileRevision) {
                    throw new Error(`Draft for "${file.name}" hasn't been created prior to uploading`);
                }
                const { privateKey: addressPrivateKey } = await getPrimaryAddressKey();

                // Thumbnail has signature attached, regular file detached.
                if (attachedSignature) {
                    const { message } = await encryptMessage({
                        data,
                        sessionKey: createdFileRevision.sessionKey,
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
                    sessionKey: createdFileRevision.sessionKey,
                    privateKeys: addressPrivateKey,
                    armor: false,
                    detached: true,
                });

                const { data: encryptedSignature } = await encryptMessage({
                    data: signature.packets.write(),
                    sessionKey: createdFileRevision.sessionKey,
                    publicKeys: createdFileRevision.privateKey.toPublic(),
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

                if (!createdFileRevision) {
                    throw new Error(`Draft for "${file.name}" hasn't been created prior to uploading`);
                }

                const { UploadLinks, ThumbnailLink } = await debouncedRequest<RequestUploadResult>(
                    queryRequestUpload({
                        BlockList,
                        AddressID: addressKeyInfo.address.ID,
                        LinkID: createdFileRevision.fileID,
                        RevisionID: createdFileRevision.revisionID,
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

                    if (!createdFileRevision) {
                        throw new Error(`Draft for "${file.name}" hasn't been created prior to uploading`);
                    }

                    await debouncedRequest(
                        queryUpdateFileRevision(shareId, createdFileRevision.fileID, createdFileRevision.revisionID, {
                            State: FileRevisionState.Active,
                            BlockList,
                            ManifestSignature: signature,
                            SignatureAddress,
                        })
                    );

                    // Replacing file should keep only one revision because we
                    // don't use revisions now at all (UI is not ready to handle
                    // situation that size of the file is sum of all revisions,
                    // there is no option to list them or delete them and so on).
                    if (createdFileRevision.previousRevisionID) {
                        await debouncedRequest(
                            queryDeleteFileRevision(
                                shareId,
                                createdFileRevision.fileID,
                                createdFileRevision.previousRevisionID
                            )
                        );
                    }

                    events.callAll(shareId).catch(console.error);
                },
                5
            ),
            onError: async () => {
                try {
                    if (createdFileRevision) {
                        if (createdFileRevision.isNewFile) {
                            await deleteChildrenLinks(shareId, await parentLinkID, [createdFileRevision.fileID]);
                        } else {
                            await debouncedRequest(
                                queryDeleteFileRevision(
                                    shareId,
                                    createdFileRevision.fileID,
                                    createdFileRevision.revisionID
                                )
                            );
                        }
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

            const folderPromises = new Map<string, Promise<Folder>>();

            for (let i = 0; i < files.length; i++) {
                const entry = files[i];

                const file = 'path' in entry ? entry.file : entry;

                if (signal.aborted) {
                    return;
                }

                const uploadFile = (parentLinkID: string | Promise<string>, file: File) => {
                    if (!signal.aborted) {
                        preventLeave(uploadDriveFile(shareId, parentLinkID, file)).catch((err) => {
                            if (!isTransferCancelError(err)) {
                                console.error(err);
                            }
                        });
                    }
                };

                const uploadFolder = (parentLinkID: string, folderName: string, isParentNew = false) => {
                    return prepareFolder(shareId, parentLinkID, folderName, {
                        // Only freshly created parents can skip check name
                        // duplicity for children folders. Folders are created
                        // right away, so its safe. But with files, its better
                        // to always do the check because any other client
                        // could upload duplicate files even to new folders
                        // (consider that upload can take hours to finish).
                        checkNameAvailability: !isParentNew,
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
                                    const promise = parentFolderPromise
                                        ? parentFolderPromise.then(({ folderID, isNewFolder }) =>
                                              uploadFolder(folderID, folder, isNewFolder)
                                          )
                                        : uploadFolder(ParentLinkID, folder, false);
                                    folderPromises.set(path, promise);
                                }

                                const folderIDPromise = folderPromises.get(path)?.then(({ folderID }) => folderID);

                                if (folderIDPromise && file) {
                                    uploadFile(folderIDPromise, file);
                                }

                                folderIDPromise?.catch((err) => {
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
            const addressPublicKeys = (await getPrimaryAddressKeys()).map(({ publicKey }) => publicKey);

            // Thumbnails have attached signature, regular file detached one.
            if (!encSignature) {
                const message = await getStreamMessage(stream);
                const { data } = await decryptMessage({
                    message,
                    sessionKeys: keys.sessionKeys,
                    publicKeys: addressPublicKeys,
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
                publicKeys: addressPublicKeys,
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
        forcedChildren: FileBrowserItem[] | undefined,
        cb: {
            onStartFileTransfer: (file: NestedFileStream) => Promise<void>;
            onStartFolderTransfer: (path: string) => Promise<void>;
        }
    ) => {
        const { addDownload, startDownloads } = addFolderToDownloadQueue(folderName, {
            ShareID: shareId,
            LinkID: linkId,
            children: forcedChildren,
        });
        const fileStreamPromises: Promise<void>[] = [];
        const abortController = new AbortController();

        const downloadFolder = async (linkId: string, parentPath = ''): Promise<any> => {
            if (abortController.signal.aborted) {
                throw Error(`Folder download canceled for ${parentPath}`);
            }

            if (parentPath !== '') {
                cb.onStartFolderTransfer(parentPath).catch((err) => console.error(`Failed to zip folder ${err}`));
            }

            let children;
            if (linkId === '' && forcedChildren) {
                children = forcedChildren;
            } else {
                await fetchAllFolderPages(shareId, linkId);
                children = cache.get.childLinkMetas(shareId, linkId);
            }

            if (!children) {
                return;
            }

            const promises = children.map(async (child: LinkMeta | FileBrowserItem) => {
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
                    await downloadFolder(child.LinkID, folderPath);
                }
            });

            await Promise.all(promises);
        };

        await downloadFolder(linkId, folderName);
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
