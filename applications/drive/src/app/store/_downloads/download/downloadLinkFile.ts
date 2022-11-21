// @ts-ignore missing `toStream` TS definitions
import { readToEnd, toStream } from '@openpgp/web-stream-tools';
import { ReadableStream } from 'web-streams-polyfill';

import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import { generateContentHash } from '@proton/shared/lib/keys/driveKeys';

import { DecryptFileKeys, DownloadCallbacks, DownloadStreamControls, LinkDownload } from '../interface';
import initDownloadBlocks from './downloadBlocks';

/**
 * initDownloadLinkFile prepares controls to download the provided file.
 * This epxects only file blocks, not thumbnail block, thus detached
 * signature is required. To download thumbnail, use thumbnail helper.
 */
export default function initDownloadLinkFile(link: LinkDownload, callbacks: DownloadCallbacks): DownloadStreamControls {
    let keysPromise: Promise<DecryptFileKeys> | undefined;

    const transformBlockStream = async (
        abortSignal: AbortSignal,
        stream: ReadableStream<Uint8Array>,
        encSignature: string
    ) => {
        if (!keysPromise) {
            keysPromise = callbacks.getKeys(abortSignal, link);
        }

        const keys = await keysPromise;
        const { data: decryptedSignature } = await CryptoProxy.decryptMessage({
            armoredMessage: encSignature,
            decryptionKeys: keys.privateKey,
            format: 'binary',
        });

        const binaryMessage = await readToEnd<Uint8Array>(stream);
        const hash = (await generateContentHash(binaryMessage)).BlockHash;

        const { data, verified } = await CryptoProxy.decryptMessage({
            binaryMessage,
            binarySignature: decryptedSignature,
            sessionKeys: keys.sessionKeys,
            verificationKeys: keys.addressPublicKeys,
            format: 'binary',
        });

        if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
            await callbacks.onSignatureIssue?.(abortSignal, link, { blocks: verified });
        }

        return {
            hash,
            data: toStream(data) as ReadableStream<Uint8Array>,
        };
    };

    const checkManifestSignature = async (abortSignal: AbortSignal, hash: Uint8Array, signature: string) => {
        if (!keysPromise) {
            keysPromise = callbacks.getKeys(abortSignal, link);
        }
        const keys = await keysPromise;

        const { verified } = await CryptoProxy.verifyMessage({
            binaryData: hash,
            verificationKeys: keys.addressPublicKeys || [],
            armoredSignature: signature,
        });
        if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
            await callbacks.onSignatureIssue?.(abortSignal, link, { manifest: verified });
        }
    };

    const controls = initDownloadBlocks(link.name, {
        ...callbacks,
        getBlocks: (abortSignal, pagination) => callbacks.getBlocks(abortSignal, link.shareId, link.linkId, pagination),
        transformBlockStream,
        checkManifestSignature,
        onProgress: (bytes: number) => callbacks.onProgress?.([link.linkId], bytes),
    });
    return {
        ...controls,
        start: () => {
            const linkSizes = Object.fromEntries([[link.linkId, link.size]]);
            callbacks.onInit?.(link.size, linkSizes);
            return controls.start();
        },
    };
}
