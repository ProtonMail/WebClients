import type { ChangeEvent, ReactNode, Ref, RefObject } from 'react';
import { Fragment, forwardRef, memo, useEffect, useMemo } from 'react';

import { c, msgid } from 'ttag';

import { useActiveBreakpoint, useItemsDraggable } from '@proton/components';
import { useLabels } from '@proton/mail';
import { useConversationCounts } from '@proton/mail/store/counts/conversationCounts';
import { useMessageCounts } from '@proton/mail/store/counts/messageCounts';
import { DENSITY } from '@proton/shared/lib/constants';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';
import type { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import type { Filter } from '@proton/shared/lib/mail/search';
import clsx from '@proton/utils/clsx';

import SelectAllBanner from 'proton-mail/components/list/select-all/SelectAllBanner';
import { getCanDisplaySelectAllBanner } from 'proton-mail/helpers/selectAll';
import useMailModel from 'proton-mail/hooks/useMailModel';
import { useSelectAll } from 'proton-mail/hooks/useSelectAll';
import { useMailELDTMetric } from 'proton-mail/metrics/useMailELDTMetric';
import { useMailPTTMetric } from 'proton-mail/metrics/useMailPTTMetric';
import { useMailSelector } from 'proton-mail/store/hooks';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { useGetStartedChecklist } from '../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { isMessage as testIsMessage } from '../../helpers/elements';
import { usePaging } from '../../hooks/usePaging';
import { PLACEHOLDER_ID_PREFIX, usePlaceholders } from '../../hooks/usePlaceholders';
import type { Element } from '../../models/element';
import { pageSize as pageSizeSelector, showLabelTaskRunningBanner } from '../../store/elements/elementsSelectors';
import UserOnboardingMessageListPlaceholder from '../onboarding/checklist/messageListPlaceholder/UserOnboardingMessageListPlaceholder';
import EmptyListPlaceholder from '../view/EmptyListPlaceholder';
import Item from './Item';
import ListBanners from './MailboxListBanners';
import ListPagination from './MailboxListPagination';
import { ResizeHandle } from './ResizeHandle';
import SkeletonItem from './SkeletonItem';
import type { SOURCE_ACTION } from './list-telemetry/useListTelemetry';
import useEncryptedSearchList from './useEncryptedSearchList';
import { useItemContextMenu } from './useItemContextMenu';

import './delight/DelightList.scss';

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
    onFocus: (elementID: string) => void;
    conversationMode: boolean;
    isSearch: boolean;
    page: number;
    total: number | undefined;
    onPage: (page: number) => void;
    filter: Filter;
    resizeAreaRef: Ref<HTMLButtonElement>;
    enableResize: () => void;
    resetWidth: () => void;
    showContentPanel: boolean;
    scrollBarWidth: number;
    onMarkAs: (status: MARK_AS_STATUS, sourceAction: SOURCE_ACTION) => void;
    onMove: (labelID: string, sourceAction: SOURCE_ACTION) => void;
    onDelete: (sourceAction: SOURCE_ACTION) => void;
    onBack: () => void;
    userSettings: UserSettings;
    toolbar?: ReactNode | undefined;
    onCheckAll: (check: boolean) => void;
    listContainerRef: RefObject<HTMLDivElement>;
    currentFolder?: string;
}

/**
 * @deprecated
 * Please use MailboxList component instead.
 * A component that displays a list of messages.
 *
 * This component is responsible for rendering the list of messages
 **/
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
        onCheckAll,
        listContainerRef,
    }: Props,
    ref: Ref<HTMLDivElement>
) => {
    const mailSettings = useMailModel('MailSettings');
    const [labels] = useLabels();
    const { shouldHighlight, esStatus } = useEncryptedSearchContext();
    const { selectAll, locationCount, selectAllAvailable } = useSelectAll({ labelID });
    const checkedIDsMap = useMemo<{ [ID: string]: boolean }>(() => {
        return checkedIDs.reduce(
            (acc, ID) => {
                acc[ID] = true;
                return acc;
            },
            {} as { [ID: string]: boolean }
        );
    }, [checkedIDs]);

    const breakpoints = useActiveBreakpoint();

    // Override compactness of the list view to accommodate body preview when showing encrypted search results
    const { contentIndexingDone, esEnabled } = esStatus;
    const shouldOverrideCompactness = shouldHighlight() && contentIndexingDone && esEnabled;
    const isCompactView = userSettings.Density === DENSITY.COMPACT && !shouldOverrideCompactness;

    const hasFilter = Object.keys(filter).length > 0;

    const pageSize = useMailSelector(pageSizeSelector);
    const canDisplayTaskRunningBanner = useMailSelector((state) => showLabelTaskRunningBanner(state, { labelID }));

    const canShowSelectAllBanner = getCanDisplaySelectAllBanner({
        selectAllFeatureAvailable: selectAllAvailable,
        mailPageSize: pageSize,
        checkedIDs,
        labelID,
        isSearch,
        hasFilter,
    });

    const { displayState, changeChecklistDisplay, canDisplayChecklist } = useGetStartedChecklist();

    const elements = usePlaceholders({ inputElements, loading, expectedLength: placeholderCount });

    const { stopELDTMetric } = useMailELDTMetric();
    const { stopPTTMetric } = useMailPTTMetric();

    useEffect(() => {
        // We want  to report the end of ELDT as soon as no placeholder is present in the list
        if (elements.some((element) => element.ID.startsWith(PLACEHOLDER_ID_PREFIX))) {
            return;
        }

        stopELDTMetric(labelID);

        if (!loading) {
            stopPTTMetric();
        }
    }, [elements, loading]);

    const pagingHandlers = usePaging(inputPage, pageSize, inputTotal, onPage);
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
    const { isESLoading, showESSlowToolbar, loadingElement, useLoadingElement } = useEncryptedSearchList(
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
            const selectionCount = selectAll ? locationCount : draggedIDs.length;
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
        },
        selectAll // Pass the select all so that the callback knows when to display location count
    );

    const draggedIDsMap = useMemo<{ [ID: string]: boolean }>(() => {
        return draggedIDs.reduce(
            (acc, ID) => {
                acc[ID] = true;
                return acc;
            },
            {} as { [ID: string]: boolean }
        );
    }, [draggedIDs]);

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
        <div
            className={clsx([
                'relative items-column-list',
                !show && 'hidden',
                showContentPanel ? 'is-column' : 'is-row',
            ])}
        >
            <div ref={listContainerRef} className={clsx(['h-full', isCompactView && 'list-compact'])}>
                <h1 className="sr-only">
                    {conversationMode ? c('Title').t`Conversation list` : c('Title').t`Message list`}{' '}
                    {c('Title').ngettext(msgid`${unreads} unread message`, `${unreads} unread messages`, unreads)}
                </h1>

                <div
                    className={clsx(
                        'items-column-list-inner--mail',
                        breakpoints.viewportWidth['>=large'] && 'items-column-list-inner',
                        !columnLayout && 'border-none',
                        'flex flex-nowrap flex-column relative overflow-hidden h-full'
                    )}
                    data-testid={loading ? 'message-list-loading' : 'message-list-loaded'}
                    data-shortcut-target="items-column-list-inner"
                >
                    <div className="shrink-0">{toolbar}</div>

                    {canShowSelectAllBanner && (
                        <div className="shrink-0">
                            <SelectAllBanner labelID={labelID} onCheckAll={onCheckAll} />
                        </div>
                    )}

                    <ListBanners
                        labelID={labelID}
                        columnLayout={columnLayout}
                        esState={{ isESLoading, isSearch, showESSlowToolbar }}
                        canDisplayTaskRunningBanner={canDisplayTaskRunningBanner}
                    />

                    <div
                        ref={ref}
                        className="items-column-list-container h-full overflow-auto flex flex-column flex-nowrap w-full relative"
                    >
                        {elements.length === 0 && !canDisplayTaskRunningBanner && (
                            <EmptyListPlaceholder
                                labelID={labelID}
                                isSearch={isSearch}
                                isUnread={filter.Unread === 1}
                            />
                        )}
                        {elements.length > 0 && (
                            <>
                                {/* div needed here for focus management */}
                                <div className="w-full shrink-0">
                                    {elements.map((element, index) => {
                                        return (
                                            <Fragment key={element.ID}>
                                                {element.ID.startsWith(PLACEHOLDER_ID_PREFIX) ? (
                                                    <SkeletonItem
                                                        conversationMode={conversationMode}
                                                        isCompactView={isCompactView}
                                                        labelID={labelID}
                                                        loading={loading}
                                                        columnLayout={columnLayout}
                                                        element={element}
                                                        index={index}
                                                    />
                                                ) : (
                                                    <Item
                                                        conversationMode={conversationMode}
                                                        isCompactView={isCompactView}
                                                        labelID={labelID}
                                                        loading={loading}
                                                        columnLayout={columnLayout}
                                                        elementID={elementID}
                                                        element={element}
                                                        checked={!!checkedIDsMap[element.ID || '']}
                                                        onCheck={onCheckOne}
                                                        onClick={onClick}
                                                        onContextMenu={onContextMenu}
                                                        onDragStart={handleDragStart}
                                                        onDragEnd={handleDragEnd}
                                                        dragged={!!draggedIDsMap[element.ID || '']}
                                                        index={index}
                                                        onFocus={onFocus}
                                                        onBack={onBack}
                                                        userSettings={userSettings}
                                                        mailSettings={mailSettings}
                                                        labels={labels}
                                                    />
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </div>

                                {!loading && !(total > 1) && (
                                    <>
                                        {canDisplayChecklist && displayState === FULL && (
                                            <UserOnboardingMessageListPlaceholder location="list" />
                                        )}
                                    </>
                                )}

                                {useLoadingElement && loadingElement}

                                {total > 1 && (
                                    <div className="p-5 flex flex-column items-center shrink-0">
                                        <ListPagination
                                            page={page}
                                            total={total}
                                            handlePrevious={pagingHandlers.onPrevious}
                                            handleNext={pagingHandlers.onNext}
                                            handlePage={pagingHandlers.onPage}
                                            loading={loading}
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
