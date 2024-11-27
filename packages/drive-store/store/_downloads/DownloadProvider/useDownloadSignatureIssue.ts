import { useCallback, useEffect, useRef, useState } from 'react';

import { TransferCancel, TransferState } from '../../../components/TransferManager/transfer';
import { useSignatureIssueModal } from '../../../components/modals/SignatureIssueModal';
import { waitUntil } from '../../../utils/async';
import { isTransferActive, isTransferSignatureIssue } from '../../../utils/transfer';
import type { SignatureIssues } from '../../_links';
import type { LinkDownload } from '../interface';
import { TransferSignatureIssueStrategy } from '../interface';
import type { Download, UpdateData, UpdateFilter, UpdateState } from './interface';

// Empty string is ensured to not conflict with any upload ID or folder name.
// No upload has empty ID.
const SIGNATURE_ISSUE_STRATEGY_ALL_ID = '';

export default function useDownloadSignatureIssue(
    downloads: Download[],
    updateState: (filter: UpdateFilter, newState: UpdateState) => void,
    updateWithData: (filter: UpdateFilter, newState: UpdateState, data: UpdateData) => void,
    cancelDownloads: (filter: UpdateFilter) => void
) {
    const [signatureIssueModal, showSignatureIssueModal] = useSignatureIssueModal();

    // There should be only one modal to choose conflict strategy.
    const isSignatureIssueModalOpen = useRef(false);

    // Signature issue strategy is set per download and link as one download
    // (e.g., folder) can contain many files and we need to report on every
    // single one. If user wants to apply the chosen strategy for all cases,
    // SIGNATURE_ISSUE_STRATEGY_ALL_ID key is used.
    // Strategies are cleared once all downloads are finished so user is asked
    // again (consider that user could do another download after an hour).
    const signatureIssueStrategies = useRef<{ [downloadAndLinkId: string]: TransferSignatureIssueStrategy }>({});

    // List of all issues which needs to be handled.
    const [signatureIssues, setSignatureIssues] = useState<
        { download: Download; link: LinkDownload; linkSignatureIssues: SignatureIssues }[]
    >([]);

    useEffect(() => {
        // "Apply to all" should be active till the last transfer is active.
        // Once all transfers finish, user can start another minutes or hours
        // later and that means we should ask again.
        const hasNoActiveUpload = !downloads.find(isTransferActive);
        if (hasNoActiveUpload) {
            signatureIssueStrategies.current = {};
        }
    }, [downloads]);

    /**
     * handleSignatureIssue either returns the strategy right away, or it sets
     * the state of the download to signature issue which will open
     * SignatureIssueModal to ask user what to do next. Handler waits till the
     * user selects the strategy.
     */
    const handleSignatureIssue = useCallback(
        (
            abortSignal: AbortSignal,
            download: Download,
            link: LinkDownload,
            signatureIssues: SignatureIssues
        ): Promise<TransferSignatureIssueStrategy> => {
            const getStrategy = (): TransferSignatureIssueStrategy | undefined => {
                return (
                    signatureIssueStrategies.current[SIGNATURE_ISSUE_STRATEGY_ALL_ID] ||
                    signatureIssueStrategies.current[download.id + link.linkId]
                );
            };

            const strategy = getStrategy();
            if (strategy) {
                return Promise.resolve(strategy);
            }

            setSignatureIssues((issues) => [...issues, { download, link, linkSignatureIssues: signatureIssues }]);
            updateWithData(download.id, TransferState.SignatureIssue, {});

            return new Promise((resolve, reject) => {
                waitUntil(() => !!getStrategy(), abortSignal)
                    .then(() => {
                        const strategy = getStrategy() as TransferSignatureIssueStrategy;
                        resolve(strategy);
                    })
                    .catch(() => {
                        reject(new TransferCancel({ message: 'Download was canceled' }));
                    });
            });
        },
        [updateState]
    );

    const openSignatureIssueModal = (
        downloadId: string,
        linkId: string,
        params: {
            isFile: boolean;
            name: string;
            downloadName: string;
            signatureIssues: SignatureIssues;
            signatureAddress?: string;
        }
    ) => {
        isSignatureIssueModalOpen.current = true;

        const apply = (strategy: TransferSignatureIssueStrategy, all: boolean) => {
            isSignatureIssueModalOpen.current = false;
            signatureIssueStrategies.current[all ? SIGNATURE_ISSUE_STRATEGY_ALL_ID : downloadId + linkId] = strategy;

            if (all) {
                setSignatureIssues([]);
                if (strategy === TransferSignatureIssueStrategy.Abort) {
                    cancelDownloads(isTransferSignatureIssue);
                    return;
                }
                updateState(isTransferSignatureIssue, TransferState.Progress);
                return;
            }

            if (strategy === TransferSignatureIssueStrategy.Abort) {
                setSignatureIssues((signatureIssues) =>
                    signatureIssues.filter((issue) => issue.download.id !== downloadId)
                );
                cancelDownloads(downloadId);
                return;
            }
            setSignatureIssues((signatureIssues) => {
                const newSignatureIssues = signatureIssues.filter(
                    (issue) => issue.download.id !== downloadId || issue.link.linkId !== linkId
                );
                if (!newSignatureIssues.some((issue) => issue.download.id === downloadId)) {
                    updateState(downloadId, TransferState.Progress);
                }
                return newSignatureIssues;
            });
        };
        const cancelAll = () => {
            isSignatureIssueModalOpen.current = false;
            signatureIssueStrategies.current[SIGNATURE_ISSUE_STRATEGY_ALL_ID] = TransferSignatureIssueStrategy.Abort;
            setSignatureIssues([]);
            cancelDownloads(isTransferActive);
        };
        void showSignatureIssueModal({ apply, cancelAll, ...params });
    };

    // Modals are openned on this one place only to not have race condition
    // issue and ensure only one modal is openned.
    useEffect(() => {
        if (isSignatureIssueModalOpen.current || !signatureIssues.length) {
            return;
        }

        const { download, link, linkSignatureIssues } = signatureIssues[0];
        openSignatureIssueModal(download.id, link.linkId, {
            isFile: link.isFile,
            name: link.name,
            downloadName: download.meta.filename,
            signatureIssues: linkSignatureIssues,
            signatureAddress: link.signatureAddress,
        });
    }, [signatureIssues]);

    return {
        handleSignatureIssue,
        signatureIssueModal,
    };
}
