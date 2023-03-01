import { RefObject, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { addDays } from 'date-fns';
import { c } from 'ttag';

import {
    ContextMenu,
    ContextMenuButton,
    ContextSeparator,
    DropdownSizeUnit,
    FeatureCode,
    useModalState,
} from '@proton/components';
import { useApi, useEventManager, useFeature, useNotifications, useUser } from '@proton/components/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { canSetExpiration, getExpirationTime } from '../../helpers/expiration';
import { MARK_AS_STATUS } from '../../hooks/actions/useMarkAs';
import { useLabelActions } from '../../hooks/useLabelActions';
import { expireConversations } from '../../logic/conversations/conversationsActions';
import {
    elementsAreUnread as elementsAreUnreadSelector,
    expiringElements as expiringElementsSelector,
} from '../../logic/elements/elementsSelectors';
import { expireMessages } from '../../logic/messages/expire/messagesExpireActions';
import { useAppDispatch } from '../../logic/store';
import CustomExpirationModal from '../message/modals/CustomExpirationModal';

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
    const dispatch = useAppDispatch();
    const { createNotification } = useNotifications();
    const [user] = useUser();
    const { call } = useEventManager();
    const api = useApi();
    const [modalProps, handleSetOpen, render] = useModalState();
    const { feature } = useFeature(FeatureCode.SetExpiration);
    const elementsAreUnread = useSelector(elementsAreUnreadSelector);
    const expiringElements = useSelector(expiringElementsSelector);
    const willExpire = useMemo(() => {
        return checkedIDs.every((elementID) => expiringElements[elementID]);
    }, [checkedIDs, expiringElements]);
    const buttonMarkAsRead = useMemo(() => {
        const allRead = checkedIDs.every((elementID) => !elementsAreUnread[elementID]);
        return !allRead;
    }, [checkedIDs, elementsAreUnread]);
    const canExpire = !conversationMode && canSetExpiration(feature?.Value, user);

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

    const handleExpire = (days: number) => {
        const date = days ? addDays(new Date(), days) : undefined;
        const expirationTime = getExpirationTime(date);

        if (conversationMode) {
            void dispatch(expireConversations({ IDs: checkedIDs, expirationTime, api, call }));
        } else {
            void dispatch(expireMessages({ IDs: checkedIDs, expirationTime, api, call }));
        }

        rest.close();
        createNotification({
            text: days ? c('Success').t`Self-destruction set` : c('Success').t`Self-destruction removed`,
        });
    };

    const handleCustomExpiration = (expirationDate: Date) => {
        const expirationTime = getExpirationTime(expirationDate);
        void dispatch(expireMessages({ IDs: checkedIDs, expirationTime, api, call }));
        handleSetOpen(false);
        createNotification({ text: c('Success').t`Self-destruction set` });
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
                {canExpire && (
                    <>
                        <ContextSeparator />
                        {willExpire ? (
                            <ContextMenuButton
                                key="context-menu-remove-expiration"
                                testId="context-menu-remove-expiration"
                                icon="hourglass"
                                name={c('Action').t`Remove self-destruction`}
                                action={() => handleExpire(0)}
                            />
                        ) : (
                            <>
                                <ContextMenuButton
                                    key="context-menu-expire-next-week"
                                    testId="context-menu-expire-next-week"
                                    icon="hourglass"
                                    name={c('Action').t`Self-destruct in 7 days`}
                                    action={() => handleExpire(7)}
                                />
                                <ContextMenuButton
                                    key="context-menu-expire-next-month"
                                    testId="context-menu-expire-next-month"
                                    icon="hourglass"
                                    name={c('Action').t`Self-destruct on ...`}
                                    action={() => {
                                        handleSetOpen(true);
                                        rest.close();
                                    }}
                                />
                            </>
                        )}
                    </>
                )}
            </ContextMenu>
            {render && <CustomExpirationModal onSubmit={handleCustomExpiration} {...modalProps} />}
        </>
    );
};

export default ItemContextMenu;
