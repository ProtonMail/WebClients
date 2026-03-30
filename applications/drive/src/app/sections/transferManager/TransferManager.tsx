import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useBeforeUnload, useConfirmActionModal } from '@proton/components';
import { uploadManager } from '@proton/drive/modules/upload';
import clsx from '@proton/utils/clsx';

import type { AbuseReportPrefill } from '../../modals/ReportAbuseModal';
import { useUploadConflictModal } from '../../modals/UploadConflictModal';
import { TransferManagerHeader } from './connectedComponents/TransferManagerHeader';
import { TransferManagerList } from './connectedComponents/TransferManagerList';
import { subscribeToUploadEvents } from './subscribeToUploadEvents';
import { useTransferManagerActions } from './useTransferManagerActions';
import { TransferManagerStatus, useTransferManagerState } from './useTransferManagerState';

import './TransferManager.scss';

interface TransferManagerProps {
    drawerWidth?: number;
    deprecatedRootShareId: string | undefined;
    className?: string;
    onReportAbuse?: (nodeUid: string, prefill?: AbuseReportPrefill) => void;
}

export const TransferManager = ({
    drawerWidth = 0,
    deprecatedRootShareId,
    className,
    onReportAbuse,
}: TransferManagerProps) => {
    const { items, status, isVisible } = useTransferManagerState();
    const {
        clearQueue,
        cancelAll,
        cancelTransfer,
        retryTransfer,
        retryFailedTransfers,
        share,
        confirmModal: actionsConfirmModal,
        sharingModal,
        containsDocumentModal,
        showDocumentsModal,
        signatureIssueModal,
        showSignatureIssueModal,
    } = useTransferManagerActions();
    const [isMinimized, setMinimized] = useState(false);
    const [leaveMessage, setLeaveMessage] = useState('');
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    useBeforeUnload(leaveMessage);

    const [uploadConflictModal, showUploadConflictModal] = useUploadConflictModal();

    useEffect(() => {
        if (status === TransferManagerStatus.InProgress || status === TransferManagerStatus.Failed) {
            const message = c('Unload warning').t`Changes you made may not be saved.`;
            setLeaveMessage(message);
        } else {
            setLeaveMessage('');
        }
    }, [status]);

    useEffect(() => {
        uploadManager.setConflictResolver(async (name, nodeType, conflictType) => {
            return new Promise<{ strategy: any; applyToAll: boolean }>((resolve) => {
                showUploadConflictModal({
                    name,
                    nodeType,
                    conflictType,
                    onResolve: (strategy, applyToAll) => {
                        resolve({ strategy, applyToAll });
                    },
                });
            });
        });

        const unsubscribe = subscribeToUploadEvents();

        return () => {
            unsubscribe();
            uploadManager.removeConflictResolver();
        };
    }, [showUploadConflictModal]);

    const toggleMinimize = () => {
        setMinimized((value) => !value);
    };

    const onClose = () => {
        if (status === TransferManagerStatus.InProgress || status === TransferManagerStatus.Failed) {
            void showConfirmModal({
                title: c('Title').t`Stop transfers?`,
                cancelText: c('Action').t`Continue transfers`,
                submitText: c('Action').t`Stop transfers`,
                message: c('Info')
                    .t`There are files that still need to be transferred. Closing the transfer manager will end all operations.`,
                onSubmit: async () => clearQueue(),
                canUndo: true,
            });
        } else {
            clearQueue();
        }
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div
            id="transfer-manager"
            className={clsx('transfer-manager-fixed-position right-custom border border-weak', className)}
            style={{
                '--right-custom': `${(drawerWidth + 32) / 16}rem`, // 32 == 2rem
            }}
        >
            <section aria-label={c('Label').t`File transfer overview`}>
                <TransferManagerHeader
                    toggleMinimize={toggleMinimize}
                    isMinimized={isMinimized}
                    onClose={onClose}
                    cancelAll={cancelAll}
                    retryFailedTransfers={retryFailedTransfers}
                />

                {!isMinimized && (
                    <div className="mt-3" data-testid="drive-transfers-manager:list">
                        <TransferManagerList
                            items={items}
                            deprecatedRootShareId={deprecatedRootShareId}
                            share={share}
                            cancelTransfer={cancelTransfer}
                            retryTransfer={retryTransfer}
                            showDocumentsModal={showDocumentsModal}
                            showSignatureIssueModal={showSignatureIssueModal}
                            onReportAbuse={onReportAbuse}
                        />
                    </div>
                )}
                {uploadConflictModal}
                {confirmModal}
                {actionsConfirmModal}
                {sharingModal}
                {containsDocumentModal}
                {signatureIssueModal}
            </section>
        </div>
    );
};
