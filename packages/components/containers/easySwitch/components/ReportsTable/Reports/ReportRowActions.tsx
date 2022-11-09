import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Alert, AlertModal, DropdownActions, useModalState } from '@proton/components';
import { useLoading } from '@proton/components/hooks';
import { ImportReportRollbackState } from '@proton/shared/lib/interfaces/EasySwitch';

import { deleteReportSummary, rollbackReportSummary } from '../../../logic/reports/reports.actions';
import { ReportSummaryID } from '../../../logic/reports/reports.interface';
import { useEasySwitchDispatch } from '../../../logic/store';
import { ApiReportRollbackState } from '../../../logic/types/api.types';

interface Props {
    reportSummaryID: ReportSummaryID;
    // TODO: Remove ImportReportRollbackState when redux migration done
    rollbackState: ImportReportRollbackState | ApiReportRollbackState | undefined;
}

const ReportRowActions = ({ reportSummaryID, rollbackState }: Props) => {
    const dispatch = useEasySwitchDispatch();
    const [deleteModalProps, showDeleteModal, renderDeleteModal] = useModalState();
    const [rollbackModalProps, showRollbackModal, renderRollbackModal] = useModalState();

    const [loadingDeleteRecord, withLoadingDeleteRecord] = useLoading();
    const [loadingUndoRecord, withLoadingUndoRecord] = useLoading();

    // TODO: Move actions list to store
    const list =
        loadingUndoRecord || rollbackState === ImportReportRollbackState.ROLLING_BACK
            ? []
            : [
                  {
                      text: c('Action').t`Delete record`,
                      onClick: () => showDeleteModal(true),
                      loading: loadingDeleteRecord,
                  },
                  ...(rollbackState === ImportReportRollbackState.CAN_ROLLBACK && !loadingDeleteRecord
                      ? [
                            {
                                text: c('Action').t`Undo import`,
                                onClick: () => showRollbackModal(true),
                            },
                        ]
                      : []),
              ];

    return (
        <>
            <DropdownActions size="small" list={list} />

            {renderDeleteModal && (
                <AlertModal
                    {...deleteModalProps}
                    title={c('Confirm modal title').t`Remove from the list?`}
                    buttons={[
                        <Button
                            color="danger"
                            onClick={() => {
                                void withLoadingDeleteRecord(dispatch(deleteReportSummary({ reportSummaryID })));
                                showDeleteModal(false);
                            }}
                        >{c('Action').t`Remove`}</Button>,
                        <Button color="weak" onClick={() => showDeleteModal(false)}>{c('Action').t`Keep`}</Button>,
                    ]}
                >
                    <Alert className="mb1" type="error">
                        {c('Warning').t`You will not see this import record in the list anymore.`}
                    </Alert>
                </AlertModal>
            )}

            {renderRollbackModal && (
                <AlertModal
                    {...rollbackModalProps}
                    title={c('Confirm modal title').t`Undo this import?`}
                    buttons={[
                        <Button
                            color="danger"
                            onClick={() => {
                                void withLoadingUndoRecord(dispatch(rollbackReportSummary({ reportSummaryID })));
                                showRollbackModal(false);
                            }}
                        >{c('Action').t`Yes, undo`}</Button>,
                        <Button color="weak" onClick={() => showRollbackModal(false)}>{c('Action').t`Cancel`}</Button>,
                    ]}
                >
                    <Alert className="mb1" type="error">
                        {c('Warning').t`This will remove all messages, folders, and labels created during the import.`}
                    </Alert>
                </AlertModal>
            )}
        </>
    );
};

export default ReportRowActions;
