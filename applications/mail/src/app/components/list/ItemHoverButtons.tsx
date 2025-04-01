import type { MouseEvent } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Tooltip } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import { useLoading } from '@proton/hooks';
import { useFolders, useLabels } from '@proton/mail';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import clsx from '@proton/utils/clsx';

import { useMailSelector } from 'proton-mail/store/hooks';

import { isMessage, isStarred as testIsStarred, isUnread as testIsUnread } from '../../helpers/elements';
import { usePermanentDelete } from '../../hooks/actions/delete/usePermanentDelete';
import { useMarkAs } from '../../hooks/actions/markAs/useMarkAs';
import { useMoveToFolder } from '../../hooks/actions/move/useMoveToFolder';
import { useStar } from '../../hooks/actions/useStar';
import type { Element } from '../../models/element';
import { selectSnoozeDropdownState, selectSnoozeElement } from '../../store/snooze/snoozeSliceSelectors';
import SnoozeDropdown from './snooze/containers/SnoozeDropdown';
import { SOURCE_ACTION, folderLocation } from './useListTelemetry';

const { READ, UNREAD } = MARK_AS_STATUS;
const { ARCHIVE, TRASH } = MAILBOX_LABEL_IDS;

interface Props {
    element: Element; // Element of the current line
    labelID: string;
    elementID?: string; // ElementID of the currently selected element
    className?: string;
    onBack: () => void;
    hasStar?: boolean;
    size?: 'small' | 'medium';
}

const ItemHoverButtons = ({
    element,
    labelID,
    elementID,
    className,
    onBack,
    hasStar = true,
    size = 'medium',
}: Props) => {
    const { markAs } = useMarkAs();
    const { moveToFolder, moveScheduledModal, moveSnoozedModal } = useMoveToFolder();
    const { handleDelete: permanentDelete, deleteSelectionModal } = usePermanentDelete(labelID);
    const star = useStar();
    const snoozedElement = useMailSelector(selectSnoozeElement);
    const snoozeDropdownState = useMailSelector(selectSnoozeDropdownState);
    const [folders = []] = useFolders();
    const [labels = []] = useLabels();

    const [loadingStar, withLoadingStar] = useLoading();

    const isUnread = testIsUnread(element, labelID);
    const isStarred = testIsStarred(element || ({} as Element));
    const displayedFolder = folderLocation(labelID, labels, folders);

    const handleMarkAs = (event: MouseEvent) => {
        event.stopPropagation();
        // The active item might be a conversation, and the list can display either multiple messages or conversations
        if (element.ID === elementID && !isUnread) {
            onBack();
        }
        if (isMessage(element) && (element as Message).ConversationID === elementID && !isUnread) {
            onBack();
        }

        void markAs({
            elements: [element],
            labelID,
            status: isUnread ? READ : UNREAD,
            sourceAction: SOURCE_ACTION.HOVER_BUTTONS,
        });
    };

    const handleArchive = (event: MouseEvent) => {
        event.stopPropagation();
        void moveToFolder({
            elements: [element],
            sourceLabelID: labelID,
            destinationLabelID: ARCHIVE,
            folderName: c('Title').t`Archive`,
            sourceAction: SOURCE_ACTION.HOVER_BUTTONS,
            percentUnread: 1,
        });
    };

    const handleTrash = (event: MouseEvent) => {
        event.stopPropagation();
        void moveToFolder({
            elements: [element],
            sourceLabelID: labelID,
            destinationLabelID: TRASH,
            folderName: c('Title').t`Trash`,
            sourceAction: SOURCE_ACTION.HOVER_BUTTONS,
            currentFolder: displayedFolder,
            percentUnread: 1,
        });
    };

    const handlePermanentDelete = (event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        void permanentDelete([element.ID], SOURCE_ACTION.HOVER_BUTTONS);
        return false;
    };

    const handleStar = (event: MouseEvent) => {
        event.stopPropagation();

        if (!loadingStar) {
            void withLoadingStar(star([element], !isStarred, labelID, SOURCE_ACTION.HOVER_BUTTONS));
        }
    };

    const unreadIcon = isUnread ? 'envelope-open' : 'envelope-dot';
    const unreadAlt = isUnread ? c('Title').t`Mark as read` : c('Title').t`Mark as unread`;

    const starIcon = isStarred ? 'star-filled' : 'star';
    const starAlt = isMessage(element)
        ? isStarred
            ? c('Alt').t`Unstar message`
            : c('Alt').t`Star message`
        : isStarred
          ? c('Alt').t`Unstar conversation`
          : c('Alt').t`Star conversation`;

    const buttonTxt = isMessage(element) ? c('Alt').t`Star message` : c('Alt').t`Star conversation`;

    return (
        <>
            <div
                className={clsx(
                    'hidden flex-nowrap justify-space-between relative item-hover-action-buttons gap-1',
                    snoozeDropdownState === 'open' && snoozedElement?.ID === element.ID
                        ? 'item-hover-action-buttons--dropdown-open'
                        : '',
                    className
                )}
            >
                <Tooltip title={unreadAlt} tooltipClassName="pointer-events-none">
                    <Button icon shape="ghost" size={size} className="color-inherit" onClick={handleMarkAs}>
                        <Icon name={unreadIcon} alt={unreadAlt} />
                    </Button>
                </Tooltip>
                {labelID === TRASH ? (
                    <>
                        <Tooltip title={c('Action').t`Delete permanently`} tooltipClassName="pointer-events-none">
                            <Button
                                onClick={handlePermanentDelete}
                                icon
                                shape="ghost"
                                size={size}
                                className="color-inherit"
                            >
                                <Icon name="cross-circle" alt={c('Action').t`Delete permanently`} />
                            </Button>
                        </Tooltip>
                        {deleteSelectionModal}
                    </>
                ) : (
                    <Tooltip title={c('Action').t`Move to trash`} tooltipClassName="pointer-events-none">
                        <Button
                            icon
                            shape="ghost"
                            size={size}
                            className="color-inherit"
                            onClick={handleTrash}
                            disabled={labelID === TRASH}
                        >
                            <Icon name="trash" alt={c('Action').t`Move to trash`} />
                        </Button>
                    </Tooltip>
                )}
                <Tooltip title={c('Action').t`Move to archive`} tooltipClassName="pointer-events-none">
                    <Button
                        icon
                        shape="ghost"
                        size={size}
                        className="color-inherit"
                        onClick={handleArchive}
                        disabled={labelID === ARCHIVE}
                    >
                        <Icon name="archive-box" alt={c('Action').t`Move to archive`} />
                    </Button>
                </Tooltip>

                <SnoozeDropdown elements={[element]} size={size} labelID={labelID} />
                {hasStar && (
                    <Tooltip title={starAlt} tooltipClassName="pointer-events-none">
                        <Button
                            icon
                            shape="ghost"
                            size={size}
                            onClick={handleStar}
                            className={clsx(
                                'color-inherit starbutton item-star',
                                isStarred && 'starbutton--is-starred'
                            )}
                            aria-pressed={isStarred}
                        >
                            <Icon name={starIcon} alt={buttonTxt} />
                        </Button>
                    </Tooltip>
                )}
            </div>
            {moveScheduledModal}
            {moveSnoozedModal}
        </>
    );
};

export default ItemHoverButtons;
