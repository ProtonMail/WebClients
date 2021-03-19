import React from 'react';
import { MESSAGE_BUTTONS } from 'proton-shared/lib/constants';
import { Icon, useLoading, useMailSettings, ToolbarButton } from 'react-components';
import { c } from 'ttag';

import { useMarkAs, MARK_AS_STATUS } from '../../hooks/useMarkAs';
import { useGetElementsFromIDs } from '../../hooks/mailbox/useElementsCache';

const { READ, UNREAD } = MARK_AS_STATUS;

interface Props {
    labelID: string;
    mailSettings: any;
    selectedIDs: string[];
    onBack: () => void;
}

const ReadUnreadButtons = ({ labelID, mailSettings, selectedIDs, onBack }: Props) => {
    const { MessageButtons = MESSAGE_BUTTONS.READ_UNREAD } = mailSettings;
    const [loading, withLoading] = useLoading();
    const markAs = useMarkAs();
    const getElementsFromIDs = useGetElementsFromIDs();
    const [{ Shortcuts } = { Shortcuts: 0 }] = useMailSettings();

    const handleMarkAs = async (status: MARK_AS_STATUS) => {
        const isUnread = status === UNREAD;
        const elements = getElementsFromIDs(selectedIDs);
        if (isUnread) {
            onBack();
        }
        await markAs(elements, labelID, status);
    };

    const titleRead = Shortcuts ? (
        <>
            {c('Action').t`Mark as read`}
            <br />
            <kbd className="bg-global-altgrey no-border">R</kbd>
        </>
    ) : (
        c('Action').t`Mark as read`
    );

    const titleUnread = Shortcuts ? (
        <>
            {c('Action').t`Mark as unread`}
            <br />
            <kbd className="bg-global-altgrey no-border">U</kbd>
        </>
    ) : (
        c('Action').t`Mark as unread`
    );

    const buttons = [
        <ToolbarButton
            key="read"
            title={titleRead}
            disabled={loading || !selectedIDs.length}
            onClick={() => withLoading(handleMarkAs(READ))}
            className="no-tablet no-mobile"
            data-test-id="toolbar:read"
            icon={<Icon name="read" alt={c('Action').t`Mark as read`} />}
        />,
        <ToolbarButton
            key="unread"
            title={titleUnread}
            disabled={loading || !selectedIDs.length}
            onClick={() => withLoading(handleMarkAs(UNREAD))}
            data-test-id="toolbar:unread"
            icon={<Icon name="unread" alt={c('Action').t`Mark as unread`} />}
        />,
    ];

    if (MessageButtons === MESSAGE_BUTTONS.UNREAD_READ) {
        buttons.reverse();
    }

    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20356
    return <>{buttons}</>;
};

export default ReadUnreadButtons;
