import type { RefObject } from 'react';
import { useMemo } from 'react';

import { c } from 'ttag';

import ContextMenu from '@proton/components/components/contextMenu/ContextMenu';
import ContextMenuButton from '@proton/components/components/contextMenu/ContextMenuButton';
import ContextSeparator from '@proton/components/components/contextMenu/ContextSeparator';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import { IcArchiveBox } from '@proton/icons/icons/IcArchiveBox';
import { IcCircleSlash } from '@proton/icons/icons/IcCircleSlash';
import { IcCrossCircle } from '@proton/icons/icons/IcCrossCircle';
import { IcEnvelopeDot } from '@proton/icons/icons/IcEnvelopeDot';
import { IcEnvelopeOpen } from '@proton/icons/icons/IcEnvelopeOpen';
import { IcFire } from '@proton/icons/icons/IcFire';
import { IcFireSlash } from '@proton/icons/icons/IcFireSlash';
import { IcInbox } from '@proton/icons/icons/IcInbox';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import { useLabelActions } from '../../hooks/useLabelActions';
import { elementsAreUnread as elementsAreUnreadSelector } from '../../store/elements/elementsSelectors';
import { useMailSelector } from '../../store/hooks';
import { CategoryContextMenu } from '../categoryView/categoriesContext/CategoryContextMenu';
import { SOURCE_ACTION } from './list-telemetry/useListTelemetry';

interface Props {
    checkedIDs: string[];
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
    onMove: (labelID: string) => void;
    onDelete: (sourceAction: SOURCE_ACTION) => void;
    canShowBlockSender: boolean;
    onBlockSender: () => Promise<void>;
    conversationMode: boolean;
}

const ItemContextMenu = ({
    checkedIDs,
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

    const handleMove = (labelID: string) => {
        onMove(labelID);
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
            icon={<IcInbox />}
            name={c('Action').t`Move to inbox`}
            action={() => handleMove(MAILBOX_LABEL_IDS.INBOX)}
        />
    );

    const nospam = (
        <ContextMenuButton
            key="context-menu-nospam"
            testId="context-menu-nospam"
            icon={<IcFireSlash />}
            name={c('Action').t`Move to inbox (not spam)`}
            action={() => handleMove(MAILBOX_LABEL_IDS.INBOX)}
        />
    );

    const archive = (
        <ContextMenuButton
            key="context-menu-archive"
            testId="context-menu-archive"
            icon={<IcArchiveBox />}
            name={c('Action').t`Move to archive`}
            action={() => handleMove(MAILBOX_LABEL_IDS.ARCHIVE)}
        />
    );

    const trash = (
        <ContextMenuButton
            key="context-menu-trash"
            testId="context-menu-trash"
            icon={<IcTrash />}
            name={c('Action').t`Move to trash`}
            action={() => handleMove(MAILBOX_LABEL_IDS.TRASH)}
        />
    );

    const spam = (
        <ContextMenuButton
            key="context-menu-spam"
            testId="context-menu-spam"
            icon={<IcFire />}
            name={c('Action').t`Move to spam`}
            action={() => handleMove(MAILBOX_LABEL_IDS.SPAM)}
        />
    );

    const deleteButton = (
        <ContextMenuButton
            key="context-menu-delete"
            testId="context-menu-delete"
            icon={<IcCrossCircle />}
            name={c('Action').t`Delete`}
            action={() => handleDelete(SOURCE_ACTION.CONTEXT_MENU)}
        />
    );

    const allMoveButtons = { inbox, trash, archive, spam, nospam, delete: deleteButton };
    const moveButtons = actions.map((action) => allMoveButtons[action]);

    return (
        <ContextMenu size={{ maxHeight: DropdownSizeUnit.Viewport }} {...rest}>
            {moveButtons}
            <CategoryContextMenu onCategoryMove={handleMove} />

            <ContextSeparator className="bg-weak my-1" />

            {buttonMarkAsRead ? (
                <ContextMenuButton
                    key="context-menu-read"
                    testId="context-menu-read"
                    icon={<IcEnvelopeOpen />}
                    name={c('Action').t`Mark as read`}
                    action={() => handleMarkAs(MARK_AS_STATUS.READ, SOURCE_ACTION.CONTEXT_MENU)}
                />
            ) : (
                <ContextMenuButton
                    key="context-menu-unread"
                    testId="context-menu-unread"
                    icon={<IcEnvelopeDot />}
                    name={c('Action').t`Mark as unread`}
                    action={() => handleMarkAs(MARK_AS_STATUS.UNREAD, SOURCE_ACTION.CONTEXT_MENU)}
                />
            )}

            {canShowBlockSender && (
                <>
                    <ContextSeparator className="bg-weak my-1" />
                    <ContextMenuButton
                        key="context-menu-block"
                        testId="context-menu-block"
                        icon={<IcCircleSlash />}
                        name={c('Action').t`Block sender`}
                        action={onBlockSender}
                    />
                </>
            )}
        </ContextMenu>
    );
};

export default ItemContextMenu;
