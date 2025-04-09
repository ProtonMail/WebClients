import { cancelled, put, select } from 'redux-saga/effects';

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
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectItem } from '@proton/pass/store/selectors';
import type { FileDescriptor, ItemFileOutput, ItemKey, ItemRevision, Maybe } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

const initiateUpload = createRequestSaga({
    actions: fileUploadInitiate,
    call: async ({ totalChunks, shareId, encryptionVersion, ...metadata }) => {
        const encodedMetadata = encodeFileMetadata(metadata);
        const fileDescriptor = await PassCrypto.createFileDescriptor({
            encryptionVersion,
            metadata: encodedMetadata,
            fileID: undefined,
            shareId,
        });

        const fileID = await createPendingFile(uint8ArrayToBase64String(fileDescriptor.metadata), totalChunks);
        PassCrypto.registerFileKey({ shareId, fileID, fileKey: fileDescriptor.fileKey });

        return fileID;
    },
});

const uploadChunk = createRequestSaga({
    actions: fileUploadChunk,
    call: function* (payload) {
        const ctrl = new AbortController();
        const { signal } = ctrl;
        const { shareId, fileID } = payload;

        try {
            const chunk: Blob = yield (async () => {
                switch (payload.type) {
                    case 'blob':
                        return payload.blob;
                    case 'fs':
                        return fileStorage.readFile(payload.ref);
                }
            })();

            if (!chunk) throw new Error('Missing file blob');

            const encryptedChunk: Blob = yield PassCrypto.createFileChunk({ chunk, fileID, shareId });
            yield uploadFileChunk(fileID, payload.index, encryptedChunk, signal);

            return true;
        } finally {
            if (yield cancelled()) ctrl.abort('Operation cancelled');
        }
    },
});

const downloadFile = createRequestSaga({
    actions: fileDownload,
    call: function* (payload) {
        const ctrl = new AbortController();
        const { signal } = ctrl;

        try {
            const { chunkIDs, fileID, shareId } = payload;
            const getChunkStream = (chunkID: string) => downloadFileChunk({ ...payload, chunkID }, signal);
            const downloadStream = createDownloadStream(shareId, fileID, chunkIDs, getChunkStream, signal);
            const fileRef = uniqueId(32);
            yield fileStorage.writeFile(fileRef, downloadStream, signal);

            return fileRef;
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
            const { chunkIDs, fileID } = payload;
            const getChunkStream = (chunkID: string) => downloadPublicFileChunk({ ...payload, chunkID }, signal);
            const downloadStream = createDownloadStream(FILE_PUBLIC_SHARE, fileID, chunkIDs, getChunkStream, signal);
            const fileRef = uniqueId(32);
            yield fileStorage.writeFile(fileRef, downloadStream, signal);

            return fileRef;
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

        const fileDescriptor = await PassCrypto.createFileDescriptor({
            encryptionVersion,
            fileID,
            metadata: encodedMetadata,
            shareId,
        });

        const metadata = uint8ArrayToBase64String(fileDescriptor.metadata);

        await (shareId && itemId
            ? updateLinkedFileMetadata({ metadata, fileID, shareId, itemId })
            : updatePendingFileMetadata(metadata, fileID));

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
        yield put(withRevalidate(filesResolve.intent(revisionDTO)));

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
