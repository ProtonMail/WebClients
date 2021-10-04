import { encryptMessage, OpenPGPKey } from 'pmcrypto';

import { decryptUnsigned } from '@proton/shared/lib/keys/driveKeys';
import { FILE_CHUNK_SIZE } from '@proton/shared/lib/drive/constants';

interface ExtendedAttributes {
    Common: {
        ModificationTime: string;
        Size: number;
        BlockSizes: number[];
    };
}

interface ParsedExtendedAttributes {
    Common: {
        ModificationTime?: number;
        Size?: number;
        BlockSizes?: number[];
    };
}

export async function ecryptExtendedAttributes(file: File, nodePrivateKey: OpenPGPKey, addressPrivateKey: OpenPGPKey) {
    const xattr = createExtendedAttributes(file);
    const xattrString = JSON.stringify(xattr);
    const { data } = await encryptMessage({
        data: xattrString,
        publicKeys: nodePrivateKey,
        privateKeys: addressPrivateKey,
    });
    return data;
}

export function createExtendedAttributes(file: File): ExtendedAttributes {
    const blockSizes = new Array(Math.floor(file.size / FILE_CHUNK_SIZE));
    blockSizes.fill(FILE_CHUNK_SIZE);
    blockSizes.push(file.size % FILE_CHUNK_SIZE);
    return {
        Common: {
            ModificationTime: new Date(file.lastModified).toISOString(),
            Size: file.size,
            BlockSizes: blockSizes,
        },
    };
}

export async function decryptExtendedAttributes(
    encryptedXAttr: string,
    nodePrivateKey: OpenPGPKey
): Promise<ParsedExtendedAttributes> {
    const xattrString = await decryptUnsigned({ armoredMessage: encryptedXAttr, privateKey: nodePrivateKey });
    return parseExtendedAttributes(xattrString);
}

export function parseExtendedAttributes(xattrString: string) {
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
        },
    };
}

function parseModificationTime(xattr: any): number | undefined {
    const modificationTime = new Date(xattr?.Common?.ModificationTime);
    // This is the best way to check if date is "Invalid Date". :shrug:
    if (JSON.stringify(modificationTime) === 'null') {
        console.warn(`XAttr modification time "${modificationTime}" is not valid`);
        return undefined;
    }
    const modificationTimestamp = Math.trunc(modificationTime.getTime() / 1000);
    if (Number.isNaN(modificationTimestamp)) {
        console.warn(`XAttr modification time "${modificationTime}" is not valid`);
        return undefined;
    }
    return modificationTimestamp;
}

function parseSize(xattr: any): number | undefined {
    const size = xattr?.Common?.Size;
    if (typeof size !== 'number') {
        console.warn(`XAttr file size "${size}" is not valid`);
        return undefined;
    }
    return size;
}

function parseBlockSizes(xattr: any): number[] | undefined {
    const blockSizes = xattr?.Common?.BlockSizes;
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
