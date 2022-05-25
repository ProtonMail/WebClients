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

    // const title = buttonMarkAsRead ? titleRead : titleUnread;
    // const action = buttonMarkAsRead ? READ : UNREAD;
    // const testID = buttonMarkAsRead ? 'toolbar:read' : 'toolbar:unread';
    // const icon =
    // const alt = buttonMarkAsRead ? altRead : altUnread;

    // const buttons = [
    //     <ToolbarButton
    //         key="read"
    //         title={titleRead}
    //         disabled={loading || !selectedIDs.length}
    //         onClick={() => withLoading(onMarkAs(READ))}
    //         className="no-tablet no-mobile"
    //         data-testid="toolbar:read"
    //         icon={<Icon name="eye" alt={c('Action').t`Mark as read`} />}
    //     />,
    //     <ToolbarButton
    //         key="unread"
    //         title={titleUnread}
    //         disabled={loading || !selectedIDs.length}
    //         onClick={() => withLoading(onMarkAs(UNREAD))}
    //         data-testid="toolbar:unread"
    //         icon={<Icon name="eye-slash" alt={c('Action').t`Mark as unread`} />}
    //     />,
    // ];

    // if (MessageButtons === MESSAGE_BUTTONS.UNREAD_READ) {
    //     buttons.reverse();
    // }

    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20356
    return (
        <>
            <Vr />
            {buttonMarkAsRead ? (
                <ToolbarButton
                    key="read"
                    title={titleRead}
                    disabled={!selectedIDs.length}
                    onClick={() => onMarkAs(READ)}
                    className="no-tablet no-mobile"
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
