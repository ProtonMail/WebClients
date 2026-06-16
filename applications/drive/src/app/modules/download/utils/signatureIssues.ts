import type { UnverifiedAuthorError } from '@protontech/drive-sdk';
import { c } from 'ttag';

import type { NodeEntity } from '@proton/drive/index';
import { getNodeName } from '@proton/drive/modules/nodes';

import { IssueStatus, useDownloadManagerStore } from '../downloadManager.store';
import type { UserDecision } from './waitForUserDecision';
import { waitForSignatureIssueDecision } from './waitForUserDecision';

export const addAndWaitForManifestIssueDecision = (downloadId: string, node: NodeEntity): Promise<UserDecision> => {
    const { addSignatureIssue, getQueueItem } = useDownloadManagerStore.getState();
    const item = getQueueItem(downloadId);

    // Honor a blanket decision pre-set on the item, don't bother showing the modal or polling
    const allDecision = item?.signatureIssueAllDecision;
    if (allDecision === IssueStatus.Approved || allDecision === IssueStatus.Rejected) {
        return Promise.resolve(allDecision);
    }

    if (item && item.signatureIssues && Object.values(item.signatureIssues).length) {
        const decision = Object.values(item.signatureIssues)[0].issueStatus;
        return Promise.resolve(decision === IssueStatus.Approved ? IssueStatus.Approved : IssueStatus.Rejected);
    }

    // Use the claimed author name if available or fallback to a generic "who" string
    const that = c('Info').t`that`;
    let nameAuthor = node.nameAuthor.ok ? node.nameAuthor.value : node.nameAuthor.error.claimedAuthor;
    nameAuthor = !!nameAuthor ? `${that} ${nameAuthor}` : c('Info').t`who`;

    const nodeName = getNodeName(node);
    addSignatureIssue(downloadId, {
        name: nodeName,
        nodeType: node.type,
        message: c('Info')
            .t`We couldn't verify ${nameAuthor} uploaded ${nodeName}. The following may have been tampered with: file data order. Only open if you trust it.`,
        issueStatus: IssueStatus.Detected,
    });
    return waitForSignatureIssueDecision(downloadId, nodeName);
};

export const detectMetadataSignatureIssue = (node: NodeEntity): UnverifiedAuthorError | undefined => {
    let error;
    if (!node.keyAuthor.ok) {
        error = node.keyAuthor.error;
    }
    if (!node.nameAuthor.ok) {
        error = node.nameAuthor.error;
    }
    const activeRevision = node.activeRevision?.ok ? node.activeRevision.value : undefined;
    if (activeRevision && !activeRevision.contentAuthor.ok) {
        error = activeRevision.contentAuthor.error;
    }
    return error;
};

export const addAndWaitForMetadataIssueDecision = (
    downloadId: string,
    node: NodeEntity,
    error: UnverifiedAuthorError
): Promise<UserDecision> => {
    const { addSignatureIssue, getQueueItem } = useDownloadManagerStore.getState();

    // Honor a blanket decision pre-set on the item, don't show the modal or polling.
    const allDecision = getQueueItem(downloadId)?.signatureIssueAllDecision;
    if (allDecision === IssueStatus.Approved || allDecision === IssueStatus.Rejected) {
        return Promise.resolve(allDecision);
    }

    const nodeName = getNodeName(node);
    addSignatureIssue(downloadId, {
        name: nodeName,
        nodeType: node.type,
        message: error.error,
        issueStatus: IssueStatus.Detected,
    });
    return waitForSignatureIssueDecision(downloadId, nodeName);
};
