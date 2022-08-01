import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { deleteImportReport, rollbackImport } from '@proton/shared/lib/api/easySwitch';
import { ImportReportRollbackState, ImportType } from '@proton/shared/lib/interfaces/EasySwitch';

import { Alert, ConfirmModal, DropdownActions } from '../../../components';
import { useApi, useEventManager, useLoading, useModals, useNotifications } from '../../../hooks';

interface Props {
    ID: string;
    importType: ImportType;
    rollbackState: ImportReportRollbackState | undefined;
}

const ImportReportRowActions = ({ ID, importType, rollbackState }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createModal } = useModals();

    const { createNotification } = useNotifications();

    const [loadingDeleteRecord, withLoadingDeleteRecord] = useLoading();
    const [loadingUndoRecord, withLoadingUndoRecord] = useLoading();

    const handleDeleteRecord = async () => {
        await new Promise<void>((resolve, reject) => {
            createModal(
                <ConfirmModal
                    onConfirm={resolve}
                    onClose={reject}
                    title={c('Confirm modal title').t`Remove from the list?`}
                    cancel={c('Action').t`Keep`}
                    confirm={<Button color="danger" type="submit">{c('Action').t`Remove`}</Button>}
                >
                    <Alert className="mb1" type="error">
                        {c('Warning').t`You will not see this import record in the list anymore.`}
                    </Alert>
                </ConfirmModal>
            );
        });
        await withLoadingDeleteRecord(api(deleteImportReport(ID, importType)));
        await call();
        createNotification({ text: c('Success').t`Import record deleted` });
    };

    const handleRollbackRecord = async () => {
        await new Promise<void>((resolve, reject) => {
            createModal(
                <ConfirmModal
                    onConfirm={resolve}
                    onClose={reject}
                    title={c('Confirm modal title').t`Undo this import?`}
                    cancel={c('Action').t`Cancel`}
                    confirm={<Button color="danger" type="submit">{c('Action').t`Yes, undo`}</Button>}
                >
                    <Alert className="mb1" type="error">
                        {c('Warning').t`This will remove all messages, folders, and labels created during the import.`}
                    </Alert>
                </ConfirmModal>
            );
        });
        await withLoadingUndoRecord(api(rollbackImport(ID, [importType])));
        await call();
        createNotification({ text: c('Success').t`Undo in progress` });
    };

    const list =
        loadingUndoRecord || rollbackState === ImportReportRollbackState.ROLLING_BACK
            ? []
            : [
                  {
                      text: c('Action').t`Delete record`,
                      onClick: handleDeleteRecord,
                      loading: loadingDeleteRecord,
                  },
                  ...(rollbackState === ImportReportRollbackState.CAN_ROLLBACK && !loadingDeleteRecord
                      ? [
                            {
                                text: c('Action').t`Undo import`,
                                onClick: handleRollbackRecord,
                            },
                        ]
                      : []),
              ];

    return <DropdownActions size="small" list={list} />;
};

export default ImportReportRowActions;
