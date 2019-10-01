import React from 'react';
import PropTypes from 'prop-types';
import {
    Icon,
    useLoading,
    useNotifications,
    useEventManager,
    useApi,
    ConfirmModal,
    useModals,
    Alert
} from 'react-components';
import { VIEW_MODE, MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { deleteMessages } from 'proton-shared/lib/api/messages';
import { deleteConversations } from 'proton-shared/lib/api/conversations';
import { c } from 'ttag';

import ToolbarButton from './ToolbarButton';

const { TRASH, SPAM, DRAFTS, ALL_DRAFTS, ALL_MAIL } = MAILBOX_LABEL_IDS;

const DeleteButton = ({ labelID = '', mailSettings = {}, selectedIDs = [] }) => {
    const { ViewMode = VIEW_MODE.GROUP } = mailSettings;
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const { call } = useEventManager();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const displayDelete = [TRASH, SPAM, DRAFTS, ALL_DRAFTS, ALL_MAIL].includes(labelID);

    if (!displayDelete) {
        return null;
    }

    const handleDelete = async () => {
        await new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal title={c('Title').t`Delete`} onConfirm={resolve} onClose={reject}>
                    <Alert>{c('Info').t`Are you sure? This cannot be undone.`}</Alert>
                </ConfirmModal>
            );
        });
        const action = ViewMode === VIEW_MODE.GROUP ? deleteConversations : deleteMessages;
        await api(action(selectedIDs));
        await call();
        createNotification({ text: c('Success').t`Elements deleted` });
    };

    return (
        <ToolbarButton loading={loading} title={c('Action').t`Delete`} onClick={() => withLoading(handleDelete())}>
            <Icon className="toolbar-icon" name="delete" />
        </ToolbarButton>
    );
};

DeleteButton.propTypes = {
    labelID: PropTypes.string.isRequired,
    mailSettings: PropTypes.object.isRequired,
    selectedIDs: PropTypes.array.isRequired
};

export default DeleteButton;
