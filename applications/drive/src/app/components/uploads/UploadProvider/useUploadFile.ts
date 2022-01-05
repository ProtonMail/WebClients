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
import { FileLinkMeta, isFolderLinkMeta } from '@proton/shared/lib/interfaces/drive/link';
import { TransferCancel } from '@proton/shared/lib/interfaces/drive/transfer';
import useDebouncedRequest from '../../../hooks/util/useDebouncedRequest';
import useQueuedFunction from '../../../hooks/util/useQueuedFunction';
import useDrive from '../../../hooks/drive/useDrive';
import useDriveCrypto from '../../../hooks/drive/useDriveCrypto';
import useTrash from '../../../hooks/drive/useTrash';
import { isTransferCancelError } from '../../../utils/transfer';
import { ValidationError, validateLinkName } from '../../../utils/validation';
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
import { ecryptFileExtendedAttributes } from '../../../utils/drive/extendedAttributes';
import { useDriveEventManager } from '../../driveEventManager';

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
    const { deleteChildrenLinks, getLinkKeys } = useDrive();
    const { getPrimaryAddressKey } = useDriveCrypto();
    const { trashLinks } = useTrash();
    const { findAvailableName, getLinkByName } = useUploadHelper();
    const driveEventManager = useDriveEventManager();

    const initFileUpload = (
        shareId: string,
        parentId: string,
        file: File,
        getFileConflictStrategy: ConflictStrategyHandler
    ): UploadFileControls => {
        const addressKeyInfoPromise = getPrimaryAddressKey();

        const generateFileKeys = async () => {
            const error = validateLinkName(file.name);
            if (error) {
                throw new ValidationError(error);
            }

            const [parentKeys, addressKeyInfo] = await Promise.all([
                getLinkKeys(shareId, parentId),
                addressKeyInfoPromise,
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
                parentKeys,
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
                parentKeys,
                privateKey,
                sessionKey,
            } = await generateFileKeys();

            const Name = await encryptName(filename, parentKeys.privateKey.toPublic(), addressKeyInfo.privateKey);

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

        const createRevision = async (abortSignal: AbortSignal, link: FileLinkMeta): Promise<FileRevision> => {
            const currentActiveRevisionID = link.FileProperties.ActiveRevision?.ID;
            if (!currentActiveRevisionID) {
                throw new Error(c('Error').t`The original file has missing active revision`);
            }

            const keys = await getLinkKeys(shareId, link.LinkID);
            if (!('sessionKeys' in keys)) {
                throw new Error(c('Error').t`The original file has missing session key`);
            }

            checkSignal(abortSignal, link.Name);

            // Do not abort using signal - revision could be created and we
            // wouldn't know ID to do proper cleanup.
            const { Revision } = await debouncedRequest<CreateFileRevisionResult>(
                queryCreateFileRevision(shareId, link.LinkID, currentActiveRevisionID)
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
                fileID: link.LinkID,
                revisionID: Revision.ID,
                previousRevisionID: currentActiveRevisionID,
                sessionKey: keys.sessionKeys as SessionKey,
                privateKey: keys.privateKey,
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
            if (isFolderLinkMeta(link)) {
                const parentKeys = await getLinkKeys(shareId, parentId);
                if (!('hashKey' in parentKeys)) {
                    throw Error(c('Error').t`The original file has missing hash key`);
                }
                const hash = await generateLookupHash(file.name, parentKeys.hashKey);

                await trashLinks(shareId, parentId, [link.LinkID]);
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
            onError: async () => {
                const createdFileRevision = await createdFileRevisionPromise;
                try {
                    if (createdFileRevision) {
                        if (createdFileRevision.isNewFile) {
                            await deleteChildrenLinks(shareId, parentId, [createdFileRevision.fileID]);
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
                    if (!isTransferCancelError(err)) {
                        console.error(err);
                    }
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
