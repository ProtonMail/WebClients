import { c } from 'ttag';

import { ImportType } from '@proton/shared/lib/interfaces/EasySwitch';
import { deleteImportReport } from '@proton/shared/lib/api/easySwitch';

import { ConfirmModal, Button, Alert, DropdownActions } from '../../../components';
import { useApi, useLoading, useNotifications, useEventManager, useModals } from '../../../hooks';

interface Props {
    ID: string;
    importType: ImportType;
}

const ImportReportRowActions = ({ ID, importType }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createModal } = useModals();

    const { createNotification } = useNotifications();

    const [loadingDeleteRecord, withLoadingDeleteRecord] = useLoading();

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

    const list = [
        {
            text: c('Action').t`Delete record`,
            onClick: handleDeleteRecord,
            loading: loadingDeleteRecord,
        },
    ];

    return <DropdownActions size="small" list={list} />;
};

export default ImportReportRowActions;
