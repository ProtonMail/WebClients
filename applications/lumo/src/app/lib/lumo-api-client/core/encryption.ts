import { decryptString, decryptUint8Array, encryptString } from '../../../crypto';
import { LUMO_GPG_PUB_KEY } from '../../../keys';
import type { WireImage } from '../../../types-api';
import type { RequestEncryptionParams } from './encryptionParams';
import type { EncryptedTurn, Turn } from './types';

// Default Lumo public key (uses production key or custom key from LUMO_PUB_KEY_PATH env var)
export const DEFAULT_LUMO_PUB_KEY = LUMO_GPG_PUB_KEY;

export { decryptString, decryptUint8Array, encryptString };

export function base64StringToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export function uint8ArrayToBase64String(bytes: Uint8Array<ArrayBuffer>): string {
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
    }
    return btoa(binaryString);
}

/**
 * Encrypt one conversation turn for U2L encryption
 */
async function encryptTurn(turn: Turn, encryption: RequestEncryptionParams) {
    const content = turn.content ?? '';
    const contentPromise = encryption.encryptString(content);

    // Start encrypting images in parallel if present
    const imagePromises = turn.images?.map((image) => encryptImage(image, encryption)) || [];

    const encryptedTurn: EncryptedTurn = {
        ...turn,
        content: await contentPromise,
        images: await Promise.all(imagePromises),
        encrypted: true,
    };
    return encryptedTurn;
}

/**
 * Encrypt all conversation turns for U2L encryption
 */
export async function encryptTurns(turns: Turn[], encryption: RequestEncryptionParams): Promise<EncryptedTurn[]> {
    return Promise.all(turns.map((turn) => encryptTurn(turn, encryption)));
}

/**
 * Encrypt one image for U2L encryption
 */
async function encryptImage(image: WireImage, encryption: RequestEncryptionParams) {
    const data = base64StringToUint8Array(image.data);
    console.log('image.data (truncated):', image.data.slice(0, 128));
    console.log('decoded data (truncated):', data.slice(0, 128));
    const encryptedData = await encryption.encryptUint8Array(data);
    console.log('encryptedData (truncated):', encryptedData.slice(0, 128));
    return {
        ...image,
        data: encryptedData,
        encrypted: true,
    };
}
