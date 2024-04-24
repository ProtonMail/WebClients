import { CryptoProxy, PrivateKeyReference, PublicKeyReference, VERIFICATION_STATUS } from '@proton/crypto';
import { FILE_CHUNK_SIZE } from '@proton/shared/lib/drive/constants';
import { decryptSigned } from '@proton/shared/lib/keys/driveKeys';

import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { DeepPartial } from '../../utils/type/DeepPartial';

export interface ExtendedAttributes {
    Common: {
        ModificationTime?: string;
        Size?: number;
        BlockSizes?: number[];
        Digests?: {
            SHA1: string;
        };
    };
    Location?: {
        Latitude: number;
        Longitude: number;
    };
    Camera?: {
        CaptureTime?: string;
        Device?: string;
        Orientation?: number;
        SubjectCoordinates?: {
            Top: number;
            Left: number;
            Bottom: number;
            Right: number;
        };
    };
    Media?: {
        Width: number;
        Height: number;
        Duration?: number;
    };
}

export interface ParsedExtendedAttributes {
    Common: {
        ModificationTime?: number;
        Size?: number;
        BlockSizes?: number[];
        Digests?: {
            SHA1: string;
        };
    };
    Location?: {
        Latitude: number;
        Longitude: number;
    };
    Camera?: {
        CaptureTime?: string;
        Device?: string;
        Orientation?: number;
        SubjectCoordinates?: {
            Top: number;
            Left: number;
            Bottom: number;
            Right: number;
        };
    };
    Media?: {
        Width: number;
        Height: number;
        Duration?: number;
    };
}

export type MaybeExtendedAttributes = DeepPartial<ExtendedAttributes>;

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

export type XAttrCreateParams = {
    file: File;
    media?: {
        width: number;
        height: number;
        duration?: number;
    };
    digests?: {
        sha1: string;
    };
    location?: {
        latitude: number;
        longitude: number;
    };
    camera?: {
        captureTime?: string;
        device?: string;
        orientation?: number;
        subjectCoordinates?: {
            top: number;
            left: number;
            bottom: number;
            right: number;
        };
    };
};

export async function encryptFileExtendedAttributes(
    params: XAttrCreateParams,
    nodePrivateKey: PrivateKeyReference,
    addressPrivateKey: PrivateKeyReference
) {
    const xattr = createFileExtendedAttributes(params);
    return encryptExtendedAttributes(xattr, nodePrivateKey, addressPrivateKey);
}

export function createFileExtendedAttributes({
    file,
    digests,
    media,
    camera,
    location,
}: XAttrCreateParams): ExtendedAttributes {
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
                  Duration: media.duration,
              }
            : undefined,
        Location: location
            ? {
                  Latitude: location.latitude,
                  Longitude: location.longitude,
              }
            : undefined,
        Camera: camera
            ? {
                  CaptureTime: camera.captureTime,
                  Device: camera.device,
                  Orientation: camera.orientation,
                  SubjectCoordinates: camera.subjectCoordinates
                      ? {
                            Top: camera.subjectCoordinates.top,
                            Left: camera.subjectCoordinates.left,
                            Bottom: camera.subjectCoordinates.bottom,
                            Right: camera.subjectCoordinates.right,
                        }
                      : undefined,
              }
            : undefined,
    };
}

async function encryptExtendedAttributes(
    xattr: ExtendedAttributes,
    nodePrivateKey: PrivateKeyReference,
    addressPrivateKey: PrivateKeyReference
) {
    try {
        const xattrString = JSON.stringify(xattr);

        const { message } = await CryptoProxy.encryptMessage({
            textData: xattrString,
            encryptionKeys: nodePrivateKey,
            signingKeys: addressPrivateKey,
            compress: true,
        });

        return message;
    } catch (e) {
        throw new EnrichedError('Failed to encrypt extended attributes', {
            tags: {
                addressKeyId: addressPrivateKey.getKeyID(),
            },
            extra: {
                e,
            },
        });
    }
}

export async function decryptExtendedAttributes(
    encryptedXAttr: string,
    nodePrivateKey: PrivateKeyReference,
    addressPublicKey: PublicKeyReference | PublicKeyReference[]
): Promise<{ xattrs: ParsedExtendedAttributes; verified: VERIFICATION_STATUS }> {
    try {
        const { data: xattrString, verified } = await decryptSigned({
            armoredMessage: encryptedXAttr,
            privateKey: nodePrivateKey,
            publicKey: addressPublicKey,
        });

        return {
            xattrs: parseExtendedAttributes(xattrString),
            verified,
        };
    } catch (e) {
        throw new EnrichedError('Failed to decrypt extended attributes', {
            extra: {
                e,
                addressKeyIds: (Array.isArray(addressPublicKey) ? addressPublicKey : [addressPublicKey]).map((key) =>
                    key.getKeyID()
                ),
            },
        });
    }
}

export function parseExtendedAttributes(xattrString: string): ParsedExtendedAttributes {
    let xattr: MaybeExtendedAttributes = {};
    try {
        xattr = JSON.parse(xattrString) as MaybeExtendedAttributes;
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

function parseModificationTime(xattr: MaybeExtendedAttributes): number | undefined {
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

function parseSize(xattr: MaybeExtendedAttributes): number | undefined {
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

function parseBlockSizes(xattr: MaybeExtendedAttributes): number[] | undefined {
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
    return blockSizes as number[];
}

function parseMedia(xattr: MaybeExtendedAttributes): { Width: number; Height: number; Duration?: number } | undefined {
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
    const duration = media.Duration;
    if (duration !== undefined && typeof duration !== 'number') {
        console.warn(`XAttr media duration "${duration}" is not valid`);
        return undefined;
    }
    return {
        Width: width,
        Height: height,
        Duration: duration,
    };
}

function parseDigests(xattr: MaybeExtendedAttributes): { SHA1: string } | undefined {
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
