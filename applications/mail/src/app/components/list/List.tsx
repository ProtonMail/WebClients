import { ChangeEvent, Fragment, Ref, RefObject, forwardRef, memo, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { PaginationRow, useConversationCounts, useItemsDraggable, useMessageCounts } from '@proton/components';
import { DENSITY } from '@proton/shared/lib/constants';
import { CHECKLIST_DISPLAY_TYPE, MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { useGetStartedChecklist } from '../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { isMessage as testIsMessage } from '../../helpers/elements';
import { isColumnMode } from '../../helpers/mailSettings';
import { MARK_AS_STATUS } from '../../hooks/actions/useMarkAs';
import { usePaging } from '../../hooks/usePaging';
import { usePlaceholders } from '../../hooks/usePlaceholders';
import useShowUpsellBanner from '../../hooks/useShowUpsellBanner';
import { showLabelTaskRunningBanner } from '../../logic/elements/elementsSelectors';
import { Element } from '../../models/element';
import { Filter, Sort } from '../../models/tools';
import { Breakpoints } from '../../models/utils';
import OnboardingChecklistWrapper from '../checklist/OnboardingChecklistWrapper';
import EmptyListPlaceholder from '../view/EmptyListPlaceholder';
import ESSlowToolbar from './ESSlowToolbar';
import Item from './Item';
import ListSettings from './ListSettings';
import MailUpsellBanner from './MailUpsellBanner';
import { ResizeHandle } from './ResizeHandle';
import TaskRunningBanner from './TaskRunningBanner';
import AutoDeleteBanner from './auto-delete/AutoDeleteBanner';
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
    sort: Sort;
    onSort: (sort: Sort) => void;
    onFilter: (filter: Filter) => void;
    mailSettings: MailSettings;
    userSettings: UserSettings;
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
        sort,
        onSort,
        onFilter,
        mailSettings,
        userSettings,
    }: Props,
    ref: Ref<HTMLDivElement>
) => {
    const { shouldHighlight, getESDBStatus } = useEncryptedSearchContext();
    // Override compactness of the list view to accomodate body preview when showing encrypted search results
    const { contentIndexingDone, esEnabled } = getESDBStatus();
    const shouldOverrideCompactness = shouldHighlight() && contentIndexingDone && esEnabled;
    const isCompactView = userSettings.Density === DENSITY.COMPACT && !shouldOverrideCompactness;

    const { displayState, changeChecklistDisplay } = useGetStartedChecklist();

    // We want to display placeholders only when we are currently loading elements AND we don't have elements already
    const displayPlaceholders = loading && inputElements?.length === 0;

    const elements = usePlaceholders(inputElements, displayPlaceholders, placeholderCount);
    const pagingHandlers = usePaging(inputPage, inputTotal, onPage);
    const { total, page } = pagingHandlers;

    const showTaskRunningBanner = useSelector(showLabelTaskRunningBanner);

    const [messageCounts] = useMessageCounts();
    const [conversationCounts] = useConversationCounts();

    const { canDisplayUpsellBanner, needToShowUpsellBanner, handleDismissBanner } = useShowUpsellBanner(
        labelID,
        showTaskRunningBanner
    );

    // Reduce the checklist if there are more than 4 elements in the view
    useEffect(() => {
        if (inputElements.length >= 5 && displayState === FULL) {
            changeChecklistDisplay(REDUCED);
        }
    }, [elements]);

    // ES options: offer users the option to turn off ES if it's taking too long, and
    // enable/disable UI elements for incremental partial searches
    const { showESSlowToolbar, loadingElement, disableGoToLast, useLoadingElement } = useEncryptedSearchList(
        isSearch,
        loading,
        page,
        total
    );

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
        <div className={clsx(['relative items-column-list relative', !show && 'hidden'])}>
            <div ref={ref} className={clsx(['h100 scroll-if-needed', isCompactView && 'list-compact'])}>
                <h1 className="sr-only">
                    {conversationMode ? c('Title').t`Conversation list` : c('Title').t`Message list`}{' '}
                    {c('Title').ngettext(msgid`${unreads} unread message`, `${unreads} unread messages`, unreads)}
                </h1>
                <div className="items-column-list-inner flex flex-nowrap flex-column relative items-column-list-inner--mail">
                    <ListSettings
                        sort={sort}
                        onSort={onSort}
                        onFilter={onFilter}
                        filter={filter}
                        conversationMode={conversationMode}
                        mailSettings={mailSettings}
                        isSearch={isSearch}
                        labelID={labelID}
                    />
                    {showESSlowToolbar && <ESSlowToolbar />}
                    {canDisplayUpsellBanner && (
                        <MailUpsellBanner
                            needToShowUpsellBanner={needToShowUpsellBanner}
                            columnMode={columnLayout}
                            onClose={handleDismissBanner}
                        />
                    )}
                    {showTaskRunningBanner && <TaskRunningBanner className={showESSlowToolbar ? '' : 'mt-4'} />}
                    <AutoDeleteBanner labelID={labelID} columnLayout={columnLayout} isCompactView={isCompactView} />
                    {elements.length === 0 && displayState !== FULL && (
                        <EmptyListPlaceholder labelID={labelID} isSearch={isSearch} isUnread={filter.Unread === 1} />
                    )}
                    {elements.length === 0 && displayState === FULL && <OnboardingChecklistWrapper />}
                    {elements.length > 0 && (
                        <>
                            {/* div needed here for focus management */}
                            <div>
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
                                        <OnboardingChecklistWrapper displayOnMobile={isColumnMode(mailSettings)} />
                                    )}
                                </>
                            )}

                            {useLoadingElement && loadingElement}

                            {!loading && total > 1 && (
                                <div className="p-5 flex flex-column flex-align-items-center">
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
