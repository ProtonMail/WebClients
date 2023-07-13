import { c } from 'ttag';

import { ApiReportRollbackState } from '@proton/activation/src/api/api.interface';
import { deleteReportSummary, rollbackReportSummary } from '@proton/activation/src/logic/reports/reports.actions';
import { ReportSummaryID } from '@proton/activation/src/logic/reports/reports.interface';
import { useEasySwitchDispatch } from '@proton/activation/src/logic/store';
import { Button } from '@proton/atoms';
import { Alert, DropdownActions, Prompt, useModalState } from '@proton/components';
import { useLoading } from '@proton/hooks';

interface Props {
    reportSummaryID: ReportSummaryID;
    rollbackState: ApiReportRollbackState | undefined;
}

const ReportRowActions = ({ reportSummaryID, rollbackState }: Props) => {
    const dispatch = useEasySwitchDispatch();
    const [deleteModalProps, showDeleteModal, renderDeleteModal] = useModalState();
    const [rollbackModalProps, showRollbackModal, renderRollbackModal] = useModalState();

    const [loadingDeleteRecord, withLoadingDeleteRecord] = useLoading();
    const [loadingUndoRecord, withLoadingUndoRecord] = useLoading();

    const list =
        loadingUndoRecord || rollbackState === ApiReportRollbackState.ROLLING_BACK
            ? []
            : [
                  {
                      text: c('Action').t`Delete record`,
                      onClick: () => showDeleteModal(true),
                      loading: loadingDeleteRecord,
                      'data-testid': 'ReportsTable:deleteReport',
                  },
                  ...(rollbackState === ApiReportRollbackState.CAN_ROLLBACK && !loadingDeleteRecord
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
                <Prompt
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
                    data-testid="ReportsTable:deleteModal"
                >
                    <Alert className="mb-4" type="error">
                        {c('Warning').t`You will not see this import record in the list any more.`}
                    </Alert>
                </Prompt>
            )}

            {renderRollbackModal && (
                <Prompt
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
                    <Alert className="mb-4" type="error">
                        {c('Warning').t`This will remove all messages, folders, and labels created during the import.`}
                    </Alert>
                </Prompt>
            )}
        </>
    );
};

export default ReportRowActions;
