import { useEffect } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { NodeType } from '@proton/drive/index';

import { DownloadManager } from '../../../managers/download/DownloadManager';
import type { useSignatureIssueModal } from '../../../modals/SignatureIssueModal';
import { IssueStatus, useDownloadManagerStore } from '../../../zustand/download/downloadManager.store';
import type { TransferManagerEntry } from '../useTransferManagerState';

type Props = {
    entry: TransferManagerEntry;
    cancelTransfer: (entry: TransferManagerEntry) => void;
    showDocumentsModal: (props: { onSubmit: () => void; onCancel: () => void }) => void;
    showSignatureIssueModal: ReturnType<typeof useSignatureIssueModal>['showSignatureIssueModal'];
};

/**
 * Headless watcher that opens the unsupported-file / signature-issue modals
 * when the corresponding download item enters a `Detected` state.
 *
 * Lives at the TransferManager level (rather than inside the virtualized
 * TransferItem list) so the prompts fire even when the manager is minimized
 * or the row is scrolled out of view.
 */
export const DownloadIssueWatcher = ({ entry, cancelTransfer, showDocumentsModal, showSignatureIssueModal }: Props) => {
    const dm = DownloadManager.getInstance();
    const { item } = useDownloadManagerStore(useShallow((state) => ({ item: state.getQueueItem(entry.id) })));

    useEffect(() => {
        const { updateDownloadItem } = useDownloadManagerStore.getState();

        if (item?.unsupportedFileDetected === IssueStatus.Detected) {
            return showDocumentsModal({
                onSubmit: () => {
                    updateDownloadItem(item.downloadId, { unsupportedFileDetected: IssueStatus.Approved });
                },
                onCancel: () => {
                    cancelTransfer(entry);
                    updateDownloadItem(item.downloadId, { unsupportedFileDetected: IssueStatus.Rejected });
                },
            });
        }

        const issues = item?.signatureIssues ?? {};
        const unresolvedIssues = Object.values(issues).filter((issue) => issue.issueStatus === IssueStatus.Detected);
        const issue = unresolvedIssues[0];
        if (!item || !issue) {
            return;
        }
        showSignatureIssueModal({
            isFile: issue.nodeType === NodeType.File || issue.nodeType === NodeType.Photo,
            downloadName: item.name,
            message: issue.message,
            apply: (decision: IssueStatus, applyAll: boolean) => {
                applyAll = decision === IssueStatus.Rejected ? true : applyAll;
                dm.resolveSignatureIssue(item, issue.name, decision, applyAll);
            },
            cancelAll: () => {
                dm.resolveSignatureIssue(item, issue.name, IssueStatus.Rejected, true);
                cancelTransfer(entry);
            },
        });
    }, [item, entry, cancelTransfer, dm, showDocumentsModal, showSignatureIssueModal]);

    return null;
};
