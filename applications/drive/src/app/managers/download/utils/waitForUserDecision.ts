import { IssueStatus, useDownloadManagerStore } from '../../../zustand/download/downloadManager.store';
import { downloadLogDebug } from './downloadLogger';

const USER_DECISION_CHECK_TIMEOUT = 500;

type UserDecision = IssueStatus.Approved | IssueStatus.Rejected;

export const waitForUnsupportedFileDecision = (downloadId: string, onSuccess: () => void): Promise<UserDecision> => {
    const { getQueueItem } = useDownloadManagerStore.getState();

    return new Promise<UserDecision>((resolve, reject) => {
        const checkDecision = () => {
            const item = getQueueItem(downloadId);
            if (!item) {
                reject(new Error('Download item not found waiting for UnsupportedFileDecision'));
                return;
            }
            if (item.unsupportedFileDetected === IssueStatus.Approved) {
                downloadLogDebug('unsupportedFileDetected decision approved', downloadId);
                onSuccess();
                resolve(IssueStatus.Approved);
                return;
            }
            if (item.unsupportedFileDetected === IssueStatus.Rejected) {
                downloadLogDebug('unsupportedFileDetected decision reject', downloadId);
                resolve(IssueStatus.Rejected); // reject would trigger a failed download instead of cancel
                return;
            }
            setTimeout(checkDecision, USER_DECISION_CHECK_TIMEOUT);
        };
        checkDecision();
    });
};

export const waitForSignatureIssueDecision = (downloadId: string, issueName: string): Promise<UserDecision> => {
    const { getQueueItem } = useDownloadManagerStore.getState();

    return new Promise<UserDecision>((resolve, reject) => {
        const checkDecision = () => {
            const item = getQueueItem(downloadId);
            const issue = item?.signatureIssues?.[issueName];
            if (!item) {
                reject(new Error('Download item not found waiting for SignatureIssueDecision'));
                return;
            }
            if (!issue) {
                // Weird case that should not happen, it's just here as a failsafe
                resolve(IssueStatus.Approved);
                return;
            }
            if (issue.issueStatus === IssueStatus.Approved) {
                downloadLogDebug('signatureIssueDetected decision approved', downloadId);
                resolve(IssueStatus.Approved);
                return;
            }
            if (issue.issueStatus === IssueStatus.Rejected) {
                downloadLogDebug('signatureIssueDetected decision reject', downloadId);
                resolve(IssueStatus.Rejected); // reject would trigger a failed download instead of cancel
                return;
            }
            setTimeout(checkDecision, USER_DECISION_CHECK_TIMEOUT);
        };
        checkDecision();
    });
};
