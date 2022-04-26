import { c } from 'ttag';
import { RefObject } from 'react';
import { MESSAGE_BUTTONS } from '@proton/shared/lib/constants';
import { ContextMenu, ContextSeparator, ContextMenuButton } from '@proton/components';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { MARK_AS_STATUS, useMarkAs } from '../../hooks/useMarkAs';
import { useGetElementsFromIDs } from '../../hooks/mailbox/useElements';

interface Props {
    mailSettings: MailSettings;
    checkedIDs: string[];
    labelID: string;
    anchorRef: RefObject<HTMLElement>;
    isOpen: boolean;
    onBack: () => void;
    position?: {
        top: number;
        left: number;
    };
    open: () => void;
    close: () => void;
}

const ItemContextMenu = ({ checkedIDs, labelID, mailSettings, onBack, ...rest }: Props) => {
    const { MessageButtons = MESSAGE_BUTTONS.READ_UNREAD } = mailSettings;
    const markAs = useMarkAs();
    const getElementsFromIDs = useGetElementsFromIDs();

    const handleMarkAs = async (status: MARK_AS_STATUS) => {
        const isUnread = status === MARK_AS_STATUS.UNREAD;
        const elements = getElementsFromIDs(checkedIDs);
        if (isUnread) {
            onBack();
        }
        await markAs(elements, labelID, status);
    };

    const readButtons = [
        <ContextMenuButton
            testId="context-menu-read"
            icon="eye"
            name={c('Action').t`Mark as read`}
            action={() => handleMarkAs(MARK_AS_STATUS.READ)}
        />,
        <ContextMenuButton
            testId="context-menu-unread"
            icon="eye-slash"
            name={c('Action').t`Mark as unread`}
            action={() => handleMarkAs(MARK_AS_STATUS.UNREAD)}
        />,
    ];

    if (MessageButtons === MESSAGE_BUTTONS.UNREAD_READ) {
        readButtons.reverse();
    }

    return (
        <ContextMenu noMaxHeight autoClose {...rest}>
            <ContextMenuButton
                testId="context-menu-inbox"
                icon="inbox"
                name={c('Action').t`Move to inbox`}
                action={() => console.log('Inbox')}
            />
            <ContextMenuButton
                testId="context-menu-archive"
                icon="archive-box"
                name={c('Action').t`Move to archive`}
                action={() => console.log('Archive')}
            />
            <ContextMenuButton
                testId="context-menu-trash"
                icon="trash"
                name={c('Action').t`Move to trash`}
                action={() => console.log('Trash')}
            />
            <ContextMenuButton
                testId="context-menu-spam"
                icon="fire"
                name={c('Action').t`Move to spam`}
                action={() => console.log('Spam')}
            />
            <ContextSeparator />
            {readButtons}
        </ContextMenu>
    );
};

export default ItemContextMenu;
