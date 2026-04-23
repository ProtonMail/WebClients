import type { ReactNode } from 'react';
import { memo, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';

import SidebarListItem from '@proton/components/components/sidebar/SidebarListItem';
import SidebarListItemContent from '@proton/components/components/sidebar/SidebarListItemContent';
import SidebarListItemContentIcon from '@proton/components/components/sidebar/SidebarListItemContentIcon';
import SidebarListItemLink from '@proton/components/components/sidebar/SidebarListItemLink';
import useItemsDroppable from '@proton/components/containers/items/useItemsDroppable';
import useEventManager from '@proton/components/hooks/useEventManager';
import type { HotkeyTuple } from '@proton/components/hooks/useHotkeys';
import { useHotkeys } from '@proton/components/hooks/useHotkeys';
import { useLoading } from '@proton/hooks';
import type { IconName, IconSize } from '@proton/icons/types';
import { isCategoryLabel } from '@proton/mail/helpers/location';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { CUSTOM_VIEWS, LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { useCheckAllRef } from 'proton-mail/containers/CheckAllRefProvider';
import { categoryIDFromUrl, setCategoryInUrl } from 'proton-mail/helpers/mailboxUrl';
import type { MoveParams } from 'proton-mail/hooks/actions/applyLocation/interface';
import { useSelectAll } from 'proton-mail/hooks/useSelectAll';
import { params } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { shouldDisplayTotal } from '../../helpers/labels';
import type { ApplyLabelsParams } from '../../hooks/actions/label/interface';
import { useGetElementsFromIDs } from '../../hooks/mailbox/useElements';
import { useCategoriesView } from '../categoryView/useCategoriesView';
import LocationAside from './LocationAside';

import './SidebarItem.scss';

const NO_DROP_SET: Set<string> = new Set([
    MAILBOX_LABEL_IDS.ALL_MAIL,
    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
    MAILBOX_LABEL_IDS.ALL_DRAFTS,
    MAILBOX_LABEL_IDS.ALL_SENT,
    MAILBOX_LABEL_IDS.SCHEDULED,
    MAILBOX_LABEL_IDS.SNOOZED,
    MAILBOX_LABEL_IDS.OUTBOX,
    MAILBOX_LABEL_IDS.SOFT_DELETED,
]);

const defaultShortcutHandlers: HotkeyTuple[] = [];

interface Props {
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
    moveToFolder: (params: MoveParams) => void;
    applyLabels: (params: ApplyLabelsParams) => void;
    className?: string;
    onClickCallback?: () => void;
    hideSpinner?: boolean;
}

const SidebarItem = ({
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
    moveToFolder,
    applyLabels,
    className,
    onClickCallback,
    hideSpinner = false,
}: Props) => {
    const { call } = useEventManager();
    const history = useHistory();
    const [{ Shortcuts }] = useMailSettings();
    const getElementsFromIDs = useGetElementsFromIDs();
    const { selectAll } = useSelectAll({ labelID });
    const { checkAllRef } = useCheckAllRef();

    const mailParams = useMailSelector(params);

    const [refreshing, withRefreshing] = useLoading(false);

    const { categoryViewAccess } = useCategoriesView();

    const humanID = LABEL_IDS_TO_HUMAN[labelID as MAILBOX_LABEL_IDS] ?? labelID;

    let link: string;
    if (isCategoryLabel(labelID)) {
        // Category labels view redirect to /inbox#category=CATEGORY
        link = setCategoryInUrl(labelID);
    } else if (labelID === MAILBOX_LABEL_IDS.INBOX && categoryViewAccess) {
        // We want to redirect to /inbox#category=primary when categories are enabled
        link = setCategoryInUrl(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT);
    } else {
        link = `/${humanID}`;
    }

    const needsTotalDisplay = shouldDisplayTotal(labelID);

    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        // Remove the category from search params during comparison
        const linkPathname = link.split('#')[0];
        const params = new URLSearchParams(history.location.hash.slice(1));
        params.delete('category');
        const strippedHash = params.toString() ? `#${params.toString()}` : '';

        if (
            history.location.pathname.endsWith(linkPathname) &&
            // No search, no paging, nothing (except #category)
            strippedHash === '' &&
            // Not already refreshing
            !refreshing
        ) {
            event.preventDefault();
            void withRefreshing(Promise.all([call(), wait(1000)]));
        }

        // Allow to handle click outside of the SidebarItem
        onClickCallback?.();
    };

    const handleRefresh = () => {
        void withRefreshing(Promise.all([call(), wait(1000)]));
    };

    // Excludes current label and all custom views as drop targets.
    const dragFilter = useCallback(() => {
        const customViewLabelIDs = Object.entries(CUSTOM_VIEWS).map(([, view]) => {
            return view.label.toString();
        });
        return !(labelID === mailParams.labelID) && !NO_DROP_SET.has(labelID) && !customViewLabelIDs.includes(labelID);
    }, [mailParams.labelID, labelID]);

    const dropCallback = useCallback(
        (itemIDs: string[]) => {
            const elements = getElementsFromIDs(itemIDs);

            if (dragFilter()) {
                if (isFolder) {
                    void moveToFolder({
                        elements,
                        sourceLabelID: mailParams.labelID,
                        destinationLabelID: labelID,
                        selectAll,
                        onCheckAll: checkAllRef?.current ? checkAllRef.current : undefined,
                    });
                } else {
                    void applyLabels({
                        elements,
                        changes: { [labelID]: true },
                        labelID: mailParams.labelID,
                        selectAll,
                        onCheckAll: checkAllRef?.current ? checkAllRef.current : undefined,
                        destinationLabelID: labelID,
                    });
                }
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-1E6B59
        [applyLabels, dragFilter, checkAllRef, mailParams.labelID, getElementsFromIDs, isFolder, labelID, selectAll]
    );

    const { dragOver, dragProps, handleDrop } = useItemsDroppable(dragFilter, isFolder ? 'move' : 'link', dropCallback);

    const elementRef = useRef<HTMLAnchorElement>(null);
    useHotkeys(elementRef, shortcutHandlers);

    const tooltipText = text;
    const titleText = shortcutText !== undefined && Shortcuts ? `${text} ${shortcutText}` : text;

    return (
        <SidebarListItem
            className={clsx([
                dragOver && 'navigation__dragover',
                'group-hover-hide-container group-hover-opacity-container',
                className,
            ])}
            data-testid={`sidebar-label:${text}`}
        >
            <SidebarListItemLink
                title={tooltipText}
                to={link}
                onClick={handleClick}
                isActive={(match, location) => {
                    // Categories are displayed on the sidebar, this highlights the active category
                    if (isCategoryLabel(labelID)) {
                        const categoryID = categoryIDFromUrl(location);
                        return !!(labelID === categoryID);
                    }

                    if (labelID === MAILBOX_LABEL_IDS.ALL_MAIL || labelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL) {
                        return (
                            location.pathname.startsWith(`/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.ALL_MAIL]}`) ||
                            location.pathname.startsWith(`/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL]}`)
                        );
                    }

                    return !!match;
                }}
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
                            labelID={labelID}
                            unreadCount={needsTotalDisplay ? totalMessagesCount : unreadCount}
                            weak={labelID !== MAILBOX_LABEL_IDS.INBOX}
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            shouldDisplayTotal={needsTotalDisplay}
                            hideCountOnHover={hideCountOnHover}
                            itemOptions={itemOptions}
                            isOptionDropdownOpened={isOptionDropdownOpened}
                            collapsed={collapsed}
                            hideSpinner={hideSpinner}
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
        </SidebarListItem>
    );
};

export default memo(SidebarItem);
