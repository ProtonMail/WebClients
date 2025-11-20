import { c } from 'ttag';

import type { PrivateKeyReference, SessionKey } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import {
    queryDeleteFileRevision,
    queryPublicCreateFile,
    queryPublicRequestUpload,
    queryPublicUpdateFileRevision,
    queryPublicVerificationData,
} from '@proton/shared/lib/api/drive/files';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type {
    CreateFileResult,
    GetVerificationDataResult,
    RequestUploadResult,
} from '@proton/shared/lib/interfaces/drive/file';
import { encryptName } from '@proton/shared/lib/keys/driveKeys';

import { TransferCancel } from '../../../components/TransferManager/transfer';
import useQueuedFunction from '../../../hooks/util/useQueuedFunction';
import { logError } from '../../../utils/errorHandling';
import { EnrichedError } from '../../../utils/errorHandling/EnrichedError';
import { ValidationError } from '../../../utils/errorHandling/ValidationError';
import { isErrorDueToNameConflict } from '../../../utils/isErrorDueToNameConflict';
import { replaceLocalURL } from '../../../utils/replaceLocalURL';
import retryOnError from '../../../utils/retryOnError';
import { isPhotosDisabledUploadError } from '../../../utils/transfer';
import { useAnonymousUploadAuthStore } from '../../../zustand/upload/anonymous-auth.store';
import { usePublicSession } from '../../_api';
import { integrityMetrics } from '../../_crypto';
import { useLink, usePublicLinksActions, usePublicLinksListing, validateLinkName } from '../../_links';
import { useDefaultShare, useShare } from '../../_shares';
import { useGetMetricsUserPlan } from '../../_user/useGetMetricsUserPlan';
import { MAX_TOO_MANY_REQUESTS_WAIT, MAX_UPLOAD_BLOCKS_LOAD } from '../constants';
import { initUploadFileWorker } from '../initUploadFileWorker';
import type {
    FileKeys,
    FileRequestBlock,
    PhotoUpload,
    ThumbnailRequestBlock,
    UploadFileControls,
    VerificationData,
} from '../interface';
import type { ConflictStrategyHandler } from './interface';
import { generateClientUid } from './uploadClientUid';
import usePublicUploadHelper from './usePublicUploadHelper';

type LogCallback = (message: string) => void;

interface FileRevision {
    isNewFile: boolean;
    filename: string;
    fileID: string;
    revisionID: string;
    previousRevisionID?: string;
    sessionKey: SessionKey;
    privateKey: PrivateKeyReference;
    // Callbacks to control local client UIDs.
    // See useUploadClientUid for more details.
    uploadFinished: () => void;
    uploadFailed: () => void;
}

export default function usePublicUploadFile() {
    const userPlan = useGetMetricsUserPlan();
    const setUploadToken = useAnonymousUploadAuthStore((state) => state.setUploadToken);
    const { request: publicDebouncedRequest, user } = usePublicSession();
    const queuedFunction = useQueuedFunction();
    const { getLinkPrivateKey, getLinkHashKey } = useLink();
    const { deleteLinks } = usePublicLinksActions();
    const { findHash, findAvailableName } = usePublicUploadHelper();
    const publicLinksListing = usePublicLinksListing();

    const { getShareCreatorKeys } = useShare();

    const { getDefaultShare } = useDefaultShare();

    const request = <T>(args: object, abortSignal?: AbortSignal) => {
        return publicDebouncedRequest<T>(
            {
                ...args,
                maxRetryWaitSeconds: MAX_TOO_MANY_REQUESTS_WAIT,
            },
            abortSignal
        );
    };

    const initPublicFileUpload = (
        token: string,
        parentLinkId: string,
        file: File,
        getFileConflictStrategy: ConflictStrategyHandler,
        log: LogCallback,
        isForPhotos: boolean = false
    ): UploadFileControls => {
        let shareKeysCache: Awaited<ReturnType<typeof getShareCreatorKeys>>;
        const getShareKeys = async (abortSignal: AbortSignal) => {
            // Not logged-in user
            if (!user) {
                return undefined;
            }
            if (!shareKeysCache) {
                const defaultShare = await getDefaultShare();
                shareKeysCache = await getShareCreatorKeys(abortSignal, defaultShare);
            }

            return shareKeysCache;
        };
        const createFile = async (
            abortSignal: AbortSignal,
            filename: string,
            mimeType: string,
            hash: string,
            keys: FileKeys,
            previousClientUid?: string
        ): Promise<FileRevision> => {
            const error = validateLinkName(file.name);
            if (error) {
                throw new ValidationError(error);
            }

            const [addressKeyInfo, parentPrivateKey] = await Promise.all([
                getShareKeys(abortSignal),
                getLinkPrivateKey(abortSignal, token, parentLinkId),
            ]);
            // We use the parent node key for Name
            const Name = await encryptName(filename, parentPrivateKey, addressKeyInfo?.privateKey || parentPrivateKey);

            checkSignal(abortSignal, filename);

            const { clientUid, uploadFinished, uploadFailed } = generateClientUid(previousClientUid);

            // Do not abort using signal - file could be created and we
            // wouldn't know ID to do proper cleanup.
            const createFilePromise = () =>
                request<CreateFileResult>(
                    queryPublicCreateFile(token, {
                        ContentKeyPacket: keys.contentKeyPacket,
                        ContentKeyPacketSignature: keys.contentKeyPacketSignature,
                        Hash: hash,
                        MIMEType: mimeType,
                        Name,
                        NodeKey: keys.nodeKey,
                        NodePassphrase: keys.nodePassphrase,
                        NodePassphraseSignature: keys.nodePassphraseSignature,
                        ParentLinkID: parentLinkId,
                        SignatureEmail: addressKeyInfo?.address.Email,
                        ClientUID: clientUid,
                    })
                ).catch((err) => {
                    uploadFailed();

                    // See RFC Feature flag handling for more info
                    if (err.status === 424 && err.data?.Code === API_CUSTOM_ERROR_CODES.FEATURE_DISABLED) {
                        const error = new Error(
                            isForPhotos
                                ? c('Error').t`Photos upload is temporarily disabled. Please try again later`
                                : c('Error').t`Upload for this folder is temporarily disabled`
                        );
                        if (isForPhotos) {
                            error.name = 'PhotosUploadDisabled';
                        }
                        throw error;
                    }
                    throw err;
                });
            const createFile = retryOnError<CreateFileResult>({
                fn: () => createFilePromise(),
                shouldRetryBasedOnError: (error: unknown) => isPhotosDisabledUploadError(error as Error),
                maxRetriesNumber: 3,
                backoff: true,
            });

            const { File: createdFile, AuthorizationToken } = await createFile();
            if (AuthorizationToken) {
                setUploadToken({ linkId: createdFile.ID, authorizationToken: AuthorizationToken });
            }
            return {
                fileID: createdFile.ID,
                filename,
                isNewFile: true,
                privateKey: keys.privateKey,
                revisionID: createdFile.RevisionID,
                sessionKey: keys.sessionKey,
                uploadFinished,
                uploadFailed,
            };
        };

        // const createRevision = async (abortSignal: AbortSignal, link: DecryptedLink): Promise<FileRevision> => {
        //     const currentActiveRevisionID = link.activeRevision?.id;
        //     if (!currentActiveRevisionID) {
        //         throw new Error(c('Error').t`The original file has missing active revision`);
        //     }

        //     const [privateKey, sessionKey] = await Promise.all([
        //         getLinkPrivateKey(abortSignal, token, link.linkId),
        //         getLinkSessionKey(abortSignal, token, link.linkId),
        //     ]);
        //     if (!sessionKey) {
        //         throw new Error(c('Error').t`The original file has missing session key`);
        //     }

        //     checkSignal(abortSignal, link.name);

        //     const { clientUid, uploadFinished, uploadFailed } = generateClientUid();

        //     // Do not abort using signal - revision could be created and we
        //     // wouldn't know ID to do proper cleanup.
        //     const { Revision } = await request<CreateFileRevisionResult>(
        //         queryCreateFileRevision(token, link.linkId, currentActiveRevisionID, clientUid)
        //     ).catch((err) => {
        //         if (err.data?.Code === 2500) {
        //             throw new UploadUserError(
        //                 c('Error').t`The new revision of original file is not uploaded yet, please try again later`
        //             );
        //         }
        //         throw err;
        //     });

        //     return {
        //         isNewFile: false,
        //         filename: file.name,
        //         fileID: link.linkId,
        //         revisionID: Revision.ID,
        //         previousRevisionID: currentActiveRevisionID,
        //         sessionKey,
        //         privateKey,
        //         uploadFinished,
        //         uploadFailed,
        //     };
        // };

        /**
         * replaceFile loads all children in the target folder and finds
         * the link which is about to be replaced. If the original link is
         * a folder, the the whole folder is moved to trash and new file is
         * created. If the original link is file, new revision is created.
         */
        // const replaceFile = async (
        //     abortSignal: AbortSignal,
        //     mimeType: string,
        //     keys: FileKeys
        // ): Promise<FileRevision> => {
        //     const link = await getLinkByName(abortSignal, token, parentLinkId, file.name);
        //     // If collision happened but the link is not present, that means
        //     // the file is just being uploaded.
        //     if (!link) {
        //         throw new UploadUserError(c('Error').t`The original file is not uploaded yet, please try again later`);
        //     }

        //     checkSignal(abortSignal, file.name);
        //     if (!link.isFile) {
        //         const parentHashKey = await getLinkHashKey(abortSignal, token, parentLinkId);
        //         if (!parentHashKey) {
        //             throw Error(c('Error').t`The original file has missing hash key`);
        //         }
        // const hash = await generateLookupHash(file.name, parentHashKey);

        //         await trashLinks(abortSignal, [{ shareId: token, parentLinkId: parentLinkId, linkId: link.linkId }]);
        //         return createFile(abortSignal, file.name, mimeType, hash, keys);
        //     }
        //     return createRevision(abortSignal, link);
        // };

        /**
         * replaceDraft removes previous link completely and creates new
         * file, because API does not allow creation of new revision for link
         * without any revision. One day it would be good to keep the draft
         * and just finish upload of the missing blocks.
         */
        const replaceDraft = async (
            abortSignal: AbortSignal,
            filename: string,
            mimeType: string,
            hash: string,
            keys: FileKeys,
            linkId: string,
            clientUid?: string
        ) => {
            await deleteLinks(abortSignal, { token, parentLinkId, linkIds: [linkId] });
            return createFile(abortSignal, filename, mimeType, hash, keys, clientUid);
        };

        // const handleNameConflict = async (
        //     abortSignal: AbortSignal,
        //     mimeType: string,
        //     keys: FileKeys,
        //     {
        //         filename,
        //         hash,
        //         draftLinkId,
        //     }: {
        //         filename: string;
        //         hash: string;
        //         draftLinkId?: string;
        //     }
        // ) => {
        //     log(`Name conflict`);
        //     const link = await getLinkByName(abortSignal, token, parentLinkId, file.name);
        //     const originalIsFolder = link ? !link.isFile : false;

        //     const conflictStrategy = await getFileConflictStrategy(abortSignal, !!draftLinkId, originalIsFolder);
        //     log(`Conflict resolved with: ${conflictStrategy}`);
        //     if (conflictStrategy === TransferConflictStrategy.Rename) {
        //         log(`Creating new file`);
        //         return createFile(abortSignal, filename, mimeType, hash, keys);
        //     }
        //     if (conflictStrategy === TransferConflictStrategy.Replace) {
        //         if (draftLinkId) {
        //             log(`Replacing draft`);
        //             return replaceDraft(abortSignal, file.name, mimeType, hash, keys, draftLinkId);
        //         }
        //         log(`Replacing file`);
        //         return replaceFile(abortSignal, mimeType, keys);
        //     }
        //     if (conflictStrategy === TransferConflictStrategy.Skip) {
        //         throw new TransferCancel({ message: c('Info').t`Transfer skipped for file "${file.name}"` });
        //     }
        //     throw new Error(`Unknown conflict strategy: ${conflictStrategy}`);
        // };

        // const findHash = async (
        //     abortSignal: AbortSignal,
        //     { shareId, parentLinkId, filename }: { shareId: string; parentLinkId: string; filename: string }
        // ) => {
        //     const parentHashKey = await getLinkHashKey(abortSignal, shareId, parentLinkId);
        //     if (!parentHashKey) {
        //         throw Error('Missing hash key on folder link');
        //     }

        //     const hash = await generateLookupHash(filename, parentHashKey);

        //     return hash;
        // };

        const createOptimisticFileRevision = queuedFunction(
            'create_file_revision',
            async (abortSignal: AbortSignal, mimeType: string, keys: FileKeys): Promise<FileRevision> => {
                const hash = await findHash(abortSignal, {
                    shareId: token,
                    parentLinkId: parentLinkId,
                    filename: file.name,
                });

                checkSignal(abortSignal, file.name);

                log(`Creating new file`);
                return createFile(abortSignal, file.name, mimeType, hash, keys).catch(async (err) => {
                    if (isErrorDueToNameConflict(err)) {
                        const {
                            filename: newName,
                            hash,
                            draftLinkId,
                            clientUid,
                        } = await findAvailableName(abortSignal, {
                            shareId: token,
                            parentLinkId: parentLinkId,
                            filename: file.name,
                        });

                        checkSignal(abortSignal, file.name);

                        // Automatically replace file - previous draft was uploaded
                        // by the same client.
                        if (draftLinkId && clientUid) {
                            log(`Automatically replacing draft link ID: ${draftLinkId}`);
                            // Careful: uploading duplicate file has different name and
                            // this newName has to be used, not file.name.
                            // Example: upload A, then do it again with adding number
                            // A (2) which will fail, then do it again to replace draft
                            // with new upload - it needs to be A (2), not just A.
                            return replaceDraft(abortSignal, newName, mimeType, hash, keys, draftLinkId, clientUid);
                        }

                        // No support for conflict for now, we create a new folder
                        return createFile(abortSignal, newName, mimeType, hash, keys);
                    }
                    throw err;
                });
            },
            MAX_UPLOAD_BLOCKS_LOAD
        );

        const selectFileRevisionCreation = (abortSignal: AbortSignal, mimeType: string, keys: FileKeys) => {
            return createOptimisticFileRevision(abortSignal, mimeType, keys);
        };

        // If the upload was aborted but we already called finalize to commit
        // revision, we cannot delete the revision. API does not support
        // aborting of request, so the request will finish anyway. And calling
        // deletion and revision commiting at the same time can cause confusing
        // error "file not found".
        // Other options would be to wait for finalize to finish and then to
        // delete it right away. But thats more complex and probably this is
        // safer option to do.
        let finalizeCalled = false;
        // Keep promise reference so when upload is canceled but init is not
        // finished yet, onError handler can wait for the creation to get ID
        // with created file or revision to do proper clean-up.
        let createdFileRevisionPromise: Promise<FileRevision>;

        return initUploadFileWorker(
            file,
            isForPhotos,
            {
                initialize: async (abortSignal: AbortSignal) => {
                    log(`Loading parent keys`);
                    const [addressKeyInfo, parentPrivateKey] = await Promise.all([
                        getShareKeys(abortSignal),
                        getLinkPrivateKey(abortSignal, token, parentLinkId),
                    ]);
                    return {
                        addressPrivateKey: addressKeyInfo?.privateKey,
                        parentPrivateKey,
                    };
                },
                createFileRevision: async (abortSignal: AbortSignal, mimeType: string, keys: FileKeys) => {
                    createdFileRevisionPromise = selectFileRevisionCreation(abortSignal, mimeType, keys);
                    const [createdFileRevision, addressKeyInfo, parentHashKey] = await Promise.all([
                        createdFileRevisionPromise,
                        getShareKeys(abortSignal),
                        getLinkHashKey(abortSignal, token, parentLinkId),
                    ]);
                    checkSignal(abortSignal, createdFileRevision.filename);
                    log(`Link ID: ${createdFileRevision.fileID}, revision ID: ${createdFileRevision.revisionID}`);

                    return {
                        fileName: createdFileRevision.filename,
                        privateKey: createdFileRevision.privateKey,
                        sessionKey: createdFileRevision.sessionKey,
                        parentHashKey,
                        address: addressKeyInfo
                            ? {
                                  privateKey: addressKeyInfo.privateKey,
                                  email: addressKeyInfo.address.Email,
                              }
                            : undefined,
                    };
                },
                getVerificationData: async (abortSignal: AbortSignal) => {
                    const createdFileRevision = await createdFileRevisionPromise;
                    if (!createdFileRevision) {
                        throw new Error(`Draft for "${file.name}" hasn't been created prior to verifying`);
                    }

                    log(`Requesting verifier data`);
                    try {
                        const { VerificationCode, ContentKeyPacket } = await request<GetVerificationDataResult>(
                            queryPublicVerificationData(
                                token,
                                createdFileRevision.fileID,
                                createdFileRevision.revisionID
                            ),
                            abortSignal
                        );

                        const verifierSessionKey = await CryptoProxy.decryptSessionKey({
                            binaryMessage: Uint8Array.fromBase64(ContentKeyPacket),
                            decryptionKeys: createdFileRevision.privateKey,
                        });

                        if (!verifierSessionKey) {
                            throw new Error('Verification session key could not be decrypted');
                        }

                        return {
                            verificationCode: Uint8Array.fromBase64(VerificationCode),
                            verifierSessionKey,
                        } satisfies VerificationData;
                    } catch (e) {
                        throw new EnrichedError('Upload failed: Verification of data failed', {
                            extra: { e },
                        });
                    }
                },
                createBlockLinks: async (
                    abortSignal: AbortSignal,
                    fileBlocks: FileRequestBlock[],
                    thumbnailBlocks?: ThumbnailRequestBlock[]
                ) => {
                    const createdFileRevision = await createdFileRevisionPromise;
                    if (!createdFileRevision) {
                        throw new Error(`Draft for "${file.name}" hasn't been created prior to uploading`);
                    }
                    log(
                        `Requesting tokens for ${fileBlocks.length} blocks and ${
                            thumbnailBlocks?.length || 0
                        } thumbnail blocks`
                    );
                    const addressKeyInfo = await getShareKeys(abortSignal);
                    const { UploadLinks, ThumbnailLinks } = await request<RequestUploadResult>(
                        queryPublicRequestUpload(token, {
                            BlockList: fileBlocks.map((block) => ({
                                Index: block.index,
                                Hash: block.hash.toBase64(),
                                EncSignature: !!block.signature ? block.signature : undefined,
                                Size: block.size,
                                Verifier: {
                                    Token: block.verificationToken.toBase64(),
                                },
                            })),
                            SignatureEmail: addressKeyInfo?.address.Email,
                            LinkID: createdFileRevision.fileID,
                            RevisionID: createdFileRevision.revisionID,
                            ThumbnailList: thumbnailBlocks?.map((block) => ({
                                Hash: block.hash.toBase64(),
                                Size: block.size,
                                Type: block.type,
                            })),
                        }),
                        abortSignal
                    );
                    log(
                        `Got tokens for ${UploadLinks.length} blocks and ${
                            ThumbnailLinks?.length || 0
                        } thumbnail blocks`
                    );

                    return {
                        fileLinks: UploadLinks.map((link, index) => ({
                            index: fileBlocks[index].index,
                            token: link.Token,
                            url: replaceLocalURL(link.BareURL),
                        })),
                        thumbnailLinks: thumbnailBlocks
                            ? ThumbnailLinks?.map((link, index) => ({
                                  index: thumbnailBlocks[index].index,
                                  token: link.Token,
                                  url: replaceLocalURL(link.BareURL),
                              }))
                            : undefined,
                    };
                },
                finalize: queuedFunction(
                    'upload_finalize',
                    async (
                        signature: string,
                        signatureEmail: string | undefined,
                        xattr: string,
                        photo?: PhotoUpload
                    ) => {
                        const createdFileRevision = await createdFileRevisionPromise;
                        if (!createdFileRevision) {
                            throw new Error(`Draft for "${file.name}" hasn't been created prior to uploading`);
                        }

                        if (finalizeCalled) {
                            return;
                        }
                        finalizeCalled = true;

                        log(`Commiting revision`);
                        await request(
                            queryPublicUpdateFileRevision(
                                token,
                                createdFileRevision.fileID,
                                createdFileRevision.revisionID,
                                {
                                    ManifestSignature: signature,
                                    SignatureEmail: !!signatureEmail ? signatureEmail : undefined,
                                    XAttr: xattr,
                                    Photo: photo
                                        ? {
                                              MainPhotoLinkID: null, // This is for live photos
                                              CaptureTime: photo.captureTime || 0,
                                              Exif: photo.encryptedExif,
                                              ContentHash: photo.contentHash,
                                          }
                                        : undefined,
                                }
                            )
                        );
                        log(`Revision commited`);

                        createdFileRevision.uploadFinished();

                        await publicLinksListing.loadChildren(new AbortController().signal, token, parentLinkId, false);
                    }
                ),
                onError: async (err) => {
                    if (finalizeCalled && err.name === 'AbortError') {
                        return;
                    }
                    finalizeCalled = true;

                    // If creation of revision failed, it is already processed by
                    // this handler. Do not throw it here again.
                    const createdFileRevision = await createdFileRevisionPromise?.catch(() => undefined);
                    try {
                        if (createdFileRevision) {
                            createdFileRevision.uploadFailed();
                            if (createdFileRevision.isNewFile) {
                                log(`Deleting file`);
                                // Cleanup should not be able to abort.
                                await deleteLinks(new AbortController().signal, {
                                    token,
                                    parentLinkId,
                                    linkIds: [createdFileRevision.fileID],
                                });
                            } else {
                                log(`Deleting revision`);
                                await request(
                                    queryDeleteFileRevision(
                                        token,
                                        createdFileRevision.fileID,
                                        createdFileRevision.revisionID
                                    )
                                );
                            }
                        }
                    } catch (err: any) {
                        log(`Cleanup failed due to ${err}`);
                        logError(err);
                    }
                },
                notifyVerificationError: (retryHelped: boolean) => {
                    const options = {
                        plan: userPlan,
                        retryHelped,
                    };
                    integrityMetrics.nodeBlockVerificationError('shared_public', file.size, options);
                },
            },
            (message) => log(`worker: ${message}`)
        );
    };

    return {
        initPublicFileUpload,
    };
}

function checkSignal(abortSignal: AbortSignal, name: string) {
    if (abortSignal.aborted) {
        throw new TransferCancel({ message: c('Info').t`Transfer canceled for file "${name}"` });
    }
}
