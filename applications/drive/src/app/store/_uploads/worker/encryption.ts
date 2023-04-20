import type { Sha1 } from '@openpgp/asmcrypto.js/dist_es8/hash/sha1/sha1';

import { CryptoProxy, PrivateKeyReference, SessionKey } from '@proton/crypto';
import { FILE_CHUNK_SIZE } from '@proton/shared/lib/drive/constants';
import { generateContentHash } from '@proton/shared/lib/keys/driveKeys';

import ChunkFileReader from '../ChunkFileReader';
import { MAX_BLOCK_VERIFICATION_RETRIES } from '../constants';
import { EncryptedBlock, EncryptedThumbnailBlock } from '../interface';

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
    sessionKey: SessionKey,
    postNotifySentry: (e: Error) => void,
    hashInstance: Sha1
): AsyncGenerator<EncryptedBlock | EncryptedThumbnailBlock> {
    if (thumbnailData) {
        yield await encryptThumbnail(addressPrivateKey, sessionKey, thumbnailData);
    }

    let index = 1;
    const reader = new ChunkFileReader(file, FILE_CHUNK_SIZE);
    while (!reader.isEOF()) {
        const chunk = await reader.readNextChunk();

        hashInstance.process(chunk);

        yield await encryptBlock(index++, chunk, addressPrivateKey, privateKey, sessionKey, postNotifySentry);
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
    sessionKey: SessionKey,
    postNotifySentry: (e: Error) => void
): Promise<EncryptedBlock> {
    const tryEncrypt = async (retryCount: number): Promise<EncryptedBlock> => {
        const { message: encryptedData, signature } = await CryptoProxy.encryptMessage({
            binaryData: chunk,
            sessionKey,
            signingKeys: addressPrivateKey,
            format: 'binary',
            detached: true,
        });

        // Verify the encrypted blocks to try to detect bitflips, etc.
        try {
            await attemptDecryptBlock(encryptedData, sessionKey);
        } catch (e) {
            // Only trace the error to sentry once
            if (retryCount === 0) {
                postNotifySentry(e as Error);
            }

            if (retryCount < MAX_BLOCK_VERIFICATION_RETRIES) {
                return tryEncrypt(retryCount + 1);
            }

            // Give up after max retries reached, something's wrong
            throw new Error(`Failed to verify encrypted block: ${e}`, { cause: { e, retryCount } });
        }

        // Generate the signature and hash only after the block has been verified
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
    };

    return tryEncrypt(0);
}

async function attemptDecryptBlock(encryptedData: Uint8Array, sessionKey: SessionKey): Promise<void> {
    // Attempt to decrypt data block, without checking the signature
    //
    // We don't check the signature as it is an expensive operation,
    // and we don't need to here as we always have the manifest signature
    await CryptoProxy.decryptMessage({
        binaryMessage: encryptedData,
        sessionKeys: sessionKey,
    });
}
