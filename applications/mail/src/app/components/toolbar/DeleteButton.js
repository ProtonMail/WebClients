import React from 'react';
import PropTypes from 'prop-types';
import {
    Icon,
    useLoading,
    useNotifications,
    useEventManager,
    useApi,
    ConfirmModal,
    ErrorButton,
    useModals,
    Alert
} from 'react-components';
import { VIEW_MODE, MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { deleteMessages, emptyLabel } from 'proton-shared/lib/api/messages';
import { deleteConversations } from 'proton-shared/lib/api/conversations';
import { c } from 'ttag';

import ToolbarButton from './ToolbarButton';

const { TRASH, SPAM, DRAFTS, ALL_DRAFTS, ALL_MAIL, INBOX, SENT, ALL_SENT, ARCHIVE } = MAILBOX_LABEL_IDS;

const DeleteButton = ({ labelID = '', mailSettings = {}, selectedIDs = [] }) => {
    const { ViewMode = VIEW_MODE.GROUP } = mailSettings;
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const { call } = useEventManager();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const displayDelete = [TRASH, SPAM, DRAFTS, ALL_DRAFTS, SENT, ALL_SENT].includes(labelID);
    const displayEmpty = ![INBOX, SENT, ALL_SENT, ARCHIVE, ALL_MAIL].includes(labelID);

    const handleDelete = async () => {
        await new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal
                    title={c('Title').t`Delete emails`}
                    confirm={<ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>}
                    onConfirm={resolve}
                    onClose={reject}
                >
                    <Alert type="warning">{c('Info')
                        .t`This action will permanently delete selected emails. Are you sure you want to delete these emails?`}</Alert>
                </ConfirmModal>
            );
        });
        const action = ViewMode === VIEW_MODE.GROUP ? deleteConversations : deleteMessages;
        await api(action(selectedIDs));
        await call();
        createNotification({ text: c('Success').t`Elements deleted` });
    };

    const handleEmpty = async () => {
        await new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal
                    title={c('Title').t`Empty folder`}
                    confirm={<ErrorButton type="submit">{c('Action').t`Empty`}</ErrorButton>}
                    onConfirm={resolve}
                    onClose={reject}
                >
                    <Alert type="warning">{c('Info')
                        .t`This action will permanently delete your emails. Are you sure you want to empty this folder?`}</Alert>
                </ConfirmModal>
            );
        });
        c;
        await api(emptyLabel({ LabelID: labelID }));
        await call();
        createNotification({ text: c('Success').t`Folder cleared` });
    };

    return (
        <>
            {displayDelete ? (
                <ToolbarButton
                    loading={loading}
                    title={c('Action').t`Delete`}
                    onClick={() => withLoading(handleDelete())}
                >
                    <Icon className="toolbar-icon" name="delete" />
                </ToolbarButton>
            ) : null}
            {displayEmpty ? (
                <ToolbarButton
                    loading={loading}
                    title={c('Action').t`Empty folder`}
                    onClick={() => withLoading(handleEmpty())}
                >
                    <Icon className="toolbar-icon" name="empty-folder" />
                </ToolbarButton>
            ) : null}
        </>
    );
};

DeleteButton.propTypes = {
    labelID: PropTypes.string.isRequired,
    mailSettings: PropTypes.object.isRequired,
    selectedIDs: PropTypes.array.isRequired
};

export default DeleteButton;
