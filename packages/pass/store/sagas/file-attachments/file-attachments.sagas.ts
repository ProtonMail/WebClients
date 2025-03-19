import { put } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto';
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
import { intoFileDescriptor } from '@proton/pass/lib/file-attachments/helpers';
import { fileStorage } from '@proton/pass/lib/file-storage/fs';
import { getLatestItemKey } from '@proton/pass/lib/items/item.requests';
import {
    fileDownloadChunk,
    fileDownloadPublicChunk,
    fileLinkPending,
    fileRestore,
    fileUpdateMetadata,
    fileUploadChunk,
    fileUploadInitiate,
    filesResolve,
} from '@proton/pass/store/actions';
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import type { ItemRevision } from '@proton/pass/types';
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

const consumeStream = async (
    reader: ReadableStreamDefaultReader,
    chunks: Uint8Array[] = [],
    totalLength: number = 0
): Promise<Uint8Array> => {
    const { done, value } = await reader.read();
    if (!done) return consumeStream(reader, [...chunks, value], totalLength + value.length);

    return chunks.reduce<[Uint8Array, number]>(
        ([res, offset], chunk) => {
            res.set(chunk, offset);
            return [res, offset + chunk.length];
        },
        [new Uint8Array(totalLength), 0]
    )[0];
};

const downloadChunk = createRequestSaga({
    actions: fileDownloadChunk,
    call: async (item) => {
        const stream = await downloadFileChunk(item);
        const chunk = await consumeStream(stream.getReader());
        return uint8ArrayToBase64String(await PassCrypto.openFileChunk({ chunk, fileID: item.fileID }));
    },
});

const downloadPublicChunk = createRequestSaga({
    actions: fileDownloadPublicChunk,
    call: async (file) => {
        const stream = await downloadPublicFileChunk(file);
        const chunk = await consumeStream(stream.getReader());
        return uint8ArrayToBase64String(await PassCrypto.openFileChunk({ chunk, fileID: file.fileID }));
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
        const item: ItemRevision = yield linkPendingFiles(dto);
        yield put(withRevalidate(filesResolve.intent(dto)));
        return item;
    },
});

const resolveFiles = createRequestSaga({
    actions: filesResolve,
    call: async (item) => {
        const latestItemKey = await getLatestItemKey(item);
        const result = item.history ? await resolveItemFilesRevision(item) : await resolveItemFiles(item);

        const files = await intoFileDescriptor(result, (file) =>
            PassCrypto.openFileDescriptor({
                file,
                shareId: item.shareId,
                latestItemKey,
            })
        );

        return { ...item, files };
    },
});

const restore = createRequestSaga({
    actions: fileRestore,
    call: async (dto) => {
        const latestItemKey = await getLatestItemKey(dto);
        const result = await restoreSingleFile(dto, latestItemKey);

        const files = await intoFileDescriptor([result], (file) =>
            PassCrypto.openFileDescriptor({
                file,
                shareId: dto.shareId,
                latestItemKey,
            })
        );

        return { ...dto, files };
    },
});

export default [
    downloadChunk,
    downloadPublicChunk,
    initiateUpload,
    linkPending,
    resolveFiles,
    restore,
    updateMetadata,
    uploadChunk,
];
