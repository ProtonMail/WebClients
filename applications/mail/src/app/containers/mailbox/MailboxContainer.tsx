import React, { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import { History, Location } from 'history';
import { PrivateMainArea, useCalendars, useCalendarUserSettings, useItemsSelection } from 'react-components';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { isDraft } from 'proton-shared/lib/mail/messages';
import { VIEW_MODE } from 'proton-shared/lib/constants';
import { MailSettings, UserSettings } from 'proton-shared/lib/interfaces';
import { getSearchParams } from 'proton-shared/lib/helpers/url';
import { Sort, Filter, Page, SearchParameters } from '../../models/tools';
import { useMailboxPageTitle } from '../../hooks/mailbox/useMailboxPageTitle';
import { useElements } from '../../hooks/mailbox/useElements';
import { isColumnMode, isConversationMode } from '../../helpers/mailSettings';
import {
    pageFromUrl,
    sortFromUrl,
    filterFromUrl,
    setPageInUrl,
    setSortInUrl,
    setFilterInUrl,
    setParamsInLocation,
    extractSearchParameters,
} from '../../helpers/mailboxUrl';
import Toolbar from '../../components/toolbar/Toolbar';
import List from '../../components/list/List';
import ConversationView from '../../components/conversation/ConversationView';
import PlaceholderView from '../../components/view/PlaceholderView';
import MessageOnlyView from '../../components/message/MessageOnlyView';
import { PAGE_SIZE } from '../../constants';
import { isMessage, isSearch as testIsSearch } from '../../helpers/elements';
import { Breakpoints } from '../../models/utils';
import { OnCompose } from '../../hooks/composer/useCompose';
import { useWelcomeFlag } from '../../hooks/mailbox/useWelcomeFlag';
import useNewEmailNotification from '../../hooks/mailbox/useNewEmailNotification';
import { useDeepMemo } from '../../hooks/useDeepMemo';
import { useGetElementsFromIDs } from '../../hooks/mailbox/useElementsCache';
import { useMailboxHotkeys } from '../../hooks/mailbox/useMailboxHotkeys';
import { useMailboxFocus } from '../../hooks/mailbox/useMailboxFocus';

import './MailboxContainer.scss';

interface Props {
    labelID: string;
    userSettings: UserSettings;
    mailSettings: MailSettings;
    breakpoints: Breakpoints;
    elementID?: string;
    messageID?: string;
    location: Location;
    history: History;
    onCompose: OnCompose;
    isComposerOpened: boolean;
}

const MailboxContainer = ({
    labelID: inputLabelID,
    userSettings,
    mailSettings,
    breakpoints,
    elementID,
    messageID,
    location,
    history,
    onCompose,
    isComposerOpened,
}: Props) => {
    const getElementsFromIDs = useGetElementsFromIDs();
    const listRef = useRef<HTMLDivElement>(null);
    const forceRowMode = breakpoints.isNarrow || breakpoints.isTablet;
    const columnModeSetting = isColumnMode(mailSettings);
    const columnMode = columnModeSetting && !forceRowMode;
    const columnLayout = columnModeSetting || forceRowMode;

    const messageContainerRef = useRef<HTMLElement>(null);

    // Page state is hybrid: page number is handled by the url, total computed in useElements, size and limit are constants
    // Yet, it is simpler to co-localize all these data in one object
    const [page, setPage] = useState<Page>({
        page: pageFromUrl(location),
        total: 0,
        size: PAGE_SIZE,
    });

    const searchParams = getSearchParams(location.hash);
    const isConversationContentView = mailSettings.ViewMode === VIEW_MODE.GROUP;
    const searchParameters = useMemo<SearchParameters>(() => extractSearchParameters(location), [
        searchParams.address,
        searchParams.from,
        searchParams.to,
        searchParams.keyword,
        searchParams.begin,
        searchParams.end,
        searchParams.attachments,
        searchParams.wildcard,
    ]);
    const isSearch = testIsSearch(searchParameters);
    const sort = useMemo<Sort>(() => sortFromUrl(location), [searchParams.sort]);
    const filter = useMemo<Filter>(() => filterFromUrl(location), [searchParams.filter]);

    const handlePage = useCallback((pageNumber: number) => {
        history.push(setPageInUrl(history.location, pageNumber));
    }, []);
    const handleSort = useCallback((sort: Sort) => history.push(setSortInUrl(history.location, sort)), []);
    const handleFilter = useCallback((filter: Filter) => history.push(setFilterInUrl(history.location, filter)), []);

    const [isMessageOpening, setIsMessageOpening] = useState(false);

    const onMessageLoad = () => setIsMessageOpening(true);
    const onMessageReady = () => setIsMessageOpening(false);

    const { labelID, elements, loading, expectedLength, total } = useElements({
        conversationMode: isConversationMode(inputLabelID, mailSettings, location),
        labelID: inputLabelID,
        page: pageFromUrl(location),
        sort,
        filter,
        search: searchParameters,
        onPage: handlePage,
    });

    const handleBack = useCallback(() => history.push(setParamsInLocation(history.location, { labelID })), [labelID]);

    useEffect(() => setPage({ ...page, page: pageFromUrl(location) }), [searchParams.page]);
    useEffect(() => setPage({ ...page, total }), [total]);

    useMailboxPageTitle(labelID, location);

    const elementIDs = useDeepMemo(() => {
        return elements.map((element) => element.ID || '');
    }, [elements]);

    const {
        checkedIDs,
        selectedIDs,
        handleCheck,
        handleCheckAll,
        handleCheckOne,
        handleCheckOnlyOne,
        handleCheckRange,
    } = useItemsSelection(elementID, elementIDs, [elementID, labelID]);

    useNewEmailNotification(() => handleCheckAll(false));

    // Launch two calendar-specific API calls here to boost calendar widget performance
    useCalendars();
    useCalendarUserSettings();

    const showToolbar = !breakpoints.isNarrow || !elementID;
    const showList = columnMode || !elementID;
    const showContentPanel = (columnMode && !!expectedLength) || !!elementID;
    const showPlaceholder = !breakpoints.isNarrow && (!elementID || !!checkedIDs.length);
    const showContentView = showContentPanel && !!elementID;
    const elementIDForList = checkedIDs.length ? undefined : elementID;

    const { focusIndex, getFocusedId, setFocusIndex, handleFocus, focusOnLastMessage } = useMailboxFocus({
        elementIDs,
        showList,
        listRef,
        labelID,
        isComposerOpened,
    });

    const welcomeFlag = useWelcomeFlag([labelID, selectedIDs.length]);

    const handleElement = useCallback(
        (elementID: string | undefined, preventComposer = false) => {
            // Using the getter to prevent having elements in dependency of the callback
            const [element] = getElementsFromIDs([elementID || '']);

            if (isMessage(element) && isDraft(element) && !preventComposer) {
                onCompose({
                    existingDraft: { localID: element.ID as string, data: element as Message },
                    fromUndo: false,
                });
            }
            if (isConversationContentView && isMessage(element)) {
                onMessageLoad();
                history.push(
                    setParamsInLocation(history.location, {
                        labelID,
                        elementID: (element as Message).ConversationID,
                        messageID: element.ID,
                    })
                );
            } else {
                onMessageLoad();
                history.push(setParamsInLocation(history.location, { labelID, elementID: element.ID }));
            }
            handleCheckAll(false);
        },
        [onCompose, isConversationContentView, labelID]
    );

    const conversationMode = isConversationMode(labelID, mailSettings, location);

    const { elementRef, labelDropdownToggleRef, moveDropdownToggleRef } = useMailboxHotkeys(
        {
            labelID,
            elementID,
            messageID,
            elementIDs,
            checkedIDs,
            selectedIDs,
            focusIndex,
            columnLayout,
            isMessageOpening,
            location,
        },
        {
            focusOnLastMessage,
            getFocusedId,
            handleBack,
            handleCheck,
            handleCheckOnlyOne,
            handleCheckRange,
            handleElement,
            handleFilter,
            handleCheckAll,
            setFocusIndex,
        }
    );

    return (
        <div ref={elementRef} tabIndex={-1} className="flex-item-fluid flex flex-column flex-nowrap no-outline">
            {showToolbar && (
                <Toolbar
                    labelID={labelID}
                    elementID={elementID}
                    messageID={messageID}
                    selectedIDs={selectedIDs}
                    checkedIDs={checkedIDs}
                    elementIDs={elementIDs}
                    mailSettings={mailSettings}
                    columnMode={columnMode}
                    conversationMode={conversationMode}
                    breakpoints={breakpoints}
                    onCheck={handleCheck}
                    page={page}
                    onPage={handlePage}
                    onBack={handleBack}
                    onElement={handleElement}
                    labelDropdownToggleRef={labelDropdownToggleRef}
                    moveDropdownToggleRef={moveDropdownToggleRef}
                    location={location}
                />
            )}
            <PrivateMainArea className="flex" hasToolbar={showToolbar} hasRowMode={!showContentPanel}>
                {showList && (
                    <List
                        ref={listRef}
                        conversationMode={conversationMode}
                        labelID={labelID}
                        loading={loading}
                        expectedLength={expectedLength}
                        columnLayout={columnLayout}
                        mailSettings={mailSettings}
                        elementID={elementIDForList}
                        elements={elements}
                        checkedIDs={checkedIDs}
                        onCheck={handleCheck}
                        onClick={handleElement}
                        userSettings={userSettings}
                        isSearch={isSearch}
                        breakpoints={breakpoints}
                        page={page}
                        onPage={handlePage}
                        onFocus={handleFocus}
                        onCheckOne={handleCheckOne}
                        sort={sort}
                        onSort={handleSort}
                        filter={filter}
                        onFilter={handleFilter}
                    />
                )}
                {showContentPanel && (
                    <section
                        ref={messageContainerRef}
                        className="view-column-detail flex-no-min-children flex-column flex-item-fluid flex-nowrap scroll-if-needed relative"
                    >
                        {showPlaceholder && (
                            <PlaceholderView
                                welcomeFlag={welcomeFlag}
                                labelID={labelID}
                                checkedIDs={checkedIDs}
                                onCheckAll={handleCheckAll}
                            />
                        )}
                        {showContentView &&
                            (isConversationContentView ? (
                                <ConversationView
                                    hidden={showPlaceholder}
                                    labelID={labelID}
                                    messageID={messageID}
                                    mailSettings={mailSettings}
                                    conversationID={elementID as string}
                                    onBack={handleBack}
                                    onCompose={onCompose}
                                    breakpoints={breakpoints}
                                    onMessageReady={onMessageReady}
                                    columnLayout={columnLayout}
                                    isComposerOpened={isComposerOpened}
                                    containerRef={messageContainerRef}
                                />
                            ) : (
                                <MessageOnlyView
                                    hidden={showPlaceholder}
                                    labelID={labelID}
                                    mailSettings={mailSettings}
                                    messageID={elementID as string}
                                    onBack={handleBack}
                                    onCompose={onCompose}
                                    breakpoints={breakpoints}
                                    onMessageReady={onMessageReady}
                                    columnLayout={columnLayout}
                                    isComposerOpened={isComposerOpened}
                                />
                            ))}
                    </section>
                )}
            </PrivateMainArea>
        </div>
    );
};

export default memo(MailboxContainer);
