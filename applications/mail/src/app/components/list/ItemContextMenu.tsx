import { c } from 'ttag';
import { RefObject, useMemo } from 'react';
import { ContextMenu, ContextSeparator, ContextMenuButton } from '@proton/components';
import { useSelector } from 'react-redux';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { MARK_AS_STATUS } from '../../hooks/useMarkAs';
import { elementsAreUnread as elementsAreUnreadSelector } from '../../logic/elements/elementsSelectors';
import { useLabelActions } from '../../hooks/useLabelActions';

interface Props {
    checkedIDs: string[];
    elementID?: string;
    labelID: string;
    anchorRef: RefObject<HTMLElement>;
    isOpen: boolean;
    position?: {
        top: number;
        left: number;
    };
    open: () => void;
    close: () => void;
    onMarkAs: (status: MARK_AS_STATUS) => void;
    onMove: (labelID: string) => void;
    onDelete: () => void;
}

const ItemContextMenu = ({ checkedIDs, elementID, labelID, onMove, onDelete, onMarkAs, ...rest }: Props) => {
    const elementsAreUnread = useSelector(elementsAreUnreadSelector);

    const buttonMarkAsRead = useMemo(() => {
        const allRead = checkedIDs.every((elementID) => !elementsAreUnread[elementID]);
        return !allRead;
    }, [checkedIDs, elementsAreUnread]);

    const [actions] = useLabelActions(labelID, false);

    const handleMove = (labelID: string) => {
        onMove(labelID);
        rest.close();
    };

    const handleDelete = () => {
        onDelete();
        rest.close();
    };

    const handleMarkAs = (status: MARK_AS_STATUS) => {
        onMarkAs(status);
        rest.close();
    };

    const inbox = (
        <ContextMenuButton
            key="context-menu-inbox"
            testId="context-menu-inbox"
            icon="inbox"
            name={c('Action').t`Move to inbox`}
            action={() => handleMove(MAILBOX_LABEL_IDS.INBOX)}
        />
    );

    const nospam = (
        <ContextMenuButton
            key="context-menu-nospam"
            testId="context-menu-nospam"
            icon="fire-slash"
            name={c('Action').t`Move to inbox (not spam)`}
            action={() => handleMove(MAILBOX_LABEL_IDS.INBOX)}
        />
    );

    const archive = (
        <ContextMenuButton
            key="context-menu-archive"
            testId="context-menu-archive"
            icon="archive-box"
            name={c('Action').t`Move to archive`}
            action={() => handleMove(MAILBOX_LABEL_IDS.ARCHIVE)}
        />
    );

    const trash = (
        <ContextMenuButton
            key="context-menu-trash"
            testId="context-menu-trash"
            icon="trash"
            name={c('Action').t`Move to trash`}
            action={() => handleMove(MAILBOX_LABEL_IDS.TRASH)}
        />
    );

    const spam = (
        <ContextMenuButton
            key="context-menu-spam"
            testId="context-menu-spam"
            icon="fire"
            name={c('Action').t`Move to spam`}
            action={() => handleMove(MAILBOX_LABEL_IDS.SPAM)}
        />
    );

    const deleteButton = (
        <ContextMenuButton
            key="context-menu-delete"
            testId="context-menu-delete"
            icon="cross-circle"
            name={c('Action').t`Delete`}
            action={() => handleDelete()}
        />
    );

    // let moveButtons: ReactNode[] = [];

    // if (labelID === MAILBOX_LABEL_IDS.INBOX) {
    //     moveButtons = [trashButton, archiveButton, spamButton];
    // } else if (labelID === MAILBOX_LABEL_IDS.DRAFTS || labelID === MAILBOX_LABEL_IDS.ALL_DRAFTS) {
    //     moveButtons = [trashButton, archiveButton, deleteButton];
    // } else if (labelID === MAILBOX_LABEL_IDS.SENT || labelID === MAILBOX_LABEL_IDS.ALL_SENT) {
    //     moveButtons = [trashButton, archiveButton, deleteButton];
    // } else if (labelID === MAILBOX_LABEL_IDS.SCHEDULED) {
    //     moveButtons = [trashButton, archiveButton];
    // } else if (labelID === MAILBOX_LABEL_IDS.STARRED) {
    //     moveButtons = [trashButton, archiveButton, spamButton];
    // } else if (labelID === MAILBOX_LABEL_IDS.ARCHIVE) {
    //     moveButtons = [trashButton, inboxButton, spamButton];
    // } else if (labelID === MAILBOX_LABEL_IDS.SPAM) {
    //     moveButtons = [trashButton, nospamButton, deleteButton];
    // } else if (labelID === MAILBOX_LABEL_IDS.TRASH) {
    //     moveButtons = [inboxButton, archiveButton, deleteButton];
    // } else if (labelID === MAILBOX_LABEL_IDS.ALL_MAIL) {
    //     moveButtons = [trashButton, archiveButton, spamButton];
    // } else if (isCustomFolder(labelID, folders)) {
    //     moveButtons = [trashButton, archiveButton, spamButton];
    // } else if (isCustomLabel(labelID, labels)) {
    //     moveButtons = [trashButton, archiveButton, spamButton];
    // }

    const allMoveButtons = { inbox, trash, archive, spam, nospam, delete: deleteButton };
    const moveButtons = actions.map((action) => allMoveButtons[action]);

    return (
        <ContextMenu noMaxHeight {...rest}>
            {moveButtons}
            <ContextSeparator />
            {buttonMarkAsRead ? (
                <ContextMenuButton
                    key="context-menu-read"
                    testId="context-menu-read"
                    icon="envelope-open"
                    name={c('Action').t`Mark as read`}
                    action={() => handleMarkAs(MARK_AS_STATUS.READ)}
                />
            ) : (
                <ContextMenuButton
                    key="context-menu-unread"
                    testId="context-menu-unread"
                    icon="envelope-dot"
                    name={c('Action').t`Mark as unread`}
                    action={() => handleMarkAs(MARK_AS_STATUS.UNREAD)}
                />
            )}
        </ContextMenu>
    );
};

export default ItemContextMenu;
