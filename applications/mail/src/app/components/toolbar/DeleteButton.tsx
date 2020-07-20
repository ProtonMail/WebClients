import React from 'react';
import { Location } from 'history';
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
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { deleteMessages } from 'proton-shared/lib/api/messages';
import { deleteConversations } from 'proton-shared/lib/api/conversations';
import { c, msgid } from 'ttag';

import ToolbarButton from './ToolbarButton';
import { getCurrentType } from '../../helpers/elements';
import { ELEMENT_TYPES } from '../../constants';
import { MailSettings } from 'proton-shared/lib/interfaces';
import { Breakpoints } from '../../models/utils';
import { labelIncludes } from '../../helpers/labels';

const { TRASH, SPAM, DRAFTS, ALL_DRAFTS, SENT, ALL_SENT } = MAILBOX_LABEL_IDS;

interface Props {
    labelID: string;
    mailSettings: MailSettings;
    breakpoints: Breakpoints;
    selectedIDs: string[];
    location: Location;
}

const DeleteButton = ({ labelID = '', mailSettings, breakpoints, selectedIDs = [], location }: Props) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const { call } = useEventManager();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const type = getCurrentType({ mailSettings, labelID, location });

    const displayDelete =
        labelIncludes(labelID, TRASH, SPAM, DRAFTS, ALL_DRAFTS, SENT, ALL_SENT) &&
        (!breakpoints.isNarrow || !labelIncludes(labelID, SENT, ALL_SENT));

    const handleDelete = async () => {
        const count = selectedIDs.length;
        await new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal
                    title={c('Title').ngettext(msgid`Delete email`, `Delete emails`, count)}
                    confirm={(<ErrorButton type="submit" icon={null}>{c('Action').t`Delete`}</ErrorButton>) as any}
                    onConfirm={resolve}
                    onClose={reject}
                >
                    <Alert type="error">
                        {c('Info').ngettext(
                            msgid`This action will permanently delete the selected email. Are you sure you want to delete this email?`,
                            `This action will permanently delete the selected emails. Are you sure you want to delete these emails?`,
                            count
                        )}
                    </Alert>
                </ConfirmModal>
            );
        });
        const isConversation = type === ELEMENT_TYPES.CONVERSATION;
        const action = isConversation ? deleteConversations(selectedIDs, labelID) : deleteMessages(selectedIDs);
        await api(action);
        await call();
        const text = isConversation
            ? c('Success').ngettext(msgid`conversation removed`, `${count} conversations removed`, count)
            : c('Success').ngettext(msgid`message removed`, `${count} messages removed`, count);
        createNotification({ text });
    };

    if (!displayDelete) {
        return null;
    }

    return (
        <ToolbarButton
            loading={loading}
            title={c('Action').t`Delete permanently`}
            onClick={() => withLoading(handleDelete())}
            disabled={!selectedIDs.length}
            data-cy="deletepermanently"
        >
            <Icon className="toolbar-icon mauto" name="delete" />
        </ToolbarButton>
    );
};

export default DeleteButton;
