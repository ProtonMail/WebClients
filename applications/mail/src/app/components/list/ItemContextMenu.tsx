import { c } from 'ttag';
import { RefObject, ReactNode } from 'react';
import { MESSAGE_BUTTONS, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import {
    ContextMenu,
    ContextSeparator,
    ContextMenuButton,
    useMailSettings,
    useLabels,
    useFolders,
} from '@proton/components';
import { MARK_AS_STATUS } from '../../hooks/useMarkAs';
import { isCustomFolder, isCustomLabel } from '../../helpers/labels';

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
    const [mailSettings] = useMailSettings();
    const [labels] = useLabels();
    const [folders] = useFolders();

    const { MessageButtons = MESSAGE_BUTTONS.READ_UNREAD } = mailSettings || {};

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

    const inboxButton = (
        <ContextMenuButton
            key="context-menu-inbox"
            testId="context-menu-inbox"
            icon="inbox"
            name={c('Action').t`Move to inbox`}
            action={() => handleMove(MAILBOX_LABEL_IDS.INBOX)}
        />
    );

    const nospamButton = (
        <ContextMenuButton
            key="context-menu-nospam"
            testId="context-menu-nospam"
            icon="fire-slash"
            name={c('Action').t`Move to inbox (not spam)`}
            action={() => handleMove(MAILBOX_LABEL_IDS.INBOX)}
        />
    );

    const archiveButton = (
        <ContextMenuButton
            key="context-menu-archive"
            testId="context-menu-archive"
            icon="archive-box"
            name={c('Action').t`Move to archive`}
            action={() => handleMove(MAILBOX_LABEL_IDS.ARCHIVE)}
        />
    );

    const trashButton = (
        <ContextMenuButton
            key="context-menu-trash"
            testId="context-menu-trash"
            icon="trash"
            name={c('Action').t`Move to trash`}
            action={() => handleMove(MAILBOX_LABEL_IDS.TRASH)}
        />
    );

    const spamButton = (
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

    let moveButtons: ReactNode[] = [];

    if (labelID === MAILBOX_LABEL_IDS.INBOX) {
        moveButtons = [trashButton, archiveButton, spamButton];
    } else if (labelID === MAILBOX_LABEL_IDS.DRAFTS || labelID === MAILBOX_LABEL_IDS.ALL_DRAFTS) {
        moveButtons = [trashButton, archiveButton, deleteButton];
    } else if (labelID === MAILBOX_LABEL_IDS.SENT || labelID === MAILBOX_LABEL_IDS.ALL_SENT) {
        moveButtons = [trashButton, archiveButton, deleteButton];
    } else if (labelID === MAILBOX_LABEL_IDS.SCHEDULED) {
        moveButtons = [trashButton, archiveButton];
    } else if (labelID === MAILBOX_LABEL_IDS.STARRED) {
        moveButtons = [trashButton, archiveButton, spamButton];
    } else if (labelID === MAILBOX_LABEL_IDS.ARCHIVE) {
        moveButtons = [trashButton, inboxButton, spamButton];
    } else if (labelID === MAILBOX_LABEL_IDS.SPAM) {
        moveButtons = [trashButton, nospamButton, deleteButton];
    } else if (labelID === MAILBOX_LABEL_IDS.TRASH) {
        moveButtons = [inboxButton, archiveButton, deleteButton];
    } else if (labelID === MAILBOX_LABEL_IDS.ALL_MAIL) {
        moveButtons = [trashButton, archiveButton, spamButton];
    } else if (isCustomFolder(labelID, folders)) {
        moveButtons = [trashButton, archiveButton, spamButton];
    } else if (isCustomLabel(labelID, labels)) {
        moveButtons = [trashButton, archiveButton, spamButton];
    }

    const readButtons = [
        <ContextMenuButton
            key="context-menu-read"
            testId="context-menu-read"
            icon="eye"
            name={c('Action').t`Mark as read`}
            action={() => handleMarkAs(MARK_AS_STATUS.READ)}
        />,
        <ContextMenuButton
            key="context-menu-unread"
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
        <ContextMenu noMaxHeight {...rest}>
            {moveButtons}
            <ContextSeparator />
            {readButtons}
        </ContextMenu>
    );
};

export default ItemContextMenu;
