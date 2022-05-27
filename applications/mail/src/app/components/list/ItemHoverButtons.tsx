import { c } from 'ttag';
import { ButtonGroup, Button, Tooltip, Icon } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { MouseEvent } from 'react';
import { Element } from '../../models/element';
import { isUnread as testIsUnread } from '../../helpers/conversation';
import { useMarkAs, MARK_AS_STATUS } from '../../hooks/useMarkAs';
import { useMoveToFolder, useStar } from '../../hooks/useApplyLabels';
import { isMessage, isStarred as testIsStarred } from '../../helpers/elements';

const { READ, UNREAD } = MARK_AS_STATUS;
const { ARCHIVE, TRASH } = MAILBOX_LABEL_IDS;

interface Props {
    element: Element; // Element of the current line
    labelID: string;
    elementID?: string; // ElementID of the currently selected element
    onBack: () => void;
}

const ItemHoverButtons = ({ element, labelID, elementID, onBack }: Props) => {
    const markAs = useMarkAs();
    const { moveToFolder, moveScheduledModal } = useMoveToFolder();
    const star = useStar();

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
        void star([element], !isStarred);
    };

    const unreadIcon = isUnread ? 'envelope-open' : 'envelope-dot';
    const unreadAlt = isUnread ? c('Title').t`Mark as read` : c('Title').t`Mark as unread`;

    const starIcon = isStarred ? 'star-slash' : 'star';
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
                size="small"
                className="opacity-on-hover opacity-on-hover-no-width relative item-hover-action-buttons"
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
                <Tooltip title={starAlt}>
                    <Button icon onClick={handleStar}>
                        <Icon name={starIcon} alt={starAlt} />
                    </Button>
                </Tooltip>
            </ButtonGroup>
            {moveScheduledModal}
        </>
    );
};

export default ItemHoverButtons;
