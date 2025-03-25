import { cancelled, put, select } from 'redux-saga/effects';

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
    call: async ({ totalChunks, ...metadata }) => {
        const encodedMetadata = encodeFileMetadata(metadata);
        const fileDescriptor = await PassCrypto.createFileDescriptor({ metadata: encodedMetadata });
        const fileID = await createPendingFile(uint8ArrayToBase64String(fileDescriptor.metadata), totalChunks);
        PassCrypto.registerFileKey({ fileID, fileKey: fileDescriptor.fileKey });

        return fileID;
    },
});

const uploadChunk = createRequestSaga({
    actions: fileUploadChunk,
    call: async (payload) => {
        const chunk = await (async () => {
            switch (payload.type) {
                case 'blob':
                    return payload.blob;
                case 'fs':
                    return fileStorage.readFile(payload.ref);
            }
        })();

        if (!chunk) throw new Error('Missing file blob');

        const encryptedChunk = await PassCrypto.createFileChunk({ chunk, fileID: payload.fileID });
        await uploadFileChunk(payload.fileID, payload.index, encryptedChunk);

        return true;
    },
});

const downloadFile = createRequestSaga({
    actions: fileDownload,
    call: function* (file) {
        const ctrl = new AbortController();

        try {
            const { chunkIDs, fileID } = file;
            const getChunkStream = (chunkID: string) => downloadFileChunk({ ...file, chunkID });
            const downloadStream = createDownloadStream(fileID, chunkIDs, getChunkStream, ctrl.signal);
            const fileRef = uniqueId(32);
            yield fileStorage.writeFile(fileRef, downloadStream);

            return fileRef;
        } finally {
            if (yield cancelled()) ctrl.abort();
        }
    },
});

const downloadPublicChunk = createRequestSaga({
    actions: fileDownloadPublic,
    call: function* (file) {
        const ctrl = new AbortController();

        try {
            const { chunkIDs, fileID } = file;
            const getChunkStream = (chunkID: string) => downloadPublicFileChunk({ ...file, chunkID });
            const downloadStream = createDownloadStream(fileID, chunkIDs, getChunkStream, ctrl.signal);
            const fileRef = uniqueId(32);
            yield fileStorage.writeFile(fileRef, downloadStream);

            return fileRef;
        } finally {
            if (yield cancelled()) ctrl.abort();
        }
    },
});

const updateMetadata = createRequestSaga({
    actions: fileUpdateMetadata,
    call: async (descriptor) => {
        const { fileID, shareId, itemId } = descriptor;
        const encodedMetadata = encodeFileMetadata(descriptor);
        const fileDescriptor = await PassCrypto.createFileDescriptor({ metadata: encodedMetadata, fileID });
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

        return linked;
    },
});

const resolveFiles = createRequestSaga({
    actions: filesResolve,
    call: async (item) => {
        const itemKey = await resolveItemKey(item.shareId, item.itemId);
        const result = item.history ? await resolveItemFilesRevision(item) : await resolveItemFiles(item);
        const files = await intoFileDescriptors(result, itemKey);

        return { ...item, files };
    },
});

const restore = createRequestSaga({
    actions: fileRestore,
    call: function* (dto) {
        const itemKey: ItemKey = yield resolveItemKey(dto.shareId, dto.itemId);
        const result: ItemFileOutput = yield restoreSingleFile(dto, itemKey);
        const files: FileDescriptor[] = yield intoFileDescriptors([result], itemKey);
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
