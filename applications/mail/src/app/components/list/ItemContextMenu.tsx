import { c } from 'ttag';
import { RefObject } from 'react';
import { MESSAGE_BUTTONS, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { ContextMenu, ContextSeparator, ContextMenuButton } from '@proton/components';
import { Label, MailSettings } from '@proton/shared/lib/interfaces';
import { MARK_AS_STATUS, useMarkAs } from '../../hooks/useMarkAs';
import { useGetElementsFromIDs } from '../../hooks/mailbox/useElements';
import { useMoveToFolder } from '../../hooks/useApplyLabels';
import { getFolderName } from '../../helpers/labels';

interface Props {
    mailSettings: MailSettings;
    checkedIDs: string[];
    labels?: Label[];
    folders?: Folder[];
    elementID?: string;
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

const ItemContextMenu = ({
    checkedIDs,
    elementID,
    labelID,
    labels = [],
    folders = [],
    mailSettings,
    onBack,
    ...rest
}: Props) => {
    const { MessageButtons = MESSAGE_BUTTONS.READ_UNREAD } = mailSettings;
    const markAs = useMarkAs();
    const moveToFolder = useMoveToFolder();
    const getElementsFromIDs = useGetElementsFromIDs();
    const labelIDs = labels.map(({ ID }) => ID);

    const handleMarkAs = async (status: MARK_AS_STATUS) => {
        const isUnread = status === MARK_AS_STATUS.UNREAD;
        const elements = getElementsFromIDs(checkedIDs);
        if (isUnread) {
            onBack();
        }
        await markAs(elements, labelID, status);
    };

    const handleMove = async (LabelID: string) => {
        const folderName = getFolderName(LabelID, folders);
        const fromLabelID = labelIDs.includes(labelID) ? MAILBOX_LABEL_IDS.INBOX : labelID;
        const elements = getElementsFromIDs(checkedIDs);
        await moveToFolder(elements, LabelID, folderName, fromLabelID);
        if (checkedIDs.includes(elementID || '')) {
            onBack();
        }
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
                action={() => handleMove(MAILBOX_LABEL_IDS.INBOX)}
            />
            <ContextMenuButton
                testId="context-menu-archive"
                icon="archive-box"
                name={c('Action').t`Move to archive`}
                action={() => handleMove(MAILBOX_LABEL_IDS.ARCHIVE)}
            />
            <ContextMenuButton
                testId="context-menu-trash"
                icon="trash"
                name={c('Action').t`Move to trash`}
                action={() => handleMove(MAILBOX_LABEL_IDS.TRASH)}
            />
            <ContextMenuButton
                testId="context-menu-spam"
                icon="fire"
                name={c('Action').t`Move to spam`}
                action={() => handleMove(MAILBOX_LABEL_IDS.SPAM)}
            />
            <ContextSeparator />
            {readButtons}
        </ContextMenu>
    );
};

export default ItemContextMenu;
