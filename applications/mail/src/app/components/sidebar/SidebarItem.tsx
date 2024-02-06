import type { ReactNode } from 'react';
import { memo, useRef } from 'react';
import { useHistory } from 'react-router-dom';

import type { HotkeyTuple, IconName, IconSize } from '@proton/components';
import {
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
    Tooltip,
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

import { useCheckAllRef } from 'proton-mail/containers/CheckAllRefProvider';
import useMailModel from 'proton-mail/hooks/useMailModel';
import { useSelectAll } from 'proton-mail/hooks/useSelectAll';

import { LABEL_IDS_TO_HUMAN } from '../../constants';
import { shouldDisplayTotal } from '../../helpers/labels';
import { useApplyLabels } from '../../hooks/actions/label/useApplyLabels';
import { useMoveToFolder } from '../../hooks/actions/move/useMoveToFolder';
import { useGetElementsFromIDs } from '../../hooks/mailbox/useElements';
import LocationAside from './LocationAside';

const { ALL_MAIL, ALMOST_ALL_MAIL, ALL_DRAFTS, ALL_SENT, SCHEDULED, SNOOZED, OUTBOX } = MAILBOX_LABEL_IDS;

const NO_DROP: string[] = [ALL_MAIL, ALMOST_ALL_MAIL, ALL_DRAFTS, ALL_SENT, SCHEDULED, SNOOZED, OUTBOX];

const defaultShortcutHandlers: HotkeyTuple[] = [];

interface Props {
    currentLabelID: string;
    labelID: string;
    isFolder: boolean;
    isLabel?: boolean;
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
    collapsed?: boolean;
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
    isLabel,
    hideCountOnHover = true,
    unreadCount,
    totalMessagesCount = 0,
    shortcutHandlers = defaultShortcutHandlers,
    onFocus = noop,
    id,
    isOptionDropdownOpened,
    collapsed = false,
}: Props) => {
    const { call } = useEventManager();
    const history = useHistory();
    const { Shortcuts } = useMailModel('MailSettings');
    const getElementsFromIDs = useGetElementsFromIDs();
    const { selectAll } = useSelectAll({ labelID });
    const { checkAllRef } = useCheckAllRef();

    const [refreshing, withRefreshing] = useLoading(false);

    const { applyLabels, applyLabelsToAllModal } = useApplyLabels();
    const { moveToFolder, moveScheduledModal, moveSnoozedModal, moveToSpamModal, selectAllMoveModal } =
        useMoveToFolder();

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
                void moveToFolder({
                    elements,
                    sourceLabelID: currentLabelID,
                    destinationLabelID: labelID,
                    folderName: text,
                    selectAll,
                    onCheckAll: checkAllRef?.current ? checkAllRef.current : undefined,
                });
            } else {
                void applyLabels({
                    elements,
                    changes: { [labelID]: true },
                    labelID: currentLabelID,
                    selectAll,
                    onCheckAll: checkAllRef?.current ? checkAllRef.current : undefined,
                });
            }
        }
    });

    const elementRef = useRef<HTMLAnchorElement>(null);
    useHotkeys(elementRef, shortcutHandlers);

    const tooltipText = text;
    const titleText = shortcutText !== undefined && Shortcuts ? `${text} ${shortcutText}` : text;

    return (
        <SidebarListItem
            className={clsx([
                dragOver && 'navigation__dragover',
                'group-hover-hide-container group-hover-opacity-container',
            ])}
            data-testid={`sidebar-label:${text}`}
        >
            <Tooltip originalPlacement="right" title={collapsed ? tooltipText : null}>
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
                        collapsed={collapsed}
                        left={
                            icon ? (
                                <SidebarListItemContentIcon
                                    className={clsx([
                                        collapsed && 'flex mx-auto',
                                        isLabel && 'navigation-icon--fixAliasing',
                                    ])}
                                    name={icon}
                                    color={color}
                                    size={iconSize}
                                />
                            ) : undefined
                        }
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
                                collapsed={collapsed}
                            />
                        }
                    >
                        <span
                            className={clsx('text-ellipsis', collapsed && 'sr-only')}
                            title={collapsed ? undefined : titleText}
                        >
                            {content}
                        </span>
                    </SidebarListItemContent>
                </SidebarListItemLink>
            </Tooltip>
            {moveScheduledModal}
            {moveSnoozedModal}
            {moveToSpamModal}
            {selectAllMoveModal}
            {applyLabelsToAllModal}
        </SidebarListItem>
    );
};

export default memo(SidebarItem);
