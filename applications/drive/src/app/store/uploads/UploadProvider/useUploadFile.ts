import { OpenPGPKey, SessionKey } from 'pmcrypto';
import { c } from 'ttag';

import {
    generateNodeKeys,
    generateContentKeys,
    generateLookupHash,
    encryptName,
} from '@proton/shared/lib/keys/driveKeys';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import {
    queryCreateFile,
    queryCreateFileRevision,
    queryUpdateFileRevision,
    queryDeleteFileRevision,
    queryRequestUpload,
} from '@proton/shared/lib/api/drive/files';
import {
    CreateFileResult,
    CreateFileRevisionResult,
    FileRevisionState,
    RequestUploadResult,
} from '@proton/shared/lib/interfaces/drive/file';
import { TransferCancel } from '@proton/shared/lib/interfaces/drive/transfer';

import useQueuedFunction from '../../../hooks/util/useQueuedFunction';
import { logError } from '../../utils';
import { useDebouncedRequest } from '../../api';
import { useDriveCrypto } from '../../crypto';
import { useDriveEventManager } from '../../events';
import {
    DecryptedLink,
    LinkType,
    useLink,
    useLinksActions,
    ecryptFileExtendedAttributes,
    ValidationError,
    validateLinkName,
} from '../../links';
import { MAX_UPLOAD_BLOCKS_LOAD } from '../constants';
import {
    TransferConflictStrategy,
    FileRequestBlock,
    ThumbnailRequestBlock,
    BlockToken,
    UploadFileControls,
} from '../interface';
import { initUploadFileWorker } from '../initUploadFileWorker';
import { ConflictStrategyHandler, UploadUserError } from './interface';
import useUploadHelper from './useUploadHelper';

interface FileRevision {
    isNewFile: boolean;
    filename: string;
    fileID: string;
    revisionID: string;
    previousRevisionID?: string;
    sessionKey: SessionKey;
    privateKey: OpenPGPKey;
}

export default function useUploadFile() {
    const debouncedRequest = useDebouncedRequest();
    const queuedFunction = useQueuedFunction();
    const { getLinkPrivateKey, getLinkSessionKey, getLinkHashKey } = useLink();
    const { trashLinks, deleteChildrenLinks } = useLinksActions();
    const { getPrimaryAddressKey } = useDriveCrypto();
    const { findAvailableName, getLinkByName } = useUploadHelper();
    const driveEventManager = useDriveEventManager();

    const initFileUpload = (
        shareId: string,
        parentId: string,
        file: File,
        getFileConflictStrategy: ConflictStrategyHandler
    ): UploadFileControls => {
        const addressKeyInfoPromise = getPrimaryAddressKey();

        const generateFileKeys = async (abortSignal: AbortSignal) => {
            const error = validateLinkName(file.name);
            if (error) {
                throw new ValidationError(error);
            }

            const [parentPrivateKey, addressKeyInfo] = await Promise.all([
                getLinkPrivateKey(abortSignal, shareId, parentId),
                addressKeyInfoPromise,
            ]);
            const { NodeKey, privateKey, NodePassphrase, NodePassphraseSignature } = await generateNodeKeys(
                parentPrivateKey,
                addressKeyInfo.privateKey
            );
            const { sessionKey, ContentKeyPacket, ContentKeyPacketSignature } = await generateContentKeys(
                privateKey,
                addressKeyInfo.privateKey
            );

            if (!ContentKeyPacket) {
                throw new Error(c('Error').t`Could not generate file keys`);
            }

            return {
                NodeKey,
                NodePassphrase,
                NodePassphraseSignature,
                ContentKeyPacket,
                ContentKeyPacketSignature,
                sessionKey,
                privateKey,
                parentPrivateKey,
                addressKeyInfo,
            };
        };

        const createFile = async (
            abortSignal: AbortSignal,
            filename: string,
            mimeType: string,
            hash: string
        ): Promise<FileRevision> => {
            const {
                addressKeyInfo,
                ContentKeyPacket,
                ContentKeyPacketSignature,
                NodeKey,
                NodePassphrase,
                NodePassphraseSignature,
                parentPrivateKey,
                privateKey,
                sessionKey,
            } = await generateFileKeys(abortSignal);

            const Name = await encryptName(filename, parentPrivateKey.toPublic(), addressKeyInfo.privateKey);

            checkSignal(abortSignal, filename);

            // Do not abort using signal - file could be created and we
            // wouldn't know ID to do proper cleanup.
            const { File: createdFile } = await debouncedRequest<CreateFileResult>(
                queryCreateFile(shareId, {
                    ContentKeyPacket,
                    ContentKeyPacketSignature,
                    Hash: hash,
                    MIMEType: mimeType,
                    Name,
                    NodeKey,
                    NodePassphrase,
                    NodePassphraseSignature,
                    ParentLinkID: parentId,
                    SignatureAddress: addressKeyInfo.address.Email,
                })
            );

            return {
                fileID: createdFile.ID,
                filename,
                isNewFile: true,
                privateKey,
                revisionID: createdFile.RevisionID,
                sessionKey,
            };
        };

        const createRevision = async (abortSignal: AbortSignal, link: DecryptedLink): Promise<FileRevision> => {
            const currentActiveRevisionID = link.activeRevision?.id;
            if (!currentActiveRevisionID) {
                throw new Error(c('Error').t`The original file has missing active revision`);
            }

            const [privateKey, sessionKey] = await Promise.all([
                getLinkPrivateKey(abortSignal, shareId, link.linkId),
                getLinkSessionKey(abortSignal, shareId, link.linkId),
            ]);
            if (!sessionKey) {
                throw new Error(c('Error').t`The original file has missing session key`);
            }

            checkSignal(abortSignal, link.name);

            // Do not abort using signal - revision could be created and we
            // wouldn't know ID to do proper cleanup.
            const { Revision } = await debouncedRequest<CreateFileRevisionResult>(
                queryCreateFileRevision(shareId, link.linkId, currentActiveRevisionID)
            ).catch((err) => {
                if (err.data?.Code === 2500) {
                    throw new UploadUserError(
                        c('Error').t`The new revision of original file is not uploaded yet, please try again later`
                    );
                }
                throw err;
            });

            return {
                isNewFile: false,
                filename: file.name,
                fileID: link.linkId,
                revisionID: Revision.ID,
                previousRevisionID: currentActiveRevisionID,
                sessionKey,
                privateKey,
            };
        };

        /**
         * replaceFile loads all children in the target folder and finds
         * the link which is about to be replaced. If the original link is
         * a folder, the the whole folder is moved to trash and new file is
         * created. If the original link is file, new revision is created.
         */
        const replaceFile = async (abortSignal: AbortSignal, mimeType: string): Promise<FileRevision> => {
            const link = await getLinkByName(abortSignal, shareId, parentId, file.name);
            // If collision happened but the link is not present, that means
            // the file is just being uploaded.
            if (!link) {
                throw new UploadUserError(c('Error').t`The original file is not uploaded yet, please try again later`);
            }

            checkSignal(abortSignal, file.name);
            if (link.type === LinkType.FOLDER) {
                const parentHashKey = await getLinkHashKey(abortSignal, shareId, parentId);
                if (!parentHashKey) {
                    throw Error(c('Error').t`The original file has missing hash key`);
                }
                const hash = await generateLookupHash(file.name, parentHashKey);

                await trashLinks(abortSignal, shareId, parentId, [link.linkId]);
                return createFile(abortSignal, file.name, mimeType, hash);
            }
            return createRevision(abortSignal, link);
        };

        const createFileRevision = queuedFunction(
            'create_file_revision',
            async (abortSignal: AbortSignal, mimeType: string): Promise<FileRevision> => {
                const { filename: newName, hash } = await findAvailableName(abortSignal, shareId, parentId, file.name);
                checkSignal(abortSignal, file.name);
                if (file.name === newName) {
                    return createFile(abortSignal, file.name, mimeType, hash);
                }
                const conflictStrategy = await getFileConflictStrategy(abortSignal);
                if (conflictStrategy === TransferConflictStrategy.Rename) {
                    return createFile(abortSignal, newName, mimeType, hash);
                }
                if (
                    conflictStrategy === TransferConflictStrategy.Replace ||
                    conflictStrategy === TransferConflictStrategy.Merge
                ) {
                    return replaceFile(abortSignal, mimeType);
                }
                if (conflictStrategy === TransferConflictStrategy.Skip) {
                    throw new TransferCancel({ message: c('Info').t`Transfer skipped for file "${file.name}"` });
                }
                throw new Error(`Unknown conflict strategy: ${conflictStrategy}`);
            },
            MAX_UPLOAD_BLOCKS_LOAD
        );

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

        return initUploadFileWorker(file, {
            initialize: async (abortSignal: AbortSignal, mimeType: string) => {
                createdFileRevisionPromise = createFileRevision(abortSignal, mimeType);
                const createdFileRevision = await createdFileRevisionPromise;
                const addressKeyInfo = await addressKeyInfoPromise;
                checkSignal(abortSignal, createdFileRevision.filename);
                return {
                    fileName: createdFileRevision.filename,
                    privateKey: createdFileRevision.privateKey,
                    sessionKey: createdFileRevision.sessionKey,
                    address: {
                        privateKey: addressKeyInfo.privateKey,
                        email: addressKeyInfo.address.Email,
                    },
                };
            },
            createBlockLinks: async (
                abortSignal: AbortSignal,
                fileBlocks: FileRequestBlock[],
                thumbnailBlock?: ThumbnailRequestBlock
            ) => {
                const createdFileRevision = await createdFileRevisionPromise;
                if (!createdFileRevision) {
                    throw new Error(`Draft for "${file.name}" hasn't been created prior to uploading`);
                }
                const addressKeyInfo = await addressKeyInfoPromise;
                const thumbnailParams = thumbnailBlock
                    ? {
                          Thumbnail: 1,
                          ThumbnailHash: uint8ArrayToBase64String(thumbnailBlock.hash),
                          ThumbnailSize: thumbnailBlock.size,
                      }
                    : {};
                const { UploadLinks, ThumbnailLink } = await debouncedRequest<RequestUploadResult>(
                    queryRequestUpload({
                        BlockList: fileBlocks.map((block) => ({
                            Index: block.index,
                            Hash: uint8ArrayToBase64String(block.hash),
                            EncSignature: block.signature,
                            Size: block.size,
                        })),
                        AddressID: addressKeyInfo.address.ID,
                        LinkID: createdFileRevision.fileID,
                        RevisionID: createdFileRevision.revisionID,
                        ShareID: shareId,
                        ...thumbnailParams,
                    }),
                    abortSignal
                );

                return {
                    fileLinks: UploadLinks.map((link, index) => ({
                        index: fileBlocks[index].index,
                        token: link.Token,
                        url: link.BareURL,
                    })),
                    thumbnailLink: ThumbnailLink
                        ? {
                              index: 0,
                              token: ThumbnailLink.Token,
                              url: ThumbnailLink.BareURL,
                          }
                        : undefined,
                };
            },
            finalize: queuedFunction(
                'upload_finalize',
                async (blockTokens: BlockToken[], signature: string, signatureAddress: string) => {
                    const createdFileRevision = await createdFileRevisionPromise;
                    if (!createdFileRevision) {
                        throw new Error(`Draft for "${file.name}" hasn't been created prior to uploading`);
                    }

                    if (finalizeCalled) {
                        return;
                    }
                    finalizeCalled = true;

                    const addressKeyInfo = await addressKeyInfoPromise;
                    const xattr = await ecryptFileExtendedAttributes(
                        file,
                        createdFileRevision.privateKey,
                        addressKeyInfo.privateKey
                    );

                    await debouncedRequest(
                        queryUpdateFileRevision(shareId, createdFileRevision.fileID, createdFileRevision.revisionID, {
                            State: FileRevisionState.Active,
                            BlockList: blockTokens.map((blockToken) => ({
                                Index: blockToken.index,
                                Token: blockToken.token,
                            })),
                            ManifestSignature: signature,
                            SignatureAddress: signatureAddress,
                            XAttr: xattr,
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

                    await driveEventManager.pollAllShareEvents(shareId);
                },
                5
            ),
            onError: async (err) => {
                if (finalizeCalled && err.name === 'AbortError') {
                    return;
                }
                finalizeCalled = true;

                const createdFileRevision = await createdFileRevisionPromise;
                try {
                    if (createdFileRevision) {
                        if (createdFileRevision.isNewFile) {
                            // Cleanup should not be able to abort.
                            await deleteChildrenLinks(new AbortController().signal, shareId, parentId, [
                                createdFileRevision.fileID,
                            ]);
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
                } catch (err: any) {
                    logError(err);
                }
            },
        });
    };

    return {
        initFileUpload,
    };
}

function checkSignal(abortSignal: AbortSignal, name: string) {
    if (abortSignal.aborted) {
        throw new TransferCancel({ message: c('Info').t`Transfer canceled for file "${name}"` });
    }
}
