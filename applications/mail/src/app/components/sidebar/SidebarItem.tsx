import { ReactNode, useRef, memo } from 'react';
import {
    classnames,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    useEventManager,
    SidebarListItemLink,
    useLoading,
    useCache,
    HotkeyTuple,
    useHotkeys,
    useMailSettings,
    useItemsDroppable,
} from '@proton/components';
import { useHistory } from 'react-router-dom';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { noop } from '@proton/shared/lib/helpers/function';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { c, msgid } from 'ttag';
import LocationAside from './LocationAside';
import { LABEL_IDS_TO_HUMAN } from '../../constants';
import { useApplyLabels, useMoveToFolder } from '../../hooks/useApplyLabels';
import { ELEMENTS_CACHE_KEY } from '../../hooks/mailbox/useElementsCache';

const { ALL_MAIL, DRAFTS, ALL_DRAFTS, SENT, ALL_SENT, SCHEDULED } = MAILBOX_LABEL_IDS;

const noDrop: string[] = [ALL_MAIL, DRAFTS, ALL_DRAFTS, SENT, ALL_SENT, SCHEDULED];

const COUNTER_LIMIT = 9999;

interface Props {
    currentLabelID: string;
    labelID: string;
    isFolder: boolean;
    icon?: string;
    iconSize?: number;
    text: string;
    shortcutText?: string;
    content?: ReactNode;
    color?: string;
    unreadCount?: number;
    totalMessagesCount?: number;
    shortcutHandlers?: HotkeyTuple[];
    onFocus?: () => void;
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
    color,
    isFolder,
    unreadCount,
    totalMessagesCount = 0,
    shortcutHandlers = [],
    onFocus = noop,
    id,
}: Props) => {
    const { call } = useEventManager();
    const cache = useCache();
    const history = useHistory();
    const [{ Shortcuts = 0 } = {}] = useMailSettings();

    const [refreshing, withRefreshing] = useLoading(false);

    const applyLabel = useApplyLabels();
    const moveToFolder = useMoveToFolder();

    const humanID = LABEL_IDS_TO_HUMAN[labelID as MAILBOX_LABEL_IDS]
        ? LABEL_IDS_TO_HUMAN[labelID as MAILBOX_LABEL_IDS]
        : labelID;
    const link = `/${humanID}`;

    const active = labelID === currentLabelID;
    const ariaCurrent = active ? 'page' : undefined;

    const canDisplayTotalMessagesCounter = labelID === SCHEDULED && totalMessagesCount > 0;

    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (history.location.pathname.endsWith(link) && !refreshing) {
            event.preventDefault();
            void withRefreshing(Promise.all([call(), wait(1000)]));
        }
    };

    const { dragOver, dragProps, handleDrop } = useItemsDroppable(
        () =>
            currentLabelID !== labelID && // Never on current label
            !noDrop.includes(labelID), // Some destinations has no sense
        isFolder ? 'move' : 'link',
        (itemIDs) => {
            // Avoid useElementsCache for perf issues
            const elementsCache = cache.get(ELEMENTS_CACHE_KEY);
            const elements = itemIDs.map((itemID) => elementsCache.elements[itemID]);
            if (isFolder) {
                void moveToFolder(elements, labelID, text, currentLabelID);
            } else {
                void applyLabel(elements, { [labelID]: true });
            }
        }
    );

    const elementRef = useRef<HTMLAnchorElement>(null);
    useHotkeys(elementRef, shortcutHandlers);

    const getTotalMessagesTitle = () => {
        return c('Info').ngettext(
            msgid`${totalMessagesCount} scheduled message`,
            `${totalMessagesCount} scheduled messages`,
            totalMessagesCount
        );
    };

    const totalMessagesCounter = canDisplayTotalMessagesCounter && (
        <span
            className="navigation-counter-item navigation-counter-item--transparent flex-item-noshrink color-weak text-sm"
            title={getTotalMessagesTitle()}
            data-testid="navigation-link:total-messages-count"
        >
            {totalMessagesCount > COUNTER_LIMIT ? '9999+' : totalMessagesCount}
        </span>
    );

    return (
        <SidebarListItem className={classnames([dragOver && 'navigation__dragover'])}>
            <SidebarListItemLink
                aria-current={ariaCurrent}
                to={link}
                onClick={handleClick}
                {...dragProps}
                onDrop={handleDrop}
                title={shortcutText !== undefined && Shortcuts ? `${text} ${shortcutText}` : text}
                ref={elementRef}
                data-testid={`navigation-link:${text}`}
                data-shortcut-target={['navigation-link', id].filter(isTruthy).join(' ')}
                onFocus={onFocus}
            >
                <SidebarListItemContent
                    left={icon ? <SidebarListItemContentIcon name={icon} color={color} size={iconSize} /> : undefined}
                    right={<LocationAside unreadCount={unreadCount} active={active} refreshing={refreshing} />}
                >
                    {content}
                    {totalMessagesCounter}
                </SidebarListItemContent>
            </SidebarListItemLink>
        </SidebarListItem>
    );
};

export default memo(SidebarItem);
