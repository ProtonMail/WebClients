import React from 'react';
import { c } from 'ttag';
import { Alert, ConfirmModal, Button } from '../../../components';

const DeleteLinkConfirmationModal = ({ ...props }) => (
    <ConfirmModal
        confirm={<Button color="danger" type="submit">{c('Action').t`Delete link`}</Button>}
        title={c('Info').t`Delete link?`}
        {...props}
    >
        <Alert type="error">{c('Info')
            .t`Anyone with this link won't be able to sync or get future updates for your calendar. If you want to give them access again, you will have to create a new link.`}</Alert>
    </ConfirmModal>
);

export default DeleteLinkConfirmationModal;
