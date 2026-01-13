import type { UnverifiedAuthorError } from '@protontech/drive-sdk';
import { c } from 'ttag';

import type { NodeEntity } from '@proton/drive/index';

import { IssueStatus, useDownloadManagerStore } from '../../../zustand/download/downloadManager.store';
import type { UserDecision } from './waitForUserDecision';
import { waitForSignatureIssueDecision } from './waitForUserDecision';

export const addAndWaitForManifestIssueDecision = (downloadId: string, node: NodeEntity): Promise<UserDecision> => {
    const { addSignatureIssue, getQueueItem } = useDownloadManagerStore.getState();
    const item = getQueueItem(downloadId);
    if (item && item.signatureIssues && Object.values(item.signatureIssues).length) {
        const decision = Object.values(item.signatureIssues)[0].issueStatus;
        return Promise.resolve(decision === IssueStatus.Approved ? IssueStatus.Approved : IssueStatus.Rejected);
    }

    // Use the claimed author name if available or fallback to a generic "who" string
    const that = c('Info').t`that`;
    let nameAuthor = node.nameAuthor.ok ? node.nameAuthor.value : node.nameAuthor.error.claimedAuthor;
    nameAuthor = !!nameAuthor ? `${that} ${nameAuthor}` : c('Info').t`who`;

    addSignatureIssue(downloadId, {
        name: node.name,
        nodeType: node.type,
        message: c('Info')
            .t`We couldn't verify ${nameAuthor} uploaded ${node.name}. The following may have been tampered with: file data order. Only open if you trust it.`,
        issueStatus: IssueStatus.Detected,
    });
    return waitForSignatureIssueDecision(downloadId, node.name);
};

export const detectMetadataSignatureIssue = (node: NodeEntity): UnverifiedAuthorError | undefined => {
    let error;
    if (!node.keyAuthor.ok) {
        error = node.keyAuthor.error;
    }
    if (!node.nameAuthor.ok) {
        error = node.nameAuthor.error;
    }
    if (node.activeRevision && !node.activeRevision.contentAuthor.ok) {
        error = node.activeRevision.contentAuthor.error;
    }
    return error;
};

export const addAndWaitForMetadataIssueDecision = (
    downloadId: string,
    node: NodeEntity,
    error: UnverifiedAuthorError
): Promise<UserDecision> => {
    useDownloadManagerStore.getState().addSignatureIssue(downloadId, {
        name: node.name,
        nodeType: node.type,
        message: error.error,
        issueStatus: IssueStatus.Detected,
    });
    return waitForSignatureIssueDecision(downloadId, node.name);
};
