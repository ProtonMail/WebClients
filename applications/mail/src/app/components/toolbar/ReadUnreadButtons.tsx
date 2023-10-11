import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Kbd } from '@proton/atoms';
import { Icon, ToolbarButton } from '@proton/components';

import useMailModel from 'proton-mail/hooks/useMailModel';

import { MARK_AS_STATUS } from '../../hooks/actions/useMarkAs';
import { elementsAreUnread as elementsAreUnreadSelector } from '../../logic/elements/elementsSelectors';

const { READ, UNREAD } = MARK_AS_STATUS;

interface Props {
    selectedIDs: string[];
    onMarkAs: (status: MARK_AS_STATUS) => Promise<void>;
}

const ReadUnreadButtons = ({ selectedIDs, onMarkAs }: Props) => {
    const { Shortcuts } = useMailModel('MailSettings');

    const elementsAreUnread = useSelector(elementsAreUnreadSelector);

    const buttonMarkAsRead = useMemo(() => {
        const allRead = selectedIDs.every((elementID) => !elementsAreUnread[elementID]);
        return !allRead;
    }, [selectedIDs, elementsAreUnread]);

    if (!selectedIDs.length) {
        return null;
    }

    const titleRead = Shortcuts ? (
        <>
            {c('Action').t`Mark as read`}
            <br />
            <Kbd shortcut="R" />
        </>
    ) : (
        c('Action').t`Mark as read`
    );

    const titleUnread = Shortcuts ? (
        <>
            {c('Action').t`Mark as unread`}
            <br />
            <Kbd shortcut="U" />
        </>
    ) : (
        c('Action').t`Mark as unread`
    );

    return (
        <>
            {buttonMarkAsRead ? (
                <ToolbarButton
                    key="read"
                    title={titleRead}
                    disabled={!selectedIDs.length}
                    onClick={() => onMarkAs(READ)}
                    data-testid="toolbar:read"
                    icon={<Icon name="envelope-open" alt={c('Action').t`Mark as read`} />}
                />
            ) : (
                <ToolbarButton
                    key="unread"
                    title={titleUnread}
                    disabled={!selectedIDs.length}
                    onClick={() => onMarkAs(UNREAD)}
                    data-testid="toolbar:unread"
                    icon={<Icon name="envelope-dot" alt={c('Action').t`Mark as unread`} />}
                />
            )}
        </>
    );
};

export default ReadUnreadButtons;
