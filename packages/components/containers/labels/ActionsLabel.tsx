import { c } from 'ttag';

import { Label } from '@proton/shared/lib/interfaces/Label';

import { DropdownActions, useModalState } from '../../components';
import DeleteLabelModal from './modals/DeleteLabelModal';
import EditLabelModal from './modals/EditLabelModal';

interface Props {
    label: Label;
}

function ActionsLabel({ label }: Props) {
    const [editLabelProps, setEditLabelModalOpen] = useModalState();
    const [deleteLabelProps, setDeleteLabelModalOpen] = useModalState();

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
            <DeleteLabelModal label={label} {...deleteLabelProps} />
        </>
    );
}

export default ActionsLabel;
