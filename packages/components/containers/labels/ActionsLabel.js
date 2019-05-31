import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Alert,
    DropdownActions,
    ConfirmModal,
    useApi,
    useModals,
    useEventManager,
    useNotifications
} from 'react-components';
import { LABEL_EXCLUSIVE } from 'proton-shared/lib/constants';
import { deleteLabel } from 'proton-shared/lib/api/labels';

import EditLabelModal from './modals/Edit';

function ActionsLabel({ label, onChange }) {
    const api = useApi();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();

    const I18N = {
        [LABEL_EXCLUSIVE.LABEL]: {
            title: c('Title').t`Delete label`,
            content: c('Info')
                .t`Are you sure you want to delete this label? Removing a label will not remove the messages with that label.`
        },
        [LABEL_EXCLUSIVE.FOLDER]: {
            title: c('Title').t`Delete folder`,
            content: c('Info')
                .t`Are you sure you want to delete this folder? Messages in the folders aren’t deleted if the folder is deleted, they can still be found in all mail. If you want to delete all messages in a folder, move them to trash.`
        }
    };

    const confirmDelete = async ({ Exclusive }) => {
        return new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal onConfirm={resolve} onClose={reject} title={I18N[Exclusive].title}>
                    <Alert>{I18N[Exclusive].content}</Alert>
                </ConfirmModal>
            );
        });
    };

    const handleRemove = async () => {
        await confirmDelete(label);
        await api(deleteLabel(label.ID));
        await call();
        createNotification({
            text: c('Success notification').t`${label.Name} removed`
        });
        onChange('remove', label);
    };

    const handleEdit = () => {
        createModal(<EditLabelModal label={label} mode="edition" onEdit={(label) => onChange('update', label)} />);
    };

    const list = [
        {
            text: c('Action').t`Edit`,
            onClick: handleEdit
        },
        {
            text: c('Action').t`Delete`,
            onClick: handleRemove
        }
    ];

    return <DropdownActions className="pm-button--small" list={list} />;
}

ActionsLabel.propTypes = {
    label: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
};

export default ActionsLabel;
