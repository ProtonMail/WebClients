import type { Sha1 } from '@openpgp/asmcrypto.js/dist_es8/hash/sha1/sha1';

import { CryptoProxy, PrivateKeyReference, SessionKey } from '@proton/crypto';
import { FILE_CHUNK_SIZE } from '@proton/shared/lib/drive/constants';
import { generateContentHash } from '@proton/shared/lib/keys/driveKeys';

import ChunkFileReader from '../ChunkFileReader';
import { MAX_BLOCK_VERIFICATION_RETRIES } from '../constants';
import { EncryptedBlock, ThumbnailEncryptedBlock } from '../interface';
import { ThumbnailInfo } from '../media';
import { Verifier } from './interface';

/**
 * generateEncryptedBlocks generates blocks for the specified file.
 * Each block is chunked to FILE_CHUNK_SIZE and encrypted, counting index
 * from one.
 */
export async function* generateEncryptedBlocks(
    file: File,
    addressPrivateKey: PrivateKeyReference,
    privateKey: PrivateKeyReference,
    sessionKey: SessionKey,
    postNotifySentry: (e: Error) => void,
    hashInstance: Sha1,
    verifier: Verifier
): AsyncGenerator<EncryptedBlock> {
    let index = 1;
    const reader = new ChunkFileReader(file, FILE_CHUNK_SIZE);
    while (!reader.isEOF()) {
        const chunk = await reader.readNextChunk();

        hashInstance.process(chunk);

        yield await encryptBlock(index++, chunk, addressPrivateKey, privateKey, sessionKey, verifier, postNotifySentry);
    }
}

/**
 * generateEncryptedThumbnailsBlocks generates blocks for the specified thumbnails
 * Each thumbnail will fit on a single block.
 * Index is not taken in consideration for Thumbnails, so we can start it at 0
 */
export async function* generateThumbnailEncryptedBlocks(
    thumbnails: ThumbnailInfo[] | undefined,
    addressPrivateKey: PrivateKeyReference,
    sessionKey: SessionKey
): AsyncGenerator<ThumbnailEncryptedBlock> {
    if (!!thumbnails?.length) {
        let index = 0;
        for (let i = 0; i < thumbnails?.length; i++) {
            yield await encryptThumbnail(index++, addressPrivateKey, sessionKey, thumbnails[i]);
        }
    }
}

async function encryptThumbnail(
    index: number,
    addressPrivateKey: PrivateKeyReference,
    sessionKey: SessionKey,
    thumbnail: ThumbnailInfo
): Promise<ThumbnailEncryptedBlock> {
    const { message: encryptedData } = await CryptoProxy.encryptMessage({
        binaryData: thumbnail.thumbnailData,
        sessionKey,
        signingKeys: addressPrivateKey,
        format: 'binary',
        detached: false,
    });
    const hash = (await generateContentHash(encryptedData)).BlockHash;
    return {
        index,
        // Original size is used only for showing progress. We don't want to
        // include thumbnail to it, otherwise it would show more than 100%.
        originalSize: 0,
        encryptedData,
        hash,
        thumbnailType: thumbnail.thumbnailType,
    };
}

async function encryptBlock(
    index: number,
    chunk: Uint8Array,
    addressPrivateKey: PrivateKeyReference,
    privateKey: PrivateKeyReference,
    sessionKey: SessionKey,
    verifyBlock: Verifier,
    postNotifySentry: (e: Error) => void
): Promise<EncryptedBlock> {
    const tryEncrypt = async (retryCount: number): Promise<EncryptedBlock> => {
        // Generate the encrypted block
        const { message: encryptedData, signature } = await CryptoProxy.encryptMessage({
            binaryData: chunk,
            sessionKey,
            signingKeys: addressPrivateKey,
            format: 'binary',
            detached: true,
        });

        // IMPORTANT!
        // Hashing must happen BEFORE verifying.
        // If verification is successful, then we know the hash corresponds
        // to something we can decrypt. If hashing was placed after verification,
        // the cyphertext could get corrupted after verification succeeds,
        // which would create an incorrect digest that would look "correct" to the server.
        const hash = (await generateContentHash(encryptedData)).BlockHash;
        let verificationToken;

        try {
            verificationToken = await verifyBlock(encryptedData);
        } catch (e) {
            // Only trace the error to sentry once
            if (retryCount === 0) {
                postNotifySentry(new Error('Verification failed and retried', { cause: { e } }));
            }

            if (retryCount < MAX_BLOCK_VERIFICATION_RETRIES) {
                return tryEncrypt(retryCount + 1);
            }

            // Give up after max retries reached, something's wrong
            throw new Error('Upload failed: Verification of data failed', { cause: { e } });
        }

        // Encrypt the block signature after verification
        const { message: encryptedSignature } = await CryptoProxy.encryptMessage({
            binaryData: signature,
            sessionKey,
            encryptionKeys: privateKey,
        });

        return {
            index,
            originalSize: chunk.length,
            encryptedData,
            hash,
            signature: encryptedSignature,
            verificationToken,
        };
    };

    return tryEncrypt(0);
}
