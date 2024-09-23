import { c } from 'ttag';

import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import type { Label } from '@proton/shared/lib/interfaces/Label';

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
            'data-testid': 'folders/labels:item-edit',
        },
        {
            text: c('Action').t`Delete`,
            actionType: 'delete' as const,
            onClick: () => setDeleteLabelModalOpen(true),
            'data-testid': 'folders/labels:item-delete',
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
