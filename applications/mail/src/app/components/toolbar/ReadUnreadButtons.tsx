import React from 'react';
import { MESSAGE_BUTTONS } from 'proton-shared/lib/constants';
import { Icon, useApi, useEventManager, useLoading } from 'react-components';
import { markMessageAsRead, markMessageAsUnread } from 'proton-shared/lib/api/messages';
import { markConversationsAsRead, markConversationsAsUnread } from 'proton-shared/lib/api/conversations';
import { c } from 'ttag';

import ToolbarButton from './ToolbarButton';
import { getCurrentType } from '../../helpers/elements';
import { ELEMENT_TYPES } from '../../constants';

const UNREAD = 0;
const READ = 1;

interface Props {
    mailSettings: any;
    selectedIDs: string[];
    labelID: string;
}

const ReadUnreadButtons = ({ mailSettings, labelID, selectedIDs = [] }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { MessageButtons = MESSAGE_BUTTONS.READ_UNREAD } = mailSettings;
    const type = getCurrentType({ mailSettings, labelID });
    const [loading, withLoading] = useLoading();

    const markAs = async (status = UNREAD) => {
        const isUnread = status === UNREAD;
        const action =
            type === ELEMENT_TYPES.CONVERSATION
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
            <Icon className="toolbar-icon mauto" name="read" />
        </ToolbarButton>,
        <ToolbarButton
            key="unread"
            title={c('Action').t`Mark as unread`}
            loading={loading}
            disabled={!selectedIDs.length}
            onClick={() => withLoading(markAs(UNREAD))}
        >
            <Icon className="toolbar-icon mauto" name="unread" />
        </ToolbarButton>
    ];

    if (MessageButtons === MESSAGE_BUTTONS.UNREAD_READ) {
        buttons.reverse();
    }

    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20356
    return <>{buttons}</>;
};

export default ReadUnreadButtons;
