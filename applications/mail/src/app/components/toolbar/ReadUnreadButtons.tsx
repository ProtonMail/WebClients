import { useMemo } from 'react';
import { c } from 'ttag';
import { useSelector } from 'react-redux';
import { Icon, ToolbarButton, useMailSettings } from '@proton/components';
import { Vr } from '@proton/atoms';
import { MARK_AS_STATUS } from '../../hooks/useMarkAs';
import { elementsAreUnread as elementsAreUnreadSelector } from '../../logic/elements/elementsSelectors';

const { READ, UNREAD } = MARK_AS_STATUS;

interface Props {
    selectedIDs: string[];
    onMarkAs: (status: MARK_AS_STATUS) => Promise<void>;
}

const ReadUnreadButtons = ({ selectedIDs, onMarkAs }: Props) => {
    const [{ Shortcuts = 0 } = {}] = useMailSettings();

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
            <kbd className="border-none">R</kbd>
        </>
    ) : (
        c('Action').t`Mark as read`
    );

    const titleUnread = Shortcuts ? (
        <>
            {c('Action').t`Mark as unread`}
            <br />
            <kbd className="border-none">U</kbd>
        </>
    ) : (
        c('Action').t`Mark as unread`
    );

    return (
        <>
            <Vr />
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
