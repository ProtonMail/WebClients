import React from 'react';
import PropTypes from 'prop-types';
import { MESSAGE_BUTTONS, VIEW_MODE } from 'proton-shared/lib/constants';
import { Icon, useApi, useEventManager, useLoading } from 'react-components';
import { markMessageAsRead, markMessageAsUnread } from 'proton-shared/lib/api/messages';
import { markConversationsAsRead, markConversationsAsUnread } from 'proton-shared/lib/api/conversations';
import { c } from 'ttag';

import ToolbarButton from './ToolbarButton';

const UNREAD = 0;
const READ = 1;

const ReadUnreadButtons = ({ mailSettings, selectedIDs = [] }) => {
    const api = useApi();
    const { call } = useEventManager();
    const { MessageButtons = MESSAGE_BUTTONS.READ_UNREAD, ViewMode = VIEW_MODE.GROUP } = mailSettings;
    const isGroup = ViewMode === VIEW_MODE.GROUP;
    const [loading, withLoading] = useLoading();

    const markAs = async (status = UNREAD) => {
        const isUnread = status === UNREAD;
        const action = isGroup
            ? isUnread
                ? markConversationsAsUnread
                : markConversationsAsRead
            : isUnread
            ? markMessageAsUnread
            : markMessageAsRead;
        await api(action(selectedIDs));
        await call();
    };

    const buttons = [
        <ToolbarButton
            key="read"
            title={c('Action').t`Mark as read`}
            loading={loading}
            disabled={!selectedIDs.length}
            onClick={() => withLoading(markAs(READ))}
        >
            <Icon className="toolbar-icon" name="read" />
        </ToolbarButton>,
        <ToolbarButton
            key="unread"
            title={c('Action').t`Mark as unread`}
            loading={loading}
            disabled={!selectedIDs.length}
            onClick={() => withLoading(markAs(UNREAD))}
        >
            <Icon className="toolbar-icon" name="unread" />
        </ToolbarButton>
    ];

    if (MessageButtons === MESSAGE_BUTTONS.UNREAD_READ) {
        buttons.reverse();
    }

    return buttons;
};

ReadUnreadButtons.propTypes = {
    mailSettings: PropTypes.object.isRequired,
    selectedIDs: PropTypes.array.isRequired
};

export default ReadUnreadButtons;
