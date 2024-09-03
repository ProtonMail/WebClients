// @ts-ignore missing `toStream` TS definitions
import { readToEnd, toStream } from '@openpgp/web-stream-tools';
import type { ReadableStream } from 'web-streams-polyfill';

import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import type { SharedFileScan } from '@proton/shared/lib/interfaces/drive/sharing';
import { generateContentHash } from '@proton/shared/lib/keys/driveKeys';

import { sendErrorReport } from '../../../utils/errorHandling';
import { EnrichedError } from '../../../utils/errorHandling/EnrichedError';
import { decryptExtendedAttributes } from '../../_links/extendedAttributes';
import type {
    DecryptFileKeys,
    DownloadCallbacks,
    DownloadStreamControls,
    LinkDownload,
    LogCallback,
} from '../interface';
import { markErrorAsCrypto } from '../markErrorAsCrypto';
import initDownloadBlocks from './downloadBlocks';

/**
 * initDownloadLinkFile prepares controls to download the provided file.
 * This epxects only file blocks, not thumbnail block, thus detached
 * signature is required. To download thumbnail, use thumbnail helper.
 */
export default function initDownloadLinkFile(
    link: LinkDownload,
    callbacks: DownloadCallbacks,
    logCallback: LogCallback,
    options?: { virusScan?: boolean }
): DownloadStreamControls {
    let keysPromise: Promise<DecryptFileKeys> | undefined;
    let scanResult: (SharedFileScan & { Hash: string }) | undefined;

    const log = (message: string) => logCallback(`file ${link.linkId}: ${message}`);

    const transformBlockStream = async (
        abortSignal: AbortSignal,
        stream: ReadableStream<Uint8Array>,
        encSignature: string
    ) => {
        if (!keysPromise) {
            keysPromise = callbacks.getKeys(abortSignal, link);
        }

        const keys = await keysPromise;

        const decryptedSignature = await markErrorAsCrypto<Uint8Array>(async () => {
            const { data: decryptedSignature } = await CryptoProxy.decryptMessage({
                armoredMessage: encSignature,
                decryptionKeys: keys.privateKey,
                format: 'binary',
            });
            return decryptedSignature;
        });

        const binaryMessage = await readToEnd<Uint8Array>(stream);
        const hash = (await generateContentHash(binaryMessage)).BlockHash;

        const { data, verified } = await markErrorAsCrypto<{ data: Uint8Array; verified: VERIFICATION_STATUS }>(
            async () => {
                const { data, verified } = await CryptoProxy.decryptMessage({
                    binaryMessage,
                    binarySignature: decryptedSignature,
                    sessionKeys: keys.sessionKeys,
                    verificationKeys: keys.addressPublicKeys,
                    format: 'binary',
                });
                return { data, verified };
            }
        );

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

    const scanHash = async (abortSignal: AbortSignal, Hash: string) => {
        const response = await callbacks.scanFilesHash?.(abortSignal, [Hash]);
        if (response?.Code === 1000) {
            if ((response?.Errors.length > 0 || response?.Results[0]?.Safe === false) && callbacks?.onScanIssue) {
                await callbacks.onScanIssue(
                    abortSignal,
                    response.Errors[0] && new Error(response.Errors[0]?.Error),
                    response?.Results[0]
                );
            }
            scanResult = { ...response, Hash };
        }
    };

    const scanForVirus = async (abortSignal: AbortSignal, encryptedXAttr: string) => {
        if (!keysPromise) {
            keysPromise = callbacks.getKeys(abortSignal, link);
        }

        const keys = await keysPromise;

        const { xattrs } = await decryptExtendedAttributes(
            encryptedXAttr,
            keys.privateKey,
            keys.addressPublicKeys || []
        );
        const xAttrHash = xattrs?.Common?.Digests?.SHA1;
        if (xAttrHash) {
            await scanHash(abortSignal, xAttrHash);
        }
    };

    const checkFileHash = async (abortSignal: AbortSignal, Hash: string) => {
        if (scanResult?.Hash === Hash) {
            return;
        }

        // If we have hash from xAttributes which doesn't match computed hash, lets report to Sentry.
        // Revision is immutable so if hash suddenly differ, there is either some bug we should care about,
        // or someone messing with our API, maybe 3rd party client.
        if (!!scanResult?.Hash && scanResult?.Hash !== Hash) {
            const { shareId, linkId } = link;
            log('Computed hash does not match XAttr');
            sendErrorReport(
                new EnrichedError('Computed hash does not match XAttr', {
                    tags: { shareId, linkId },
                })
            );
        }
        await scanHash(abortSignal, Hash);
    };

    const controls = initDownloadBlocks(
        link.name,
        {
            ...callbacks,
            getBlocks: (abortSignal, pagination) =>
                callbacks.getBlocks(abortSignal, link.shareId, link.linkId, pagination, link.revisionId),
            scanForVirus: options?.virusScan ? scanForVirus : undefined,
            checkFileHash: options?.virusScan ? checkFileHash : undefined,
            transformBlockStream,
            checkManifestSignature,
            onProgress: (bytes: number) => {
                callbacks.onProgress?.([link.linkId], bytes);
            },
            onFinish: () => {
                log(`blocks download finished`);
                callbacks.onFinish?.();
            },
        },
        log
    );
    return {
        ...controls,
        start: () => {
            const linkSizes = Object.fromEntries([[link.linkId, link.size]]);
            log(`starting ${link.linkId}, size: ${link.size}`);
            callbacks.onInit?.(link.size, linkSizes);
            return controls.start();
        },
    };
}
