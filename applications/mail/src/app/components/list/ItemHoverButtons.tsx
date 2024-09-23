import type { MouseEvent } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Tooltip } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import { useLoading } from '@proton/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import clsx from '@proton/utils/clsx';

import { useMailSelector } from 'proton-mail/store/hooks';

import { isMessage, isStarred as testIsStarred, isUnread as testIsUnread } from '../../helpers/elements';
import { useMarkAs } from '../../hooks/actions/markAs/useMarkAs';
import { useMoveToFolder } from '../../hooks/actions/move/useMoveToFolder';
import { useStar } from '../../hooks/actions/useStar';
import type { Element } from '../../models/element';
import { selectSnoozeDropdownState, selectSnoozeElement } from '../../store/snooze/snoozeSliceSelectors';
import SnoozeDropdown from './snooze/containers/SnoozeDropdown';

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
    const star = useStar();
    const snoozedElement = useMailSelector(selectSnoozeElement);
    const snoozeDropdownState = useMailSelector(selectSnoozeDropdownState);

    const [loadingStar, withLoadingStar] = useLoading();

    const isUnread = testIsUnread(element, labelID);
    const isStarred = testIsStarred(element || ({} as Element));

    const handleMarkAs = (event: MouseEvent) => {
        event.stopPropagation();
        if (element.ID === elementID && !isUnread) {
            onBack();
        }
        markAs({
            elements: [element],
            labelID,
            status: isUnread ? READ : UNREAD,
        });
    };

    const handleArchive = (event: MouseEvent) => {
        event.stopPropagation();
        void moveToFolder({
            elements: [element],
            sourceLabelID: labelID,
            destinationLabelID: ARCHIVE,
            folderName: c('Title').t`Archive`,
        });
    };

    const handleTrash = (event: MouseEvent) => {
        event.stopPropagation();
        void moveToFolder({
            elements: [element],
            sourceLabelID: labelID,
            destinationLabelID: TRASH,
            folderName: c('Title').t`Trash`,
        });
    };

    const handleStar = (event: MouseEvent) => {
        event.stopPropagation();

        if (!loadingStar) {
            void withLoadingStar(star([element], !isStarred));
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
