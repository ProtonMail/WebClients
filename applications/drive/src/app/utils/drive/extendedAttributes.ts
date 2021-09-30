import { encryptMessage, OpenPGPKey } from 'pmcrypto';

import { decryptUnsigned } from '@proton/shared/lib/keys/driveKeys';

interface ExtendedAttributes {
    Common: {
        ModificationTime: string;
        Size: number;
    };
}

interface ParsedExtendedAttributes {
    Common: {
        ModificationTime?: number;
        Size?: number;
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
    return {
        Common: {
            ModificationTime: new Date(file.lastModified).toISOString(),
            Size: file.size,
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
        },
    };
}

function parseModificationTime(xattr: any): number | undefined {
    const modificationTime = new Date(xattr?.Common?.ModificationTime);
    if (JSON.stringify(modificationTime) === 'null') {
        console.warn(`XAttr modification time "${modificationTime}" is not valid`);
        return undefined;
    }
    const modificationTimestamp = parseInt((modificationTime.getTime() / 1000).toFixed(0), 10);
    if (typeof modificationTimestamp !== 'number') {
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
