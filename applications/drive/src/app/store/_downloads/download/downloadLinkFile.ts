import { ReadableStream } from 'web-streams-polyfill';
import { decryptMessage, getMessage, getSignature, VERIFICATION_STATUS } from 'pmcrypto';

import { getStreamMessage } from '@proton/shared/lib/keys/driveKeys';

import { LinkDownload, DownloadCallbacks, DownloadStreamControls, DecryptFileKeys } from '../interface';
import initDownloadBlocks from './downloadBlocks';

/**
 * initDownloadLinkFile prepares controls to download the provided file.
 * This epxects only file blocks, not thumbnail block, thus detached
 * signature is required. To download thumbnail, use thumbnail helper.
 */
export default function initDownloadLinkFile(link: LinkDownload, callbacks: DownloadCallbacks): DownloadStreamControls {
    let keysPromise: Promise<DecryptFileKeys> | undefined;

    const checkFileSignatures = async (abortSignal: AbortSignal) => {
        if (link.signatureIssues) {
            await callbacks.onSignatureIssue?.(abortSignal, link, link.signatureIssues);
        }
    };

    const transformBlockStream = async (
        abortSignal: AbortSignal,
        stream: ReadableStream<Uint8Array>,
        encSignature: string
    ) => {
        if (!keysPromise) {
            keysPromise = callbacks.getKeys(abortSignal, link.shareId, link.linkId);
        }

        const [keys, signatureMessage] = await Promise.all([keysPromise, getMessage(encSignature)]);
        const decryptedSignature = await decryptMessage({
            privateKeys: keys.privateKey,
            message: signatureMessage,
            format: 'binary',
        });
        const [message, signature] = await Promise.all([
            getStreamMessage(stream),
            getSignature(decryptedSignature.data),
        ]);
        // When streaming is used, verified is actually Promise.
        const { data, verified: verifiedPromise } = await decryptMessage({
            message,
            signature,
            sessionKeys: keys.sessionKeys,
            publicKeys: keys.addressPublicKeys,
            streaming: 'web',
            format: 'binary',
        });
        return {
            data,
            verifiedPromise,
        } as unknown as {
            data: ReadableStream<Uint8Array>;
            verifiedPromise: Promise<VERIFICATION_STATUS>;
        };
    };

    const checkBlockSignature = async (abortSignal: AbortSignal, verifiedPromise: Promise<VERIFICATION_STATUS>) => {
        const verified = await verifiedPromise;
        if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
            await callbacks.onSignatureIssue?.(abortSignal, link, { blocks: verified });
        }
    };

    const controls = initDownloadBlocks(link.name, {
        ...callbacks,
        checkFileSignatures,
        getBlocks: (abortSignal, pagination) => callbacks.getBlocks(abortSignal, link.shareId, link.linkId, pagination),
        transformBlockStream,
        checkBlockSignature,
    });
    return {
        ...controls,
        start: () => {
            callbacks.onInit?.(link.size);
            return controls.start();
        },
    };
}
