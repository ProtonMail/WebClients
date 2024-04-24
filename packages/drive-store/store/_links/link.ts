import { splitExtension } from '@proton/shared/lib/helpers/file';
import isTruthy from '@proton/utils/isTruthy';

import { EncryptedLink } from './interface';

export const WINDOWS_FORBIDDEN_CHARACTERS = /[<>:"|?*]/;
// eslint-disable-next-line no-control-regex
export const GLOBAL_FORBIDDEN_CHARACTERS = /\/|\\|[\u0000-\u001F]|[\u2000-\u200F]|[\u202E-\u202F]/;
export const WINDOWS_RESERVED_NAMES = [
    'CON',
    'PRN',
    'AUX',
    'NUL',
    'COM1',
    'COM2',
    'COM3',
    'COM4',
    'COM5',
    'COM6',
    'COM7',
    'COM8',
    'COM9',
    'LPT1',
    'LPT2',
    'LPT3',
    'LPT4',
    'LPT5',
    'LPT6',
    'LPT7',
    'LPT8',
    'LPT9',
];

export const formatLinkName = (str: string) => str.trim();

export const splitLinkName = (linkName: string) => {
    if (linkName.endsWith('.')) {
        return [linkName, ''];
    }
    return splitExtension(linkName);
};

export const adjustWindowsLinkName = (fileName: string) => {
    let adjustedFileName = fileName.replaceAll(RegExp(WINDOWS_FORBIDDEN_CHARACTERS, 'g'), '_');

    if (WINDOWS_RESERVED_NAMES.includes(fileName.toUpperCase())) {
        adjustedFileName = `_${fileName}`;
    }

    if (adjustedFileName.endsWith('.')) {
        adjustedFileName = `${adjustedFileName.slice(0, -1)}_`;
    }

    return adjustedFileName;
};

export const adjustName = (index: number, namePart: string, extension?: string) => {
    if (index === 0) {
        return extension ? `${namePart}.${extension}` : namePart;
    }

    if (!namePart) {
        return [`.${extension}`, `(${index})`].join(' ');
    }

    const newNamePart = [namePart, `(${index})`].filter(isTruthy).join(' ');
    return [newNamePart, extension].filter(isTruthy).join('.');
};

/**
 * isEncryptedLinkSame returns whether the encrypted content and keys are
 * the same, so we might clear signature issues and try decryption again,
 * for example.
 */
export function isEncryptedLinkSame(original: EncryptedLink, newLink: EncryptedLink): boolean {
    return (
        original.nodeKey === newLink.nodeKey &&
        original.nodePassphrase === newLink.nodePassphrase &&
        original.nodePassphraseSignature === newLink.nodePassphraseSignature &&
        original.nodeHashKey === newLink.nodeHashKey &&
        original.contentKeyPacket === newLink.contentKeyPacket &&
        original.contentKeyPacketSignature === newLink.contentKeyPacketSignature &&
        original.signatureAddress === newLink.signatureAddress &&
        isDecryptedLinkSame(original, newLink)
    );
}

/**
 * isDecryptedLinkSame returns whether the encrypted content (not keys) is
 * the same and thus we can say decrypted content is also the same, so we
 * might skip decryption if we already have decrypted content, for example.
 */
export function isDecryptedLinkSame(original: EncryptedLink, newLink: EncryptedLink): boolean {
    return (
        original.parentLinkId === newLink.parentLinkId &&
        original.name === newLink.name &&
        original.xAttr === newLink.xAttr
    );
}
