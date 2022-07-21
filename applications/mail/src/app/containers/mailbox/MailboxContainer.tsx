import { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import {
    classnames,
    ErrorBoundary,
    FeatureCode,
    PrivateMainArea,
    useCalendars,
    useCalendarUserSettings,
    useFeature,
    useFolders,
    useItemsSelection,
    useLabels,
} from '@proton/components';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { isDraft } from '@proton/shared/lib/mail/messages';
import { MAILBOX_LABEL_IDS, VIEW_MODE } from '@proton/shared/lib/constants';
import { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import { getSearchParams } from '@proton/shared/lib/helpers/url';
import { Sort, Filter, SearchParameters } from '../../models/tools';
import { Element } from '../../models/element';
import { useMailboxPageTitle } from '../../hooks/mailbox/useMailboxPageTitle';
import { useElements, useGetElementsFromIDs } from '../../hooks/mailbox/useElements';
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
import { MAILTO_PROTOCOL_HANDLER_SEARCH_PARAM } from '../../constants';
import { isMessage, isSearch as testIsSearch } from '../../helpers/elements';
import { Breakpoints } from '../../models/utils';
import { useWelcomeFlag } from '../../hooks/mailbox/useWelcomeFlag';
import useNewEmailNotification from '../../hooks/mailbox/useNewEmailNotification';
import { useDeepMemo } from '../../hooks/useDeepMemo';
import { useMailboxHotkeys } from '../../hooks/mailbox/useMailboxHotkeys';
import { useMailboxFocus } from '../../hooks/mailbox/useMailboxFocus';
import { useOnCompose, useOnMailTo } from '../ComposeProvider';
import { useResizeMessageView } from '../../hooks/useResizeMessageView';
import { useApplyEncryptedSearch } from '../../hooks/mailbox/useApplyEncryptedSearch';
import { MailboxContainerContextProvider } from './MailboxContainerProvider';
import ItemContextMenu from '../../components/list/ItemContextMenu';
import { MARK_AS_STATUS, useMarkAs } from '../../hooks/useMarkAs';
import { usePermanentDelete } from '../../hooks/usePermanentDelete';
import { getFolderName } from '../../helpers/labels';

interface Props {
    labelID: string;
    userSettings: UserSettings;
    mailSettings: MailSettings;
    breakpoints: Breakpoints;
    elementID?: string;
    messageID?: string;
    isComposerOpened: boolean;
}

const MailboxContainer = ({
    labelID: inputLabelID,
    userSettings,
    mailSettings,
    breakpoints,
    elementID,
    messageID,
    isComposerOpened,
}: Props) => {
    const location = useLocation();
    const history = useHistory();
    const [labels] = useLabels();
    const [folders] = useFolders();
    const [isContextMenuOpen, setIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number }>();
    const getElementsFromIDs = useGetElementsFromIDs();
    const markAs = useMarkAs();
    const { feature: mailContextMenuFeature } = useFeature<boolean>(FeatureCode.MailContextMenu);
    const listRef = useRef<HTMLDivElement>(null);
    const forceRowMode = breakpoints.isNarrow || breakpoints.isTablet;
    const columnModeSetting = isColumnMode(mailSettings);
    const columnMode = columnModeSetting && !forceRowMode;
    const columnLayout = columnModeSetting || forceRowMode;
    const labelIDs = (labels || []).map(({ ID }) => ID);
    const messageContainerRef = useRef<HTMLElement>(null);
    const mainAreaRef = useRef<HTMLDivElement>(null);
    const resizeAreaRef = useRef<HTMLButtonElement>(null);

    const onMailTo = useOnMailTo();

    const { enableResize, resetWidth, scrollBarWidth, isResizing } = useResizeMessageView(
        mainAreaRef,
        resizeAreaRef,
        listRef
    );

    const page = pageFromUrl(location);
    const searchParams = getSearchParams(location.hash);
    const isConversationContentView = mailSettings.ViewMode === VIEW_MODE.GROUP;
    const searchParameters = useDeepMemo<SearchParameters>(() => extractSearchParameters(location), [location]);
    const isSearch = testIsSearch(searchParameters);
    const sort = useMemo<Sort>(() => sortFromUrl(location, inputLabelID), [searchParams.sort, inputLabelID]);
    const filter = useMemo<Filter>(() => filterFromUrl(location), [searchParams.filter]);

    // Open a composer when the url contains a mailto query
    useEffect(() => {
        if (!isSearch && location.hash) {
            const searchParams = location.hash.substring(1).split('&');
            searchParams.forEach((param) => {
                const pair = param.split('=');
                if (pair[0] === MAILTO_PROTOCOL_HANDLER_SEARCH_PARAM) {
                    try {
                        onMailTo(decodeURIComponent(pair[1]));
                    } catch (e: any) {
                        console.error(e);
                    }
                }
            });
        }
    }, [location.hash, isSearch]);

    const handlePage = useCallback((pageNumber: number) => {
        history.push(setPageInUrl(history.location, pageNumber));
    }, []);
    const handleSort = useCallback((sort: Sort) => history.push(setSortInUrl(history.location, sort)), []);
    const handleFilter = useCallback((filter: Filter) => history.push(setFilterInUrl(history.location, filter)), []);

    const [isMessageOpening, setIsMessageOpening] = useState(false);

    const onMessageLoad = () => setIsMessageOpening(true);
    const onMessageReady = useCallback(() => setIsMessageOpening(false), [setIsMessageOpening]);

    const elementsParams = {
        conversationMode: isConversationMode(inputLabelID, mailSettings, location),
        labelID: inputLabelID,
        page: pageFromUrl(location),
        sort,
        filter,
        search: searchParameters,
        onPage: handlePage,
    };

    const { labelID, elements, elementIDs, loading, placeholderCount, total } = useElements(elementsParams);
    const { handleDelete: permanentDelete, modal: deleteModal } = usePermanentDelete(labelID);
    useApplyEncryptedSearch(elementsParams);

    const handleBack = useCallback(() => history.push(setParamsInLocation(history.location, { labelID })), [labelID]);

    const onCompose = useOnCompose();

    useMailboxPageTitle(labelID, location);

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

    const elementsLength = loading ? placeholderCount : elements.length;
    const showToolbar = !breakpoints.isNarrow || !elementID;
    const showList = columnMode || !elementID;
    const showContentPanel = (columnMode && !!elementsLength) || !!elementID;
    const showPlaceholder = !breakpoints.isNarrow && (!elementID || !!checkedIDs.length);
    const showContentView = showContentPanel && !!elementID;
    const elementIDForList = checkedIDs.length ? undefined : elementID;

    const { focusIndex, getFocusedId, setFocusIndex, handleFocus, focusOnLastMessage } = useMailboxFocus({
        elementIDs,
        page,
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

    const handleMarkAs = useCallback(
        async (status: MARK_AS_STATUS) => {
            const isUnread = status === MARK_AS_STATUS.UNREAD;
            const elements = getElementsFromIDs(selectedIDs);
            if (isUnread) {
                handleBack();
            }
            await markAs(elements, labelID, status);
        },
        [selectedIDs, labelID, handleBack]
    );

    const handleDelete = useCallback(async () => {
        await permanentDelete(selectedIDs);
    }, [selectedIDs, permanentDelete]);

    const closeContextMenu = useCallback(() => setIsOpen(false), [setIsOpen]);
    const openContextMenu = useCallback(() => setIsOpen(true), [setIsOpen]);

    const handleContextMenu = useCallback(
        (e: React.MouseEvent<HTMLDivElement>, element: Element) => {
            e.stopPropagation();
            e.preventDefault();

            if (!checkedIDs.includes(element.ID)) {
                handleCheck([element.ID], true, true);
            }

            setContextMenuPosition({ top: e.clientY, left: e.clientX });
            openContextMenu();
        },
        [checkedIDs]
    );

    const conversationMode = isConversationMode(labelID, mailSettings, location);

    const {
        elementRef,
        labelDropdownToggleRef,
        moveDropdownToggleRef,
        moveScheduledModal,
        moveAllModal,
        moveToSpamModal,
        permanentDeleteModal,
        moveToFolder,
    } = useMailboxHotkeys(
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

    const handleMove = useCallback(
        async (LabelID: string) => {
            const folderName = getFolderName(LabelID, folders);
            const fromLabelID = labelIDs.includes(labelID) ? MAILBOX_LABEL_IDS.INBOX : labelID;
            const elements = getElementsFromIDs(selectedIDs);
            await moveToFolder(elements, LabelID, folderName, fromLabelID);
            if (selectedIDs.includes(elementID || '')) {
                handleBack();
            }
        },
        [selectedIDs, elementID, labelID, labelIDs, folders, handleBack]
    );

    return (
        <MailboxContainerContextProvider
            isResizing={isResizing}
            containerRef={messageContainerRef}
            elementID={elementID}
        >
            <div
                ref={elementRef}
                tabIndex={-1}
                className="flex-item-fluid flex flex-column flex-nowrap outline-none"
                data-testid="mailbox"
            >
                {showToolbar && (
                    <ErrorBoundary small>
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
                            total={total}
                            onPage={handlePage}
                            onBack={handleBack}
                            onElement={handleElement}
                            labelDropdownToggleRef={labelDropdownToggleRef}
                            moveDropdownToggleRef={moveDropdownToggleRef}
                            location={location}
                            labels={labels}
                            folders={folders}
                            onMarkAs={handleMarkAs}
                            onMove={handleMove}
                            onDelete={handleDelete}
                        />
                    </ErrorBoundary>
                )}
                <PrivateMainArea
                    className="flex"
                    hasToolbar={showToolbar}
                    hasRowMode={!showContentPanel}
                    ref={mainAreaRef}
                >
                    <ErrorBoundary>
                        <List
                            ref={listRef}
                            show={showList}
                            conversationMode={conversationMode}
                            labelID={labelID}
                            loading={loading}
                            placeholderCount={placeholderCount}
                            columnLayout={columnLayout}
                            mailSettings={mailSettings}
                            labels={labels}
                            elementID={elementIDForList}
                            elements={elements}
                            checkedIDs={checkedIDs}
                            onCheck={handleCheck}
                            onClick={handleElement}
                            onContextMenu={handleContextMenu}
                            userSettings={userSettings}
                            isSearch={isSearch}
                            breakpoints={breakpoints}
                            page={page}
                            total={total}
                            onPage={handlePage}
                            onFocus={handleFocus}
                            onCheckOne={handleCheckOne}
                            sort={sort}
                            onSort={handleSort}
                            filter={filter}
                            onFilter={handleFilter}
                            resizeAreaRef={resizeAreaRef}
                            enableResize={enableResize}
                            resetWidth={resetWidth}
                            showContentPanel={showContentPanel}
                            scrollBarWidth={scrollBarWidth}
                        />
                    </ErrorBoundary>
                    <ErrorBoundary>
                        <section
                            className={classnames([
                                'view-column-detail flex flex-column flex-item-fluid flex-nowrap relative',
                                !showContentPanel && 'hidden',
                                showContentView ? 'no-scroll' : 'scroll-if-needed',
                            ])}
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
                                        breakpoints={breakpoints}
                                        onMessageReady={onMessageReady}
                                        columnLayout={columnLayout}
                                        isComposerOpened={isComposerOpened}
                                    />
                                ))}
                        </section>
                    </ErrorBoundary>
                </PrivateMainArea>
            </div>
            {permanentDeleteModal}
            {moveScheduledModal}
            {moveAllModal}
            {moveToSpamModal}
            {deleteModal}
            {mailContextMenuFeature?.Value ? (
                <ItemContextMenu
                    elementID={elementID}
                    labels={labels}
                    folders={folders}
                    mailSettings={mailSettings}
                    anchorRef={listRef}
                    isOpen={isContextMenuOpen}
                    checkedIDs={checkedIDs}
                    labelID={labelID}
                    open={openContextMenu}
                    close={closeContextMenu}
                    position={contextMenuPosition}
                    onMarkAs={handleMarkAs}
                    onMove={handleMove}
                    onDelete={handleDelete}
                />
            ) : null}
        </MailboxContainerContextProvider>
    );
};

export default memo(MailboxContainer);
