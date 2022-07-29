import { MouseEvent } from 'react';

import { c } from 'ttag';

import { Button, ButtonGroup, Icon, Tooltip, classnames, useLoading } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { isMessage, isStarred as testIsStarred, isUnread as testIsUnread } from '../../helpers/elements';
import { useMoveToFolder, useStar } from '../../hooks/useApplyLabels';
import { MARK_AS_STATUS, useMarkAs } from '../../hooks/useMarkAs';
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
    size = 'small',
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
        void moveToFolder([element], ARCHIVE, c('Title').t`Archive`, labelID);
    };

    const handleTrash = (event: MouseEvent) => {
        event.stopPropagation();
        void moveToFolder([element], TRASH, c('Title').t`Trash`, labelID);
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

    return (
        <>
            <ButtonGroup
                size={size}
                className={classnames([
                    'opacity-on-hover opacity-on-hover-no-width relative item-hover-action-buttons no-mobile',
                    className,
                ])}
            >
                <Tooltip title={unreadAlt}>
                    <Button icon onClick={handleMarkAs}>
                        <Icon name={unreadIcon} alt={unreadAlt} />
                    </Button>
                </Tooltip>
                <Tooltip title={c('Action').t`Move to archive`}>
                    <Button icon onClick={handleArchive} disabled={labelID === ARCHIVE}>
                        <Icon name="archive-box" alt={c('Action').t`Move to archive`} />
                    </Button>
                </Tooltip>
                <Tooltip title={c('Action').t`Move to trash`}>
                    <Button icon onClick={handleTrash} disabled={labelID === TRASH}>
                        <Icon name="trash" alt={c('Action').t`Move to trash`} />
                    </Button>
                </Tooltip>
                {hasStar && (
                    <Tooltip title={starAlt}>
                        <Button
                            icon
                            onClick={handleStar}
                            className={classnames(['starbutton item-star', isStarred && 'starbutton--is-starred'])}
                        >
                            <Icon name={starIcon} alt={starAlt} />
                        </Button>
                    </Tooltip>
                )}
            </ButtonGroup>
            {moveScheduledModal}
        </>
    );
};

export default ItemHoverButtons;
