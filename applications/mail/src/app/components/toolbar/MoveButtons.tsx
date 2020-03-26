import React from 'react';
import { Location } from 'history';
import { Icon, useLoading, useNotifications, useEventManager, useApi } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { labelMessages } from 'proton-shared/lib/api/messages';
import { labelConversations } from 'proton-shared/lib/api/conversations';
import { c, msgid } from 'ttag';

import ToolbarButton from './ToolbarButton';
import { getCurrentType } from '../../helpers/elements';
import { ELEMENT_TYPES } from '../../constants';

const { TRASH, SPAM, DRAFTS, ARCHIVE, SENT, INBOX, ALL_DRAFTS, ALL_SENT } = MAILBOX_LABEL_IDS;

interface Props {
    labelID: string;
    mailSettings: any;
    selectedIDs: string[];
    location: Location;
}

const MoveButtons = ({ labelID = '', mailSettings = {}, selectedIDs = [], location }: Props) => {
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const type = getCurrentType({ mailSettings, labelID, location });
    const isTypeMessage = type === ELEMENT_TYPES.MESSAGE;

    const handleMove = async (LabelID: string) => {
        const action = isTypeMessage ? labelMessages : labelConversations;
        await api(action({ LabelID, IDs: selectedIDs }));
        await call();
        createNotification({
            text: isTypeMessage
                ? c('Success').ngettext(msgid`Message moved`, `Messages moved`, selectedIDs.length)
                : c('Success').ngettext(msgid`Conversation moved`, `Conversations moved`, selectedIDs.length)
        });
    };

    const displayTrash = ![DRAFTS, ALL_DRAFTS, TRASH].includes(labelID as MAILBOX_LABEL_IDS);
    const displayInbox = ![SENT, ALL_SENT, DRAFTS, ALL_DRAFTS].includes(labelID as MAILBOX_LABEL_IDS);
    const displayArchive = ![DRAFTS, ALL_DRAFTS, ARCHIVE].includes(labelID as MAILBOX_LABEL_IDS);
    const displaySpam = ![SENT, ALL_SENT, SPAM].includes(labelID as MAILBOX_LABEL_IDS);

    return (
        <>
            {displayTrash ? (
                <ToolbarButton
                    loading={loading}
                    title={c('Action').t`Move to trash`}
                    onClick={() => withLoading(handleMove(TRASH))}
                >
                    <Icon className="toolbar-icon mauto" name="trash" />
                </ToolbarButton>
            ) : null}
            {displayInbox ? (
                <ToolbarButton
                    loading={loading}
                    title={c('Action').t`Move to inbox`}
                    onClick={() => withLoading(handleMove(INBOX))}
                >
                    <Icon className="toolbar-icon mauto" name="inbox" />
                </ToolbarButton>
            ) : null}
            {displayArchive ? (
                <ToolbarButton
                    loading={loading}
                    title={c('Action').t`Move to archive`}
                    onClick={() => withLoading(handleMove(ARCHIVE))}
                >
                    <Icon className="toolbar-icon mauto" name="archive" />
                </ToolbarButton>
            ) : null}
            {displaySpam ? (
                <ToolbarButton
                    loading={loading}
                    title={c('Action').t`Move to spam`}
                    onClick={() => withLoading(handleMove(SPAM))}
                >
                    <Icon className="toolbar-icon mauto" name="spam" />
                </ToolbarButton>
            ) : null}
        </>
    );
};

export default MoveButtons;
