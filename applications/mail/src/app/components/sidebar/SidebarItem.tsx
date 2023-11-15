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
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import useMailModel from 'proton-mail/hooks/useMailModel';

import { LABEL_IDS_TO_HUMAN } from '../../constants';
import { shouldDisplayTotal } from '../../helpers/labels';
import { useApplyLabels } from '../../hooks/actions/useApplyLabels';
import { useMoveToFolder } from '../../hooks/actions/useMoveToFolder';
import { useGetElementsFromIDs } from '../../hooks/mailbox/useElements';
import LocationAside from './LocationAside';

const { ALL_MAIL, ALMOST_ALL_MAIL, DRAFTS, ALL_DRAFTS, SENT, ALL_SENT, SCHEDULED, SNOOZED } = MAILBOX_LABEL_IDS;

const NO_DROP: string[] = [ALL_MAIL, ALMOST_ALL_MAIL, DRAFTS, ALL_DRAFTS, SENT, ALL_SENT, SCHEDULED, SNOOZED];

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
    isOptionDropdownOpened?: boolean;
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
    isOptionDropdownOpened,
}: Props) => {
    const { call } = useEventManager();
    const history = useHistory();
    const { Shortcuts } = useMailModel('MailSettings');
    const getElementsFromIDs = useGetElementsFromIDs();

    const [refreshing, withRefreshing] = useLoading(false);

    const applyLabels = useApplyLabels();
    const { moveToFolder, moveScheduledModal, moveSnoozedModal, moveAllModal, moveToSpamModal } = useMoveToFolder();

    const humanID = LABEL_IDS_TO_HUMAN[labelID as MAILBOX_LABEL_IDS]
        ? LABEL_IDS_TO_HUMAN[labelID as MAILBOX_LABEL_IDS]
        : labelID;
    const link = `/${humanID}`;

    const isActive = labelID === currentLabelID;
    const ariaCurrent = isActive ? 'page' : undefined;

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
        const isNonDroppableFolder = NO_DROP.includes(labelID);
        return !isActive && !isNonDroppableFolder;
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
                'group-hover-hide-container group-hover-opacity-container',
            ])}
            data-testid={`sidebar-label:${text}`}
        >
            <SidebarListItemLink
                aria-current={ariaCurrent}
                to={link}
                onClick={handleClick}
                {...dragProps}
                onDrop={handleDrop}
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
                            active={isActive}
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            shouldDisplayTotal={needsTotalDisplay}
                            hideCountOnHover={hideCountOnHover}
                            itemOptions={itemOptions}
                            isOptionDropdownOpened={isOptionDropdownOpened}
                        />
                    }
                >
                    <span
                        className="text-ellipsis"
                        title={shortcutText !== undefined && Shortcuts ? `${text} ${shortcutText}` : text}
                    >
                        {content}
                    </span>
                </SidebarListItemContent>
            </SidebarListItemLink>
            {moveScheduledModal}
            {moveSnoozedModal}
            {moveAllModal}
            {moveToSpamModal}
        </SidebarListItem>
    );
};

export default memo(SidebarItem);
