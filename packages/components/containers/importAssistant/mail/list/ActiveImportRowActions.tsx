import { c } from 'ttag';
import { resumeMailImportJob, cancelMailImportJob } from '@proton/shared/lib/api/mailImport';
import { NormalizedImporter, ImportStatus, ImportError } from '@proton/shared/lib/interfaces/EasySwitch';

import { Alert, ConfirmModal, DropdownActions, Button } from '../../../../components';
import { useApi, useLoading, useNotifications, useEventManager, useModals, useAddresses } from '../../../../hooks';
import ImportMailModal from '../modals/ImportMailModal';

interface Props {
    currentImport: NormalizedImporter;
}

const ActiveImportRowActions = ({ currentImport }: Props) => {
    const { ID, Active } = currentImport;
    const { State, ErrorCode } = Active || {};
    const api = useApi();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [addresses, loadingAddresses] = useAddresses();
    const [loadingPrimaryAction, withLoadingPrimaryAction] = useLoading();
    const [loadingSecondaryAction, withLoadingSecondaryAction] = useLoading();

    const handleResume = async (importID: string) => {
        await api(resumeMailImportJob(importID));
        await call();
        createNotification({ text: c('Success').t`Import resumed` });
    };

    const handleReconnect = async () => {
        await createModal(<ImportMailModal addresses={addresses} currentImport={currentImport} />);
    };

    const handleCancel = async (importID: string) => {
        await new Promise<void>((resolve, reject) => {
            createModal(
                <ConfirmModal
                    onConfirm={resolve}
                    onClose={reject}
                    title={c('Confirm modal title').t`Import is incomplete!`}
                    cancel={c('Action').t`Continue import`}
                    confirm={<Button color="danger" type="submit">{c('Action').t`Cancel import`}</Button>}
                >
                    <Alert className="mb1" type="error">
                        {c('Warning')
                            .t`If you cancel this import, you won't be able to resume it. Proton saved all progress in your account. Cancel anyway?`}
                    </Alert>
                </ConfirmModal>
            );
        });
        await api(cancelMailImportJob(importID));
        await call();
        createNotification({ text: c('Success').t`Canceling import` });
    };

    const list = [];

    if (State === ImportStatus.PAUSED) {
        const isAuthError = ErrorCode === ImportError.ERROR_CODE_IMAP_CONNECTION;

        list.push({
            text: isAuthError ? c('Action').t`Reconnect` : c('Action').t`Resume`,
            onClick: () => {
                if (isAuthError) {
                    return withLoadingSecondaryAction(handleReconnect());
                }

                return withLoadingSecondaryAction(handleResume(ID));
            },
            loading: loadingSecondaryAction,
            disabled: loadingAddresses,
        });
    }

    list.push({
        text: c('Action').t`Cancel`,
        onClick: () => withLoadingPrimaryAction(handleCancel(ID)),
        loading: loadingPrimaryAction,
        disabled: State === ImportStatus.CANCELED,
    });

    return <DropdownActions key="actions" size="small" list={list} />;
};

export default ActiveImportRowActions;
