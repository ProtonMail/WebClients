import { c } from 'ttag';

import { deleteLabel } from '@proton/shared/lib/api/labels';
import { Label } from '@proton/shared/lib/interfaces/Label';

import { DropdownActions, useModalState } from '../../components';
import { useApi, useEventManager, useNotifications } from '../../hooks';
import EditLabelModal from './modals/EditLabelModal';
import DeleteLabelModal from './modals/DeleteLabelModal';

interface Props {
    label: Label;
}

function ActionsLabel({ label }: Props) {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const [editLabelProps, setEditLabelModalOpen] = useModalState();
    const [deleteLabelProps, setDeleteLabelModalOpen] = useModalState();

    const handleRemove = async () => {
        await api(deleteLabel(label.ID));
        await call();
        createNotification({
            text: c('Success notification').t`${label.Name} removed`,
        });
    };

    const list = [
        {
            text: c('Action').t`Edit`,
            onClick: () => setEditLabelModalOpen(true),
            'data-test-id': 'folders/labels:item-edit',
        },
        {
            text: c('Action').t`Delete`,
            actionType: 'delete' as const,
            onClick: () => setDeleteLabelModalOpen(true),
            'data-test-id': 'folders/labels:item-delete',
        },
    ];

    return (
        <>
            <DropdownActions size="small" list={list} />
            <EditLabelModal {...editLabelProps} label={label} mode="edition" />
            <DeleteLabelModal label={label} onRemove={handleRemove} {...deleteLabelProps} />
        </>
    );
}

export default ActionsLabel;
