import { c } from 'ttag';

import { useEasySwitchDispatch } from '@proton/activation/logic/store';
import { deleteSyncItem } from '@proton/activation/logic/sync/sync.actions';
import { Button } from '@proton/atoms/Button';
import { Alert, AlertModal, DropdownActions, useModalState } from '@proton/components/components';
import { useLoading } from '@proton/components/hooks';

interface Props {
    syncId: string;
}

const SyncRowActions = ({ syncId }: Props) => {
    const dispatch = useEasySwitchDispatch();

    const [deleteModalProps, showDeleteModal, renderDeleteModal] = useModalState();

    const [loadingDeleteRecord, withLoadingDeleteRecord] = useLoading();

    const list = [
        {
            text: c('loc_nightly:account').t`Delete sync`,
            onClick: () => showDeleteModal(true),
            loading: loadingDeleteRecord,
        },
    ];

    const handleDeleteSync = () => {
        void withLoadingDeleteRecord(dispatch(deleteSyncItem({ syncId })));
        showDeleteModal(false);
    };

    return (
        <>
            <DropdownActions size="small" list={list} />

            {renderDeleteModal && (
                <AlertModal
                    title="Remove the sync"
                    buttons={[
                        <Button color="danger" onClick={handleDeleteSync}>
                            {c('Action').t`Remove`}
                        </Button>,
                        <Button color="weak" onClick={() => showDeleteModal(false)}>
                            {c('Action').t`Keep`}
                        </Button>,
                    ]}
                    {...deleteModalProps}
                >
                    <Alert className="mb1" type="error">
                        {c('loc_nightly:account').t`You will stop the syncing process.`}
                    </Alert>
                </AlertModal>
            )}
        </>
    );
};

export default SyncRowActions;
