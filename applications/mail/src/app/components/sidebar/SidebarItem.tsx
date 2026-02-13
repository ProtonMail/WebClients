import type { ReactNode } from 'react';
import { memo, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';

import type { HotkeyTuple } from '@proton/components';
import {
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
    useEventManager,
    useHotkeys,
    useItemsDroppable,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import type { IconName, IconSize } from '@proton/icons/types';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { CATEGORY_LABELS_TO_ROUTE_ARRAY, CUSTOM_VIEWS, LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { useCheckAllRef } from 'proton-mail/containers/CheckAllRefProvider';
import { useSelectAll } from 'proton-mail/hooks/useSelectAll';
import { params } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { shouldDisplayTotal } from '../../helpers/labels';
import type { ApplyLabelsParams } from '../../hooks/actions/label/interface';
import type { MoveParams } from '../../hooks/actions/move/useMoveToFolder';
import { useGetElementsFromIDs } from '../../hooks/mailbox/useElements';
import { useCategoriesView } from '../categoryView/useCategoriesView';
import { folderLocation } from '../list/list-telemetry/listTelemetryHelper';
import { SOURCE_ACTION } from '../list/list-telemetry/useListTelemetry';
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
    const [labels] = useLabels();
    const [folders] = useFolders();

    const mailParams = useMailSelector(params);

    const categoryViewControl = useCategoriesView();

    const [refreshing, withRefreshing] = useLoading(false);

    // We want to redirect the inbox link to the primary category if the feature is enabled and pointing to inbox
    const labelIDRoute =
        categoryViewControl.categoryViewAccess && labelID === MAILBOX_LABEL_IDS.INBOX
            ? MAILBOX_LABEL_IDS.CATEGORY_DEFAULT
            : (labelID as MAILBOX_LABEL_IDS);

    const humanID = LABEL_IDS_TO_HUMAN[labelIDRoute] ?? labelID;
    const link = `/${humanID}`;

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
                        folderName: text,
                        selectAll,
                        onCheckAll: checkAllRef?.current ? checkAllRef.current : undefined,
                        sourceAction: SOURCE_ACTION.DRAG_AND_DROP_MENU,
                        currentFolder: folderLocation(mailParams.labelID, labels, folders),
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
                isActive={(match, location) => {
                    // The inbox button should be active if the location starts with /inbox or starts with a category from the array
                    if (labelID === MAILBOX_LABEL_IDS.INBOX || labelID === MAILBOX_LABEL_IDS.CATEGORY_DEFAULT) {
                        return (
                            location.pathname.startsWith(`/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.INBOX]}`) ||
                            CATEGORY_LABELS_TO_ROUTE_ARRAY.some((route) => location.pathname.startsWith(route))
                        );
                    }
                    return !!match;
                }}
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
