import { ReadableStream } from 'web-streams-polyfill';
import { decryptMessage, getMessage, getSignature } from 'pmcrypto';

import { useApi } from '@proton/components';
import { getStreamMessage } from '@proton/shared/lib/keys/driveKeys';

import { queryDeleteLockedVolumes, queryFileRevision } from '@proton/shared/lib/api/drive/files';
import { DriveFileRevisionResult, NestedFileStream, DriveFileBlock } from '@proton/shared/lib/interfaces/drive/file';
import { LinkType, LinkMeta } from '@proton/shared/lib/interfaces/drive/link';
import { TransferMeta, DownloadInfo } from '@proton/shared/lib/interfaces/drive/transfer';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';
import { useDownloadProvider } from '../../components/downloads/DownloadProvider';
import { startDownload, StreamTransformer } from '../../components/downloads/download';
import { useDriveCache } from '../../components/DriveCache/DriveCacheProvider';
import { getMetaForTransfer } from '../../utils/transfer';
import useDebouncedRequest from '../util/useDebouncedRequest';
import useDrive from './useDrive';
import useDriveCrypto from './useDriveCrypto';

function useFiles() {
    const api = useApi();
    const cache = useDriveCache();
    const debouncedRequest = useDebouncedRequest();
    const { getLinkMeta, getLinkKeys, fetchAllFolderPages } = useDrive();
    const { getPrimaryAddressKeys } = useDriveCrypto();
    const { addToDownloadQueue, addFolderToDownloadQueue } = useDownloadProvider();

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
        const getBlocks = async (
            abortSignal: AbortSignal,
            pagination?: { FromBlockIndex: number; PageSize: number }
        ): Promise<DriveFileBlock[]> => {
            if (driveBlocks) {
                return driveBlocks;
            }
            return getFileBlocks(shareId, linkId, abortSignal, pagination);
        };

        return startDownload(api, {
            getBlocks,
            transformBlockStream: decryptBlockStream(shareId, linkId),
        });
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

    const deleteLockedVolumes = async (volumeIds: string[]) => {
        return Promise.all(volumeIds.map((volumeId) => api(queryDeleteLockedVolumes(volumeId))));
    };

    return {
        startFileTransfer,
        startFolderTransfer,
        downloadDriveFile,
        saveFileTransferFromBuffer,
        deleteLockedVolumes,
    };
}

export default useFiles;
