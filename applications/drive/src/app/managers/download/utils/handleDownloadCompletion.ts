import type { DownloadController, NodeEntity } from '@proton/drive';

import { checkMetadataSignature, handleManifestSignatureError } from './validateSignatures';

type ValidateDownloadSignaturesParams = {
    downloadId: string;
    node: NodeEntity;
    controller: DownloadController;
    onApproved: () => void | Promise<void>;
    onRejected: () => void | Promise<void>;
    onError?: (error: unknown) => void | Promise<void>;
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
}: ValidateDownloadSignaturesParams): Promise<void> {
    try {
        // Check metadata signature and wait for controller completion
        await checkMetadataSignature(downloadId, node, () => controller.completion(), onRejected);

        await onApproved();
    } catch (error) {
        if (controller.isDownloadCompleteWithSignatureIssues()) {
            // Handle manifest signature issues
            await handleManifestSignatureError(downloadId, node, onApproved, onRejected);
        } else {
            // Call error handler if provided, otherwise re-throw
            if (onError) {
                await onError(error);
            }
            throw error;
        }
    }
}
