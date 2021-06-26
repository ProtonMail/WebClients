import React from 'react';
import { c } from 'ttag';

import { deleteMailImportReport, deleteSource } from '@proton/shared/lib/api/mailImport';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';

import { ConfirmModal, Button, Alert, DropdownActions } from '../../../../components';
import { useApi, useLoading, useNotifications, useEventManager, useModals } from '../../../../hooks';

import DeleteAllMessagesModal from '../modals/DeleteAllMessagesModal';

interface Props {
    ID: string;
    email: string;
    showDeleteSource: number;
}

const PastImportRowActions = ({ ID, email, showDeleteSource }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createModal } = useModals();

    const { createNotification } = useNotifications();

    const [loadingDeleteRecord, withLoadingDeleteRecord] = useLoading();
    const [loadingDeleteOriginal, withLoadingDeleteOriginal] = useLoading();

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
                    <Alert type="error">
                        {c('Warning').t`You will not see this import record in the list anymore.`}
                    </Alert>
                </ConfirmModal>
            );
        });
        await withLoadingDeleteRecord(api(deleteMailImportReport(ID)));
        await call();
        createNotification({ text: c('Success').t`Import record deleted` });
    };

    const handleDeleteOriginal = async () => {
        await new Promise<void>((resolve, reject) => {
            createModal(
                <DeleteAllMessagesModal
                    onConfirm={resolve}
                    onClose={reject}
                    title={c('Confirm modal title').t`Delete all messages`}
                    cancel={c('Action').t`Cancel`}
                    email={email}
                />
            );
        });

        await withLoadingDeleteOriginal(api(deleteSource(ID)));
        await call();

        createNotification({ text: c('Success').t`Deleting original messages` });
    };

    const list = [
        {
            text: c('Action').t`Delete record`,
            onClick: handleDeleteRecord,
            loading: loadingDeleteRecord,
        },
        showDeleteSource &&
            ({
                text: c('Action').t`Delete original messages`,
                onClick: handleDeleteOriginal,
                loading: loadingDeleteOriginal,
                actionType: 'delete',
            } as const),
    ].filter(isTruthy);

    return <DropdownActions className="button--small" list={list} />;
};

export default PastImportRowActions;
