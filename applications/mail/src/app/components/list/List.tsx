import { ChangeEvent, Fragment, ReactNode, Ref, RefObject, forwardRef, memo, useEffect, useMemo } from 'react';

import { c, msgid } from 'ttag';

import { PaginationRow, useConversationCounts, useItemsDraggable, useMessageCounts } from '@proton/components';
import { DENSITY } from '@proton/shared/lib/constants';
import { CHECKLIST_DISPLAY_TYPE, UserSettings } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import useMailModel from 'proton-mail/hooks/useMailModel';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { useGetStartedChecklist } from '../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { isMessage as testIsMessage } from '../../helpers/elements';
import { isColumnMode } from '../../helpers/mailSettings';
import { MARK_AS_STATUS } from '../../hooks/actions/useMarkAs';
import { usePaging } from '../../hooks/usePaging';
import { usePlaceholders } from '../../hooks/usePlaceholders';
import { Element } from '../../models/element';
import { Filter } from '../../models/tools';
import { Breakpoints } from '../../models/utils';
import UsersOnboardingChecklist from '../checklist/UsersOnboardingChecklist';
import EmptyListPlaceholder from '../view/EmptyListPlaceholder';
import Item from './Item';
import ListBanners from './ListBanners';
import { ResizeHandle } from './ResizeHandle';
import useEncryptedSearchList from './useEncryptedSearchList';
import { useItemContextMenu } from './useItemContextMenu';

const defaultCheckedIDs: string[] = [];
const defaultElements: Element[] = [];

const { FULL, REDUCED } = CHECKLIST_DISPLAY_TYPE;

interface Props {
    show: boolean;
    labelID: string;
    loading: boolean;
    placeholderCount: number;
    elementID?: string;
    columnLayout: boolean;
    elements?: Element[];
    checkedIDs?: string[];
    onCheck: (ID: string[], checked: boolean, replace: boolean) => void;
    onCheckOne: (event: ChangeEvent, ID: string) => void;
    onClick: (elementID: string | undefined) => void;
    onFocus: (number: number) => void;
    conversationMode: boolean;
    isSearch: boolean;
    breakpoints: Breakpoints;
    page: number;
    total: number | undefined;
    onPage: (page: number) => void;
    filter: Filter;
    resizeAreaRef: Ref<HTMLButtonElement>;
    enableResize: () => void;
    resetWidth: () => void;
    showContentPanel: boolean;
    scrollBarWidth: number;
    onMarkAs: (status: MARK_AS_STATUS) => void;
    onMove: (labelID: string) => void;
    onDelete: () => void;
    onBack: () => void;
    userSettings: UserSettings;
    toolbar?: ReactNode | undefined;
}

const List = (
    {
        show,
        labelID,
        loading,
        placeholderCount,
        elementID,
        columnLayout,
        elements: inputElements = defaultElements,
        checkedIDs = defaultCheckedIDs,
        onCheck,
        onClick,
        conversationMode,
        isSearch,
        breakpoints,
        page: inputPage,
        total: inputTotal,
        onPage,
        onFocus,
        onCheckOne,
        filter,
        resizeAreaRef,
        enableResize,
        resetWidth,
        showContentPanel,
        scrollBarWidth,
        onMarkAs,
        onDelete,
        onMove,
        onBack,
        userSettings,
        toolbar,
    }: Props,
    ref: Ref<HTMLDivElement>
) => {
    const mailSettings = useMailModel('MailSettings');
    const { shouldHighlight, esStatus } = useEncryptedSearchContext();
    // Override compactness of the list view to accomodate body preview when showing encrypted search results
    const { contentIndexingDone, esEnabled } = esStatus;
    const shouldOverrideCompactness = shouldHighlight() && contentIndexingDone && esEnabled;
    const isCompactView = userSettings.Density === DENSITY.COMPACT && !shouldOverrideCompactness;

    const { displayState, changeChecklistDisplay } = useGetStartedChecklist();

    // We want to display placeholders only when we are currently loading elements AND we don't have elements already
    const displayPlaceholders = loading && inputElements?.length === 0;

    const elements = usePlaceholders(inputElements, displayPlaceholders, placeholderCount);
    const pagingHandlers = usePaging(inputPage, inputTotal, onPage);
    const { total, page } = pagingHandlers;

    const [messageCounts] = useMessageCounts();
    const [conversationCounts] = useConversationCounts();

    // Reduce the checklist if there are more than 4 elements in the view
    useEffect(() => {
        if (inputElements.length >= 5 && displayState === FULL) {
            changeChecklistDisplay(REDUCED);
        }
    }, [elements]);

    // ES options: offer users the option to turn off ES if it's taking too long, and
    // enable/disable UI elements for incremental partial searches
    const { isESLoading, showESSlowToolbar, loadingElement, disableGoToLast, useLoadingElement } =
        useEncryptedSearchList(isSearch, loading, page, total);

    const { draggedIDs, handleDragStart, handleDragEnd } = useItemsDraggable(
        elements,
        checkedIDs,
        onCheck,
        (draggedIDs) => {
            const isMessage = elements.length && testIsMessage(elements[0]);
            const selectionCount = draggedIDs.length;
            return isMessage
                ? c('Success').ngettext(
                      msgid`Move ${selectionCount} message`,
                      `Move ${selectionCount} messages`,
                      selectionCount
                  )
                : c('Success').ngettext(
                      msgid`Move ${selectionCount} conversation`,
                      `Move ${selectionCount} conversations`,
                      selectionCount
                  );
        }
    );

    const { contextMenu, onContextMenu, blockSenderModal } = useItemContextMenu({
        elementID,
        labelID,
        anchorRef: ref as RefObject<HTMLElement>,
        checkedIDs,
        onCheck,
        onMarkAs,
        onMove,
        onDelete,
        conversationMode,
    });

    const unreads = useMemo(() => {
        const counters = conversationMode ? conversationCounts : messageCounts;
        return (counters || []).find((counter) => counter.LabelID === labelID)?.Unread || 0;
    }, [conversationMode, labelID, conversationCounts, messageCounts]);

    return (
        <div className={clsx(['relative items-column-list', !show && 'hidden'])}>
            <div ref={ref} className={clsx(['h-full', isCompactView && 'list-compact'])}>
                <h1 className="sr-only">
                    {conversationMode ? c('Title').t`Conversation list` : c('Title').t`Message list`}{' '}
                    {c('Title').ngettext(msgid`${unreads} unread message`, `${unreads} unread messages`, unreads)}
                </h1>

                <div
                    className={clsx(
                        breakpoints.isDesktop && 'items-column-list-inner bg-norm',
                        !columnLayout && 'items-column-list-inner--border-none',
                        'flex flex-nowrap flex-column relative items-column-list-inner--mail overflow-hidden h-full'
                    )}
                    data-testid={`message-list-${displayPlaceholders ? 'loading' : 'loaded'}`}
                >
                    <div className="flex-item-noshrink">{toolbar}</div>
                    <div className="h-full scroll-if-needed flex flex-column flex-nowrap w-full">
                        <div className="flex-item-noshrink">
                            <ListBanners
                                labelID={labelID}
                                columnLayout={columnLayout}
                                userSettings={userSettings}
                                esState={{ isESLoading, isSearch, showESSlowToolbar }}
                            />
                        </div>
                        {elements.length === 0 && displayState !== FULL && (
                            <EmptyListPlaceholder
                                labelID={labelID}
                                isSearch={isSearch}
                                isUnread={filter.Unread === 1}
                            />
                        )}
                        {elements.length === 0 && displayState === FULL && <UsersOnboardingChecklist />}
                        {elements.length > 0 && (
                            <>
                                {/* div needed here for focus management */}
                                <div
                                    className={clsx(
                                        !columnLayout && 'border-right border-weak',
                                        'w-full flex-item-noshrink'
                                    )}
                                >
                                    {elements.map((element, index) => (
                                        <Fragment key={element.ID}>
                                            <Item
                                                conversationMode={conversationMode}
                                                isCompactView={isCompactView}
                                                labelID={labelID}
                                                loading={displayPlaceholders}
                                                columnLayout={columnLayout}
                                                elementID={elementID}
                                                element={element}
                                                checked={checkedIDs.includes(element.ID || '')}
                                                onCheck={onCheckOne}
                                                onClick={onClick}
                                                onContextMenu={onContextMenu}
                                                onDragStart={handleDragStart}
                                                onDragEnd={handleDragEnd}
                                                dragged={draggedIDs.includes(element.ID || '')}
                                                index={index}
                                                breakpoints={breakpoints}
                                                onFocus={onFocus}
                                                onBack={onBack}
                                            />
                                        </Fragment>
                                    ))}
                                </div>

                                {!loading && !(total > 1) && (
                                    <>
                                        {displayState === FULL && (
                                            <UsersOnboardingChecklist displayOnMobile={isColumnMode(mailSettings)} />
                                        )}
                                    </>
                                )}

                                {useLoadingElement && loadingElement}

                                {!loading && total > 1 && (
                                    <div className="p-5 flex flex-column flex-align-items-center flex-item-noshrink">
                                        <PaginationRow
                                            {...pagingHandlers}
                                            disabled={loading}
                                            disableGoToLast={disableGoToLast}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
            {elements.length !== 0 && showContentPanel && (
                <ResizeHandle
                    resizeAreaRef={resizeAreaRef}
                    enableResize={enableResize}
                    resetWidth={resetWidth}
                    scrollBarWidth={scrollBarWidth}
                />
            )}
            {contextMenu}
            {blockSenderModal}
        </div>
    );
};

export default memo(forwardRef(List));
