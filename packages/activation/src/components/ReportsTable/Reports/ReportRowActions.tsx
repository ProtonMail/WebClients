import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useAppLink from '@proton/components/components/link/useAppLink';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import { getDriveNodePath } from '@proton/drive/public/nodes';
import useLoading from '@proton/hooks/useLoading';
import { IcFolderOpen } from '@proton/icons/icons/IcFolderOpen';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { APPS } from '@proton/shared/lib/constants';

import type { ApiImportProvider } from '../../../api/api.interface';
import { ApiReportRollbackState } from '../../../api/api.interface';
import { useTrackImportAction } from '../../../hooks/useTrackImportAction';
import type { ImportType } from '../../../interface';
import { deleteReportSummary, rollbackReportSummary } from '../../../logic/reports/reports.actions';
import type { ReportSummary, ReportSummaryID } from '../../../logic/reports/reports.interface';
import { useEasySwitchDispatch } from '../../../logic/store';

interface Props {
    reportSummaryID: ReportSummaryID;
    product: ImportType;
    provider: ApiImportProvider;
    account: string;
    rollbackState: ApiReportRollbackState | undefined;
    importFolder: ReportSummary['importFolder'];
}

const ReportRowActions = ({ reportSummaryID, rollbackState, product, provider, account, importFolder }: Props) => {
    const goToApp = useAppLink();
    const trackEvent = useTrackImportAction({ account, provider, product });
    const dispatch = useEasySwitchDispatch();
    const [deleteModalProps, showDeleteModal, renderDeleteModal] = useModalState();
    const [rollbackModalProps, showRollbackModal, renderRollbackModal] = useModalState();

    const [loadingDeleteRecord, withLoadingDeleteRecord] = useLoading();
    const [loadingUndoRecord, withLoadingUndoRecord] = useLoading();

    if (loadingUndoRecord || rollbackState === ApiReportRollbackState.ROLLING_BACK) {
        return null;
    }

    const handleUndo = () => {
        void withLoadingUndoRecord(dispatch(rollbackReportSummary({ reportSummaryID })));
        void trackEvent('undo_import');
        showRollbackModal(false);
    };

    const handleDelete = () => {
        void withLoadingDeleteRecord(dispatch(deleteReportSummary({ reportSummaryID })));
        void trackEvent('delete_report');
        showDeleteModal(false);
    };

    return (
        <div className="inline-flex gap-1">
            {rollbackState === ApiReportRollbackState.CAN_ROLLBACK && !loadingDeleteRecord && (
                <Button onClick={() => showRollbackModal(true)}>{c('Action').t`Undo import`}</Button>
            )}

            {importFolder && rollbackState !== ApiReportRollbackState.ROLLED_BACK && (
                <Button
                    onClick={() =>
                        goToApp(getDriveNodePath(importFolder.volumeID, importFolder.linkID), APPS.PROTONDRIVE, true)
                    }
                    shape="ghost"
                    icon
                >
                    <IcFolderOpen alt={c('Action').t`Go to folder`} />
                </Button>
            )}

            <Button
                onClick={() => showDeleteModal(true)}
                loading={loadingDeleteRecord}
                data-testid="ReportsTable:deleteReport"
                shape="ghost"
                icon
            >
                <IcTrash alt={c('Action').t`Delete record`} />
            </Button>

            {renderDeleteModal && (
                <Prompt
                    {...deleteModalProps}
                    title={c('Confirm modal title').t`Remove from the list?`}
                    buttons={[
                        <Button color="danger" onClick={handleDelete}>{c('Action').t`Remove`}</Button>,
                        <Button color="weak" onClick={() => showDeleteModal(false)}>{c('Action').t`Keep`}</Button>,
                    ]}
                    data-testid="ReportsTable:deleteModal"
                >
                    {c('Warning').t`You will not see this import record in the list anymore.`}
                </Prompt>
            )}

            {renderRollbackModal && (
                <Prompt
                    {...rollbackModalProps}
                    title={c('Confirm modal title').t`Undo this import?`}
                    buttons={[
                        <Button color="danger" onClick={handleUndo}>{c('Action').t`Yes, undo`}</Button>,
                        <Button color="weak" onClick={() => showRollbackModal(false)}>{c('Action').t`Cancel`}</Button>,
                    ]}
                >
                    {c('Warning').t`This will remove all messages, folders, and labels created during the import.`}
                </Prompt>
            )}
        </div>
    );
};

export default ReportRowActions;
