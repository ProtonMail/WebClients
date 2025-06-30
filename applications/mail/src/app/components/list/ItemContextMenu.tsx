import type { RefObject } from 'react';
import { useMemo } from 'react';

import { c } from 'ttag';

import { ContextMenu, ContextMenuButton, ContextSeparator, DropdownSizeUnit } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import { useMailSelector } from 'proton-mail/store/hooks';

import { useLabelActions } from '../../hooks/useLabelActions';
import { elementsAreUnread as elementsAreUnreadSelector } from '../../store/elements/elementsSelectors';
import { SOURCE_ACTION } from './list-telemetry/useListTelemetry';

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
    onMarkAs: (status: MARK_AS_STATUS, sourceAction: SOURCE_ACTION) => void;
    onMove: (labelID: string, sourceAction: SOURCE_ACTION) => void;
    onDelete: (sourceAction: SOURCE_ACTION) => void;
    canShowBlockSender: boolean;
    onBlockSender: () => Promise<void>;
    conversationMode: boolean;
}

const ItemContextMenu = ({
    checkedIDs,
    elementID,
    labelID,
    onMove,
    onDelete,
    onMarkAs,
    canShowBlockSender,
    onBlockSender,
    conversationMode,
    ...rest
}: Props) => {
    const elementsAreUnread = useMailSelector(elementsAreUnreadSelector);
    const buttonMarkAsRead = useMemo(() => {
        const allRead = checkedIDs.every((elementID) => !elementsAreUnread[elementID]);
        return !allRead;
    }, [checkedIDs, elementsAreUnread]);

    const [actions] = useLabelActions(labelID);

    const handleMove = (labelID: string, sourceAction: SOURCE_ACTION) => {
        onMove(labelID, sourceAction);
        rest.close();
    };

    const handleDelete = (sourceAction: SOURCE_ACTION) => {
        onDelete(sourceAction);
        rest.close();
    };

    const handleMarkAs = (status: MARK_AS_STATUS, sourceAction: SOURCE_ACTION) => {
        onMarkAs(status, sourceAction);
        rest.close();
    };

    const inbox = (
        <ContextMenuButton
            key="context-menu-inbox"
            testId="context-menu-inbox"
            icon="inbox"
            name={c('Action').t`Move to inbox`}
            action={() => handleMove(MAILBOX_LABEL_IDS.INBOX, SOURCE_ACTION.CONTEXT_MENU)}
        />
    );

    const nospam = (
        <ContextMenuButton
            key="context-menu-nospam"
            testId="context-menu-nospam"
            icon="fire-slash"
            name={c('Action').t`Move to inbox (not spam)`}
            action={() => handleMove(MAILBOX_LABEL_IDS.INBOX, SOURCE_ACTION.CONTEXT_MENU)}
        />
    );

    const archive = (
        <ContextMenuButton
            key="context-menu-archive"
            testId="context-menu-archive"
            icon="archive-box"
            name={c('Action').t`Move to archive`}
            action={() => handleMove(MAILBOX_LABEL_IDS.ARCHIVE, SOURCE_ACTION.CONTEXT_MENU)}
        />
    );

    const trash = (
        <ContextMenuButton
            key="context-menu-trash"
            testId="context-menu-trash"
            icon="trash"
            name={c('Action').t`Move to trash`}
            action={() => handleMove(MAILBOX_LABEL_IDS.TRASH, SOURCE_ACTION.CONTEXT_MENU)}
        />
    );

    const spam = (
        <ContextMenuButton
            key="context-menu-spam"
            testId="context-menu-spam"
            icon="fire"
            name={c('Action').t`Move to spam`}
            action={() => handleMove(MAILBOX_LABEL_IDS.SPAM, SOURCE_ACTION.CONTEXT_MENU)}
        />
    );

    const deleteButton = (
        <ContextMenuButton
            key="context-menu-delete"
            testId="context-menu-delete"
            icon="cross-circle"
            name={c('Action').t`Delete`}
            action={() => handleDelete(SOURCE_ACTION.CONTEXT_MENU)}
        />
    );

    const allMoveButtons = { inbox, trash, archive, spam, nospam, delete: deleteButton };
    const moveButtons = actions.map((action) => allMoveButtons[action]);

    return (
        <>
            <ContextMenu size={{ maxHeight: DropdownSizeUnit.Viewport }} {...rest}>
                {moveButtons}
                {canShowBlockSender && (
                    <ContextMenuButton
                        key="context-menu-block"
                        testId="context-menu-block"
                        icon="circle-slash"
                        name={c('Action').t`Block sender`}
                        action={onBlockSender}
                    />
                )}
                <ContextSeparator />
                {buttonMarkAsRead ? (
                    <ContextMenuButton
                        key="context-menu-read"
                        testId="context-menu-read"
                        icon="envelope-open"
                        name={c('Action').t`Mark as read`}
                        action={() => handleMarkAs(MARK_AS_STATUS.READ, SOURCE_ACTION.CONTEXT_MENU)}
                    />
                ) : (
                    <ContextMenuButton
                        key="context-menu-unread"
                        testId="context-menu-unread"
                        icon="envelope-dot"
                        name={c('Action').t`Mark as unread`}
                        action={() => handleMarkAs(MARK_AS_STATUS.UNREAD, SOURCE_ACTION.CONTEXT_MENU)}
                    />
                )}
            </ContextMenu>
        </>
    );
};

export default ItemContextMenu;
