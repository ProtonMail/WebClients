import { MouseEvent } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { isMessage, isStarred as testIsStarred, isUnread as testIsUnread } from '../../helpers/elements';
import { MARK_AS_STATUS, useMarkAs } from '../../hooks/actions/useMarkAs';
import { useMoveToFolder } from '../../hooks/actions/useMoveToFolder';
import { useStar } from '../../hooks/actions/useStar';
import { Element } from '../../models/element';

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
    const markAs = useMarkAs();
    const { moveToFolder, moveScheduledModal } = useMoveToFolder();
    const star = useStar();

    const [loadingStar, withLoadingStar] = useLoading();

    const isUnread = testIsUnread(element, labelID);
    const isStarred = testIsStarred(element || ({} as Element));

    const handleMarkAs = (event: MouseEvent) => {
        event.stopPropagation();
        if (element.ID === elementID && !isUnread) {
            onBack();
        }
        markAs([element], labelID, isUnread ? READ : UNREAD);
    };

    const handleArchive = (event: MouseEvent) => {
        event.stopPropagation();
        void moveToFolder([element], ARCHIVE, c('Title').t`Archive`, labelID, false);
    };

    const handleTrash = (event: MouseEvent) => {
        event.stopPropagation();
        void moveToFolder([element], TRASH, c('Title').t`Trash`, labelID, false);
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
                    'flex-nowrap flex-justify-space-between relative item-hover-action-buttons no-mobile',
                    className
                )}
            >
                <Tooltip title={unreadAlt} tooltipClassName="no-pointer-events">
                    <Button icon shape="ghost" size={size} className="color-inherit" onClick={handleMarkAs}>
                        <Icon name={unreadIcon} alt={unreadAlt} />
                    </Button>
                </Tooltip>
                <Tooltip title={c('Action').t`Move to trash`} tooltipClassName="no-pointer-events">
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
                <Tooltip title={c('Action').t`Move to archive`} tooltipClassName="no-pointer-events">
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
                {hasStar && (
                    <Tooltip title={starAlt} tooltipClassName="no-pointer-events">
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
        </>
    );
};

export default ItemHoverButtons;
