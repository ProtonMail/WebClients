import { CryptoProxy, PrivateKeyReference, SessionKey } from '@proton/crypto';
import { generateContentHash } from '@proton/shared/lib/keys/driveKeys';
import { FILE_CHUNK_SIZE } from '@proton/shared/lib/drive/constants';

import { EncryptedBlock, EncryptedThumbnailBlock } from '../interface';
import ChunkFileReader from '../ChunkFileReader';

/**
 * generateEncryptedBlocks generates blocks for the specified file.
 * Each block is chunked to FILE_CHUNK_SIZE and encrypted, counting index
 * from one. If file has thumbnail, it is ensured to be the first generated
 * block to ensure proper order, as thumbnail has special index equal to zero.
 */
export default async function* generateEncryptedBlocks(
    file: File,
    thumbnailData: Uint8Array | undefined,
    addressPrivateKey: PrivateKeyReference,
    privateKey: PrivateKeyReference,
    sessionKey: SessionKey
): AsyncGenerator<EncryptedBlock | EncryptedThumbnailBlock> {
    if (thumbnailData) {
        yield await encryptThumbnail(addressPrivateKey, sessionKey, thumbnailData);
    }

    let index = 1;
    const reader = new ChunkFileReader(file, FILE_CHUNK_SIZE);
    while (!reader.isEOF()) {
        yield await encryptBlock(index++, await reader.readNextChunk(), addressPrivateKey, privateKey, sessionKey);
    }
}

async function encryptThumbnail(
    addressPrivateKey: PrivateKeyReference,
    sessionKey: SessionKey,
    thumbnail: Uint8Array
): Promise<EncryptedThumbnailBlock> {
    const { message: encryptedData } = await CryptoProxy.encryptMessage({
        binaryData: thumbnail,
        sessionKey,
        signingKeys: addressPrivateKey,
        format: 'binary',
        detached: false,
    });
    const hash = (await generateContentHash(encryptedData)).BlockHash;
    return {
        index: 0,
        // Original size is used only for showing progress. We don't want to
        // include thumbnail to it, otherwise it would show more than 100%.
        originalSize: 0,
        encryptedData,
        hash,
    };
}

async function encryptBlock(
    index: number,
    chunk: Uint8Array,
    addressPrivateKey: PrivateKeyReference,
    privateKey: PrivateKeyReference,
    sessionKey: SessionKey
) {
    const { message: encryptedData, signature } = await CryptoProxy.encryptMessage({
        binaryData: chunk,
        sessionKey,
        signingKeys: addressPrivateKey,
        format: 'binary',
        detached: true,
    });
    const { message: encryptedSignature } = await CryptoProxy.encryptMessage({
        binaryData: signature,
        sessionKey,
        encryptionKeys: privateKey,
    });
    const hash = (await generateContentHash(encryptedData)).BlockHash;
    return {
        index,
        originalSize: chunk.length,
        encryptedData,
        hash,
        signature: encryptedSignature,
    };
}
