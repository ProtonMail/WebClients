import React from 'react';
import { MESSAGE_BUTTONS } from 'proton-shared/lib/constants';
import { Icon, useLoading, useMailSettings } from 'react-components';
import { c } from 'ttag';

import ToolbarButton from './ToolbarButton';
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
    const [{ Hotkeys } = { Hotkeys: 0 }] = useMailSettings();

    const handleMarkAs = async (status: MARK_AS_STATUS) => {
        const isUnread = status === UNREAD;
        const elements = getElementsFromIDs(selectedIDs);
        if (isUnread) {
            onBack();
        }
        await markAs(elements, labelID, status);
    };

    const titleRead = Hotkeys ? (
        <>
            {c('Action').t`Mark as read`}
            <br />
            <kbd className="bg-global-altgrey noborder">R</kbd>
        </>
    ) : (
        c('Action').t`Mark as read`
    );

    const titleUnread = Hotkeys ? (
        <>
            {c('Action').t`Mark as unread`}
            <br />
            <kbd className="bg-global-altgrey noborder">U</kbd>
        </>
    ) : (
        c('Action').t`Mark as unread`
    );

    const buttons = [
        <ToolbarButton
            key="read"
            title={titleRead}
            loading={loading}
            disabled={!selectedIDs.length}
            onClick={() => withLoading(handleMarkAs(READ))}
            className="notablet nomobile"
            data-test-id="toolbar:read"
        >
            <Icon className="toolbar-icon mauto" name="read" />
            <span className="sr-only">{c('Action').t`Mark as read`}</span>
        </ToolbarButton>,
        <ToolbarButton
            key="unread"
            title={titleUnread}
            loading={loading}
            disabled={!selectedIDs.length}
            onClick={() => withLoading(handleMarkAs(UNREAD))}
            data-test-id="toolbar:unread"
        >
            <Icon className="toolbar-icon mauto" name="unread" />
            <span className="sr-only">{c('Action').t`Mark as unread`}</span>
        </ToolbarButton>,
    ];

    if (MessageButtons === MESSAGE_BUTTONS.UNREAD_READ) {
        buttons.reverse();
    }

    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20356
    return <>{buttons}</>;
};

export default ReadUnreadButtons;
