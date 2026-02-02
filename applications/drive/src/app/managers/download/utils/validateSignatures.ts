import type { NodeEntity } from '@proton/drive';

import { IssueStatus } from '../../../zustand/download/downloadManager.store';
import {
    addAndWaitForManifestIssueDecision,
    addAndWaitForMetadataIssueDecision,
    detectMetadataSignatureIssue,
} from './signatureIssues';

/**
 * Checks for metadata signature issues before download starts.
 * Returns the user's decision: approved, rejected, or no issue detected.
 */
export async function checkMetadataSignature(
    downloadId: string,
    node: NodeEntity,
    onApproved: () => void | Promise<void>,
    onRejected: () => void | Promise<void>
): Promise<void> {
    const metadataIssueLocation = detectMetadataSignatureIssue(node);
    if (metadataIssueLocation !== undefined) {
        const decision = await addAndWaitForMetadataIssueDecision(downloadId, node, metadataIssueLocation);
        if (decision === IssueStatus.Approved) {
            await onApproved();
        } else {
            await onRejected();
        }
    } else {
        await onApproved();
    }
}

/**
 * Handles manifest signature errors that occur during download completion.
 * Only call this when controller.isDownloadCompleteWithSignatureIssues() returns true.
 */
export async function handleManifestSignatureError(
    downloadId: string,
    node: NodeEntity,
    onApproved: () => void | Promise<void>,
    onRejected: () => void | Promise<void>
): Promise<void> {
    const decision = await addAndWaitForManifestIssueDecision(downloadId, node);
    if (decision === IssueStatus.Approved) {
        await onApproved();
    } else {
        await onRejected();
    }
}
