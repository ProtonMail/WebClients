import React, { useEffect, ChangeEvent, Ref, memo, forwardRef, MutableRefObject } from 'react';
import { c, msgid } from 'ttag';
import { useLabels, classnames, PaginationRow, useItemsDraggable, EllipsisLoader } from 'react-components';
import { MailSettings, UserSettings } from 'proton-shared/lib/interfaces';
import { DENSITY } from 'proton-shared/lib/constants';
import Item from './Item';
import { Element } from '../../models/element';
import EmptyView from '../view/EmptyView';
import { isMessage as testIsMessage } from '../../helpers/elements';
import { usePlaceholders } from '../../hooks/usePlaceholders';
import { Breakpoints } from '../../models/utils';
import { Page, Sort, Filter } from '../../models/tools';
import { usePaging } from '../../hooks/usePaging';
import ListSettings from './ListSettings';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';

const defaultCheckedIDs: string[] = [];
const defaultElements: Element[] = [];

interface Props {
    labelID: string;
    loading: boolean;
    placeholderCount: number;
    elementID?: string;
    userSettings: UserSettings;
    mailSettings: MailSettings;
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
    page: Page;
    onPage: (page: number) => void;
    sort: Sort;
    onSort: (sort: Sort) => void;
    filter: Filter;
    onFilter: (filter: Filter) => void;
}

const List = (
    {
        labelID,
        loading,
        placeholderCount,
        elementID,
        userSettings,
        mailSettings,
        columnLayout,
        elements: inputElements = defaultElements,
        checkedIDs = defaultCheckedIDs,
        onCheck,
        onClick,
        conversationMode,
        isSearch,
        breakpoints,
        page: inputPage,
        onPage,
        onFocus,
        onCheckOne,
        sort,
        onSort,
        filter,
        onFilter,
    }: Props,
    ref: Ref<HTMLDivElement>
) => {
    const isCompactView = userSettings.Density === DENSITY.COMPACT;

    const [labels] = useLabels();
    const { getESDBStatus } = useEncryptedSearchContext();
    const { dbExists, esEnabled, isSearchPartial, isCacheLimited, isSearching } = getESDBStatus();

    const elements = usePlaceholders(inputElements, loading, placeholderCount);
    const pagingHandlers = usePaging(inputPage, onPage);
    const { page, total } = pagingHandlers;

    // Scroll top when changing page
    useEffect(() => {
        (ref as MutableRefObject<HTMLElement | null>).current?.scroll?.({ top: 0 });
    }, [loading, page]);

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

    const searchLimitedMode = isSearch && !loading && dbExists && esEnabled && isCacheLimited;
    const disableGoToLast = searchLimitedMode && isSearchPartial;
    const isLastPage = page === total;
    const useLoadingElement = searchLimitedMode && (isSearching || !isSearchPartial) && isLastPage;
    const loadingText = isSearching ? c('Info').t`Loading` : c('Info').t`No more results found`;
    const loadingElement = (
        <div className="flex flex-nowrap flex-align-items-center flex-justify-center color-weak mt1-5 mb1-5">
            {loadingText}
            {isSearching && <EllipsisLoader />}
        </div>
    );

    return (
        <div
            ref={ref}
            className={classnames([
                'items-column-list scroll-if-needed scroll-smooth-touch',
                isCompactView && 'is-compact',
            ])}
        >
            <h1 className="sr-only">
                {conversationMode ? c('Title').t`Conversation list` : c('Title').t`Message list`}
            </h1>
            <div className="items-column-list-inner flex flex-nowrap flex-column relative">
                <ListSettings
                    sort={sort}
                    onSort={onSort}
                    onFilter={onFilter}
                    filter={filter}
                    conversationMode={conversationMode}
                    mailSettings={mailSettings}
                />
                {elements.length === 0 ? (
                    <EmptyView labelID={labelID} isSearch={isSearch} />
                ) : (
                    <>
                        {elements.map((element, index) => (
                            <Item
                                key={element.ID}
                                conversationMode={conversationMode}
                                labels={labels}
                                labelID={labelID}
                                loading={loading}
                                columnLayout={columnLayout}
                                elementID={elementID}
                                element={element}
                                checked={checkedIDs.includes(element.ID || '')}
                                onCheck={onCheckOne}
                                onClick={onClick}
                                mailSettings={mailSettings}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                dragged={draggedIDs.includes(element.ID || '')}
                                index={index}
                                breakpoints={breakpoints}
                                onFocus={onFocus}
                            />
                        ))}
                        {useLoadingElement && loadingElement}
                        {!loading && total > 1 && (
                            <div className="p1-5 flex flex-column flex-align-items-center">
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
    );
};

export default memo(forwardRef(List));
