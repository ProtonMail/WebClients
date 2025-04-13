import { cancelled, select } from 'redux-saga/effects';

import { FILE_PUBLIC_SHARE } from '@proton/pass/constants';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { resolveItemKey } from '@proton/pass/lib/crypto/utils/helpers';
import { createDownloadStream } from '@proton/pass/lib/file-attachments/download';
import {
    createPendingFile,
    downloadFileChunk,
    downloadPublicFileChunk,
    linkPendingFiles,
    resolveItemFiles,
    resolveItemFilesRevision,
    restoreSingleFile,
    updateLinkedFileMetadata,
    updatePendingFileMetadata,
    uploadFileChunk,
} from '@proton/pass/lib/file-attachments/file-attachments.requests';
import { encodeFileMetadata } from '@proton/pass/lib/file-attachments/file-proto.transformer';
import { intoFileDescriptors } from '@proton/pass/lib/file-attachments/helpers';
import { fileStorage } from '@proton/pass/lib/file-storage/fs';
import type { FileStorage } from '@proton/pass/lib/file-storage/types';
import { base64ToBlob, getSafeStorage, getSafeWriter } from '@proton/pass/lib/file-storage/utils';
import {
    fileDownload,
    fileDownloadPublic,
    fileLinkPending,
    fileRestore,
    fileUpdateMetadata,
    fileUploadChunk,
    fileUploadInitiate,
    filesResolve,
} from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectItem } from '@proton/pass/store/selectors';
import type { FileDescriptor, FileForDownload, ItemFileOutput, ItemKey, ItemRevision, Maybe } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import noop from '@proton/utils/noop';

const initiateUpload = createRequestSaga({
    actions: fileUploadInitiate,
    call: async ({ totalChunks, shareId, encryptionVersion, ...metadata }) => {
        const encodedMetadata = encodeFileMetadata(metadata);
        const fileDescriptor = await PassCrypto.createFileDescriptor({
            encryptionVersion,
            metadata: encodedMetadata,
            fileID: undefined,
            shareId,
            pending: true,
        });

        const fileID = await createPendingFile(
            uint8ArrayToBase64String(fileDescriptor.metadata),
            totalChunks,
            encryptionVersion
        );

        PassCrypto.registerFileKey({
            shareId,
            fileID,
            fileKey: fileDescriptor.fileKey,
            pending: true,
        });

        return fileID;
    },
});

const uploadChunk = createRequestSaga({
    actions: fileUploadChunk,
    call: function* (payload) {
        const ctrl = new AbortController();
        const { signal } = ctrl;
        const { shareId, fileID, chunkIndex, totalChunks, encryptionVersion } = payload;

        try {
            const chunk: Maybe<Blob> = yield (async () => {
                switch (payload.type) {
                    case 'blob':
                        return payload.blob;
                    case 'b64':
                        return base64ToBlob(payload.data);
                    case 'storage':
                        if (fileStorage.type !== payload.storageType) throw new Error('Invalid storage instance');
                        return fileStorage.readFile(payload.ref);
                }
            })();

            if (!chunk) throw new Error('Missing file blob');

            const encryptedChunk: Blob = yield PassCrypto.createFileChunk({
                chunk,
                chunkIndex,
                encryptionVersion,
                fileID,
                shareId,
                totalChunks,
            });

            yield uploadFileChunk(fileID, chunkIndex, encryptedChunk, signal);

            return true;
        } catch (err) {
            PassCrypto.unregisterFileKey({ fileID, shareId, pending: true });
            throw err;
        } finally {
            /** Delete chunk whenever we exit from this generator */
            if (payload.type === 'storage') fileStorage.deleteFile(payload.ref).catch(noop);
            if (yield cancelled()) {
                ctrl.abort('Operation cancelled');
                PassCrypto.unregisterFileKey({ fileID, shareId, pending: true });
            }
        }
    },
});

const downloadFile = createRequestSaga({
    actions: fileDownload,
    call: function* (payload, options) {
        const ctrl = new AbortController();
        const { signal } = ctrl;

        const { chunkIDs, fileID, shareId, encryptionVersion, storageType } = payload;
        const fs: FileStorage = getSafeStorage(storageType);

        try {
            const downloadStream = createDownloadStream(
                { shareId, fileID, chunkIDs, encryptionVersion },
                (chunkID: string) => downloadFileChunk({ ...payload, chunkID }, signal),
                signal
            );

            const fileRef = uniqueId(32);
            const write = getSafeWriter(fs, options);
            yield write(fileRef, downloadStream, signal, payload.port);

            return { type: fs.type, fileRef };
        } finally {
            if (yield cancelled()) ctrl.abort('Operation cancelled');
        }
    },
});

const downloadPublicChunk = createRequestSaga({
    actions: fileDownloadPublic,
    call: function* (payload) {
        const ctrl = new AbortController();
        const { signal } = ctrl;

        try {
            const { chunkIDs, fileID, encryptionVersion } = payload;
            const downloadStream = createDownloadStream(
                {
                    shareId: FILE_PUBLIC_SHARE,
                    fileID,
                    chunkIDs,
                    encryptionVersion,
                },
                (chunkID: string) => downloadPublicFileChunk({ ...payload, chunkID }, signal),
                signal
            );

            const fileRef = uniqueId(32);
            yield fileStorage.writeFile(fileRef, downloadStream, signal);

            return { type: 'storage', fileRef } satisfies FileForDownload;
        } finally {
            if (yield cancelled()) ctrl.abort('Operation cancelled');
        }
    },
});

const updateMetadata = createRequestSaga({
    actions: fileUpdateMetadata,
    call: async (descriptor) => {
        const { fileID, shareId, itemId, encryptionVersion } = descriptor;
        const encodedMetadata = encodeFileMetadata(descriptor);

        const pending = !(shareId && itemId);

        const fileDescriptor = await PassCrypto.createFileDescriptor({
            encryptionVersion,
            fileID,
            metadata: encodedMetadata,
            shareId,
            pending,
        });

        const metadata = uint8ArrayToBase64String(fileDescriptor.metadata);

        await (pending
            ? updatePendingFileMetadata(metadata, fileID)
            : updateLinkedFileMetadata({ metadata, fileID, shareId, itemId }));

        return { ...descriptor, shareId, itemId };
    },
});

const linkPending = createRequestSaga({
    actions: fileLinkPending,
    call: function* (dto) {
        const item: Maybe<ItemRevision> = yield select(selectItem(dto.shareId, dto.itemId));
        if (!item) throw new Error('Link failure: unknown item');

        const revisionDTO = { ...dto, revision: item.revision };
        const linked: ItemRevision = yield linkPendingFiles(revisionDTO);

        return { item: linked };
    },
});

const resolveFiles = createRequestSaga({
    actions: filesResolve,
    call: async (item) => {
        const { shareId, itemId } = item;
        const itemKey = await resolveItemKey(shareId, itemId);
        const result = item.history ? await resolveItemFilesRevision(item) : await resolveItemFiles(item);
        const files = await intoFileDescriptors(shareId, result, itemKey);

        return { ...item, files };
    },
});

const restore = createRequestSaga({
    actions: fileRestore,
    call: function* (dto) {
        const { shareId } = dto;
        const itemKey: ItemKey = yield resolveItemKey(dto.shareId, dto.itemId);
        const result: ItemFileOutput = yield restoreSingleFile(dto, itemKey);
        const files: FileDescriptor[] = yield intoFileDescriptors(shareId, [result], itemKey);
        return { ...dto, files };
    },
});

export default [
    downloadFile,
    downloadPublicChunk,
    initiateUpload,
    linkPending,
    resolveFiles,
    restore,
    updateMetadata,
    uploadChunk,
];
