import { useState } from 'react';

import { c } from 'ttag';

import { ApiReportRollbackState } from '@proton/activation/src/api/api.interface';
import { useTrackImportAction } from '@proton/activation/src/hooks/useTrackImportAction';
import { deleteReportSummary, rollbackReportSummary } from '@proton/activation/src/logic/reports/reports.actions';
import type { Report, ReportSummary } from '@proton/activation/src/logic/reports/reports.interface';
import { useEasySwitchDispatch } from '@proton/activation/src/logic/store';
import { Button } from '@proton/atoms/Button/Button';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import useLoading from '@proton/hooks/useLoading';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';

interface Props {
    summary: ReportSummary;
    report: Report;
}

type ReportAction = 'undo' | 'delete';

export const ReportActions = ({ summary, report }: Props) => {
    const { localID: reportSummaryID, product, rollbackState } = summary;
    const { account, provider } = report;

    const dispatch = useEasySwitchDispatch();
    const trackEvent = useTrackImportAction({ account, provider, product });

    // Only one action can be confirmed or running at a time, so they share the modal and the loading state
    const [selectedAction, setSelectedAction] = useState<ReportAction | null>(null);
    const [modalProps, showModal, renderModal] = useModalState();
    const [loading, withLoading] = useLoading();

    // The action is running or the rollback is, there is nothing left to do on this report
    if (loading || rollbackState === ApiReportRollbackState.ROLLING_BACK) {
        return null;
    }

    const askConfirmation = (action: ReportAction) => {
        setSelectedAction(action);
        showModal(true);
    };

    const handleUndo = () => {
        void withLoading(dispatch(rollbackReportSummary({ reportSummaryID })));
        void trackEvent('undo_import');
        showModal(false);
    };

    const handleDelete = () => {
        void withLoading(dispatch(deleteReportSummary({ reportSummaryID })));
        void trackEvent('delete_report');
        showModal(false);
    };

    return (
        <>
            <SimpleDropdown
                as={Button}
                shape="ghost"
                icon
                pill
                hasCaret={false}
                originalPlacement="bottom-end"
                content={<IcThreeDotsVertical alt={c('Action').t`Import actions`} />}
            >
                <DropdownMenu>
                    {rollbackState === ApiReportRollbackState.CAN_ROLLBACK && (
                        <DropdownMenuButton className="text-left" onClick={() => askConfirmation('undo')}>
                            {c('Action').t`Undo import`}
                        </DropdownMenuButton>
                    )}
                    <DropdownMenuButton className="text-left" onClick={() => askConfirmation('delete')}>
                        {c('Action').t`Remove from the list`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </SimpleDropdown>

            {renderModal && selectedAction === 'undo' && (
                <Prompt
                    {...modalProps}
                    title={c('Confirm modal title').t`Undo this import?`}
                    buttons={[
                        <Button color="danger" onClick={handleUndo}>{c('Action').t`Yes, undo`}</Button>,
                        <Button color="weak" onClick={() => showModal(false)}>{c('Action').t`Cancel`}</Button>,
                    ]}
                >
                    {c('Warning').t`This will remove all messages, folders, and labels created during the import.`}
                </Prompt>
            )}

            {renderModal && selectedAction === 'delete' && (
                <Prompt
                    {...modalProps}
                    title={c('Confirm modal title').t`Remove from the list?`}
                    buttons={[
                        <Button color="danger" onClick={handleDelete}>{c('Action').t`Remove`}</Button>,
                        <Button color="weak" onClick={() => showModal(false)}>{c('Action').t`Keep`}</Button>,
                    ]}
                >
                    {c('Warning').t`You will not see this import record in the list anymore.`}
                </Prompt>
            )}
        </>
    );
};
