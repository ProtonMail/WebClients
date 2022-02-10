import { OpenPGPKey, SessionKey, encryptMessage } from 'pmcrypto';
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
    addressPrivateKey: OpenPGPKey,
    privateKey: OpenPGPKey,
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
    addressPrivateKey: OpenPGPKey,
    sessionKey: SessionKey,
    thumbnail: Uint8Array
): Promise<EncryptedThumbnailBlock> {
    const { message } = await encryptMessage({
        data: thumbnail,
        sessionKey,
        privateKeys: addressPrivateKey,
        armor: false,
        detached: false,
    });
    const encryptedData = message.packets.write();
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
    addressPrivateKey: OpenPGPKey,
    privateKey: OpenPGPKey,
    sessionKey: SessionKey
) {
    const { message, signature } = await encryptMessage({
        data: chunk,
        sessionKey,
        privateKeys: addressPrivateKey,
        armor: false,
        detached: true,
    });
    const { data: encryptedSignature } = await encryptMessage({
        data: signature.packets.write(),
        sessionKey,
        publicKeys: privateKey.toPublic(),
        armor: true,
    });
    const encryptedData = message.packets.write();
    const hash = (await generateContentHash(encryptedData)).BlockHash;
    return {
        index,
        originalSize: chunk.length,
        encryptedData,
        hash,
        signature: encryptedSignature,
    };
}
