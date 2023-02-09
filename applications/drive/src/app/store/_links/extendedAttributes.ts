import { CryptoProxy, PrivateKeyReference, PublicKeyReference, VERIFICATION_STATUS } from '@proton/crypto';
import { FILE_CHUNK_SIZE } from '@proton/shared/lib/drive/constants';
import { decryptSigned } from '@proton/shared/lib/keys/driveKeys';

interface ExtendedAttributes {
    Common: {
        ModificationTime?: string;
        Size?: number;
        BlockSizes?: number[];
        Digests?: {
            SHA1?: string;
        };
    };
    Media?: {
        Width: number;
        Height: number;
    };
}

interface ParsedExtendedAttributes {
    Common: {
        ModificationTime?: number;
        Size?: number;
        BlockSizes?: number[];
        Digests?: {
            SHA1?: string;
        };
    };
    Media?: {
        Width: number;
        Height: number;
    };
}

export async function encryptFolderExtendedAttributes(
    modificationTime: Date,
    nodePrivateKey: PrivateKeyReference,
    addressPrivateKey: PrivateKeyReference
) {
    const xattr = createFolderExtendedAttributes(modificationTime);
    return encryptExtendedAttributes(xattr, nodePrivateKey, addressPrivateKey);
}

export function createFolderExtendedAttributes(modificationTime: Date): ExtendedAttributes {
    return {
        Common: {
            ModificationTime: dateToIsoString(modificationTime),
        },
    };
}

export async function encryptFileExtendedAttributes(
    file: File,
    nodePrivateKey: PrivateKeyReference,
    addressPrivateKey: PrivateKeyReference,
    media?: {
        width: number;
        height: number;
    },
    digests?: {
        sha1: string;
    }
) {
    const xattr = createFileExtendedAttributes(file, media, digests);
    return encryptExtendedAttributes(xattr, nodePrivateKey, addressPrivateKey);
}

export function createFileExtendedAttributes(
    file: File,
    media?: {
        width: number;
        height: number;
    },
    digests?: {
        sha1: string;
    }
): ExtendedAttributes {
    const blockSizes = new Array(Math.floor(file.size / FILE_CHUNK_SIZE));
    blockSizes.fill(FILE_CHUNK_SIZE);
    blockSizes.push(file.size % FILE_CHUNK_SIZE);

    return {
        Common: {
            ModificationTime: dateToIsoString(new Date(file.lastModified)),
            Size: file.size,
            BlockSizes: blockSizes,
            Digests: digests
                ? {
                      SHA1: digests.sha1,
                  }
                : undefined,
        },
        Media: media
            ? {
                  Width: media.width,
                  Height: media.height,
              }
            : undefined,
    };
}

async function encryptExtendedAttributes(
    xattr: ExtendedAttributes,
    nodePrivateKey: PrivateKeyReference,
    addressPrivateKey: PrivateKeyReference
) {
    const xattrString = JSON.stringify(xattr);
    const { message } = await CryptoProxy.encryptMessage({
        textData: xattrString,
        encryptionKeys: nodePrivateKey,
        signingKeys: addressPrivateKey,
        compress: true,
    });
    return message;
}

export async function decryptExtendedAttributes(
    encryptedXAttr: string,
    nodePrivateKey: PrivateKeyReference,
    addressPublicKey: PublicKeyReference | PublicKeyReference[]
): Promise<{ xattrs: ParsedExtendedAttributes; verified: VERIFICATION_STATUS }> {
    const { data: xattrString, verified } = await decryptSigned({
        armoredMessage: encryptedXAttr,
        privateKey: nodePrivateKey,
        publicKey: addressPublicKey,
    });
    return {
        xattrs: parseExtendedAttributes(xattrString),
        verified,
    };
}

export function parseExtendedAttributes(xattrString: string): ParsedExtendedAttributes {
    let xattr = {};
    try {
        xattr = JSON.parse(xattrString);
    } catch (err) {
        console.warn(`XAttr "${xattrString}" is not valid JSON`);
    }
    return {
        Common: {
            ModificationTime: parseModificationTime(xattr),
            Size: parseSize(xattr),
            BlockSizes: parseBlockSizes(xattr),
            Digests: parseDigests(xattr),
        },
        Media: parseMedia(xattr),
    };
}

function parseModificationTime(xattr: any): number | undefined {
    const modificationTime = xattr?.Common?.ModificationTime;
    if (modificationTime === undefined) {
        return undefined;
    }
    const modificationDate = new Date(modificationTime);
    // This is the best way to check if date is "Invalid Date". :shrug:
    if (JSON.stringify(modificationDate) === 'null') {
        console.warn(`XAttr modification time "${modificationTime}" is not valid`);
        return undefined;
    }
    const modificationTimestamp = Math.trunc(modificationDate.getTime() / 1000);
    if (Number.isNaN(modificationTimestamp)) {
        console.warn(`XAttr modification time "${modificationTime}" is not valid`);
        return undefined;
    }
    return modificationTimestamp;
}

function parseSize(xattr: any): number | undefined {
    const size = xattr?.Common?.Size;
    if (size === undefined) {
        return undefined;
    }
    if (typeof size !== 'number') {
        console.warn(`XAttr file size "${size}" is not valid`);
        return undefined;
    }
    return size;
}

function parseBlockSizes(xattr: any): number[] | undefined {
    const blockSizes = xattr?.Common?.BlockSizes;
    if (blockSizes === undefined) {
        return undefined;
    }
    if (!Array.isArray(blockSizes)) {
        console.warn(`XAttr block sizes "${blockSizes}" is not valid`);
        return undefined;
    }
    if (!blockSizes.every((item) => typeof item === 'number')) {
        console.warn(`XAttr block sizes "${blockSizes}" is not valid`);
        return undefined;
    }
    return blockSizes;
}

function parseMedia(xattr: any): { Width: number; Height: number } | undefined {
    const media = xattr?.Media;
    if (media === undefined || media.Width === undefined || media.Height === undefined) {
        return undefined;
    }
    const width = media.Width;
    if (typeof width !== 'number') {
        console.warn(`XAttr media width "${width}" is not valid`);
        return undefined;
    }
    const height = media.Height;
    if (typeof height !== 'number') {
        console.warn(`XAttr media height "${height}" is not valid`);
        return undefined;
    }
    return {
        Width: width,
        Height: height,
    };
}

function parseDigests(xattr: any): { SHA1: string } | undefined {
    const digests = xattr?.Common?.Digests;
    if (digests === undefined || digests.SHA1 === undefined) {
        return undefined;
    }

    const sha1 = digests.SHA1;
    if (typeof sha1 !== 'string') {
        console.warn(`XAttr digest SHA1 "${sha1}" is not valid`);
        return undefined;
    }

    return {
        SHA1: sha1,
    };
}

function dateToIsoString(date: Date) {
    const isDateValid = !Number.isNaN(date.getTime());
    return isDateValid ? date.toISOString() : undefined;
}
