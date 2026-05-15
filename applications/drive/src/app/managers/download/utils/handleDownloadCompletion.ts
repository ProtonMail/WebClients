import type { DownloadController, NodeEntity } from '@proton/drive';

import { checkMetadataSignature, handleManifestSignatureError } from './validateSignatures';

type ValidateDownloadSignaturesParams = {
    downloadId: string;
    node: NodeEntity;
    controller: DownloadController;
    onApproved: () => void | Promise<void>;
    onRejected: () => void | Promise<void>;
    onError?: (error: unknown) => void | Promise<void>;
    skipSignatureCheck?: boolean;
};

/**
 * Validates signatures during download completion.
 * Malware detection happens separately via stream middleware.
 * 1. Metadata signature check
 * 2. Controller completion
 * 3. Manifest signature error handling
 */
export async function validateDownloadSignatures({
    downloadId,
    node,
    controller,
    onApproved,
    onRejected,
    onError,
    skipSignatureCheck,
}: ValidateDownloadSignaturesParams): Promise<void> {
    try {
        if (skipSignatureCheck) {
            await controller.completion();
        } else {
            await checkMetadataSignature(downloadId, node, () => controller.completion(), onRejected);
        }
        await onApproved();
    } catch (error) {
        if (controller.isDownloadCompleteWithSignatureIssues()) {
            if (skipSignatureCheck) {
                await onApproved();
            } else {
                await handleManifestSignatureError(downloadId, node, onApproved, onRejected);
            }
        } else {
            if (onError) {
                await onError(error);
            }
            throw error;
        }
    }
}
