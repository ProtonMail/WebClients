import { ReactNode, memo, useRef } from 'react';
import { useHistory } from 'react-router-dom';

import {
    HotkeyTuple,
    IconName,
    IconSize,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
    useEventManager,
    useHotkeys,
    useItemsDroppable,
    useMailSettings,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { LABEL_IDS_TO_HUMAN } from '../../constants';
import { shouldDisplayTotal } from '../../helpers/labels';
import { useApplyLabels } from '../../hooks/actions/useApplyLabels';
import { useMoveToFolder } from '../../hooks/actions/useMoveToFolder';
import { useGetElementsFromIDs } from '../../hooks/mailbox/useElements';
import LocationAside from './LocationAside';

const { ALL_MAIL, DRAFTS, ALL_DRAFTS, SENT, ALL_SENT, SCHEDULED } = MAILBOX_LABEL_IDS;

const NO_DROP: string[] = [ALL_MAIL, DRAFTS, ALL_DRAFTS, SENT, ALL_SENT, SCHEDULED];

const defaultShortcutHandlers: HotkeyTuple[] = [];

interface Props {
    currentLabelID: string;
    labelID: string;
    isFolder: boolean;
    hideCountOnHover?: boolean;
    icon?: IconName;
    iconSize?: IconSize;
    text: string;
    shortcutText?: string;
    content?: ReactNode;
    itemOptions?: ReactNode;
    color?: string;
    unreadCount?: number;
    totalMessagesCount?: number;
    shortcutHandlers?: HotkeyTuple[];
    onFocus?: (id: string) => void;
    className?: string;
    id?: string;
}

const SidebarItem = ({
    currentLabelID,
    labelID,
    icon,
    iconSize,
    text,
    shortcutText,
    content = text,
    itemOptions,
    color,
    isFolder,
    hideCountOnHover = true,
    unreadCount,
    totalMessagesCount = 0,
    shortcutHandlers = defaultShortcutHandlers,
    onFocus = noop,
    id,
    className,
}: Props) => {
    const { call } = useEventManager();
    const history = useHistory();
    const [{ Shortcuts = 0 } = {}] = useMailSettings();
    const getElementsFromIDs = useGetElementsFromIDs();

    const [refreshing, withRefreshing] = useLoading(false);

    const applyLabels = useApplyLabels();
    const { moveToFolder, moveScheduledModal, moveAllModal, moveToSpamModal } = useMoveToFolder();

    const humanID = LABEL_IDS_TO_HUMAN[labelID as MAILBOX_LABEL_IDS]
        ? LABEL_IDS_TO_HUMAN[labelID as MAILBOX_LABEL_IDS]
        : labelID;
    const link = `/${humanID}`;

    const active = labelID === currentLabelID;
    const ariaCurrent = active ? 'page' : undefined;

    const needsTotalDisplay = shouldDisplayTotal(labelID);

    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (
            history.location.pathname.endsWith(link) &&
            // No search, no paging, nothing
            history.location.hash === '' &&
            // Not already refreshing
            !refreshing
        ) {
            event.preventDefault();
            void withRefreshing(Promise.all([call(), wait(1000)]));
        }
    };

    const handleRefresh = () => {
        void withRefreshing(Promise.all([call(), wait(1000)]));
    };

    const canDrop = () => {
        const isSameLabel = currentLabelID === labelID;
        const isNonDroppableFolder = NO_DROP.includes(labelID);

        return !isSameLabel && !isNonDroppableFolder;
    };

    const { dragOver, dragProps, handleDrop } = useItemsDroppable(canDrop, isFolder ? 'move' : 'link', (itemIDs) => {
        const elements = getElementsFromIDs(itemIDs);

        if (canDrop()) {
            if (isFolder) {
                void moveToFolder(elements, labelID, text, currentLabelID, false);
            } else {
                void applyLabels(elements, { [labelID]: true }, false);
            }
        }
    });

    const elementRef = useRef<HTMLAnchorElement>(null);
    useHotkeys(elementRef, shortcutHandlers);

    return (
        <SidebarListItem
            className={clsx([
                dragOver && 'navigation__dragover',
                'hide-on-hover-container opacity-on-hover-container',
                className,
            ])}
        >
            <SidebarListItemLink
                aria-current={ariaCurrent}
                to={link}
                onClick={handleClick}
                {...dragProps}
                onDrop={handleDrop}
                title={shortcutText !== undefined && Shortcuts ? `${text} ${shortcutText}` : text}
                ref={elementRef}
                data-testid={`navigation-link:${humanID}`}
                data-shortcut-target={['navigation-link', id].filter(isTruthy).join(' ')}
                onFocus={() => onFocus(id || '')}
            >
                <SidebarListItemContent
                    left={icon ? <SidebarListItemContentIcon name={icon} color={color} size={iconSize} /> : undefined}
                    right={
                        <LocationAside
                            unreadCount={needsTotalDisplay ? totalMessagesCount : unreadCount}
                            weak={labelID !== MAILBOX_LABEL_IDS.INBOX}
                            active={active}
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            shouldDisplayTotal={needsTotalDisplay}
                            hideCountOnHover={hideCountOnHover}
                            itemOptions={itemOptions}
                        />
                    }
                >
                    <span className="text-ellipsis">{content}</span>
                </SidebarListItemContent>
            </SidebarListItemLink>
            {moveScheduledModal}
            {moveAllModal}
            {moveToSpamModal}
        </SidebarListItem>
    );
};

export default memo(SidebarItem);
