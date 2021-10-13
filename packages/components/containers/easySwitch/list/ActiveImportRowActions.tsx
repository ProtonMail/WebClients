import { c } from 'ttag';
import { cancelImport, resumeImport } from '@proton/shared/lib/api/easySwitch';

import { NormalizedImporter, ImportStatus } from '@proton/shared/lib/interfaces/EasySwitch';

import { Alert, ConfirmModal, DropdownActions, Button } from '../../../components';
import { useApi, useLoading, useEventManager, useModals, useNotifications } from '../../../hooks';

interface Props {
    activeImport: NormalizedImporter;
}

const ActiveImportRowActions = ({ activeImport }: Props) => {
    const { ID, Active, Product } = activeImport;
    const { State } = Active || {};

    const api = useApi();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [loadingPrimaryAction, withLoadingPrimaryAction] = useLoading();
    const [loadingSecondaryAction, withLoadingSecondaryAction] = useLoading();

    const handleResume = async (ImporterID: string) => {
        await api(
            resumeImport({
                ImporterID,
                Products: [Product],
            })
        );
        await call();
        createNotification({ text: c('Success').t`Resuming import` });
    };

    const handleCancel = async (ImporterID: string) => {
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
        await api(
            cancelImport({
                ImporterID,
                Products: [Product],
            })
        );
        await call();
        createNotification({ text: c('Success').t`Canceling import` });
    };

    const list = [];

    if (State === ImportStatus.PAUSED) {
        list.push({
            text: c('Action').t`Resume`,
            onClick: () => {
                return withLoadingSecondaryAction(handleResume(ID));
            },
            loading: loadingSecondaryAction,
        });
    }

    list.push({
        text: c('Action').t`Cancel`,
        onClick: () => withLoadingPrimaryAction(handleCancel(ID)),
        loading: loadingPrimaryAction,
        disabled: State === ImportStatus.CANCELED,
    });

    return <DropdownActions size="small" list={list} />;
};

export default ActiveImportRowActions;
