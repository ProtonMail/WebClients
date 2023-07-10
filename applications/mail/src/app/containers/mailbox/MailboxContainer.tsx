import { RefObject, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import {
    Commander,
    CommanderItemInterface,
    ErrorBoundary,
    PrivateMainArea,
    useCalendarUserSettings,
    useCalendars,
    useFolders,
    useItemsSelection,
    useLabels,
    useModalState,
} from '@proton/components';
import { useCalendarsInfoCoreListener } from '@proton/components/containers/eventManager/calendar/useCalendarsInfoListener';
import { MAILBOX_LABEL_IDS, SHOW_MOVED, VIEW_MODE } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { getSearchParams } from '@proton/shared/lib/helpers/url';
import { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { isDraft } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import ConversationView from '../../components/conversation/ConversationView';
import List from '../../components/list/List';
import useScrollToTop from '../../components/list/useScrollToTop';
import MessageOnlyView from '../../components/message/MessageOnlyView';
import { useLabelActionsContext } from '../../components/sidebar/EditLabelContext';
import Toolbar from '../../components/toolbar/Toolbar';
import { LABEL_IDS_TO_HUMAN, MAILTO_PROTOCOL_HANDLER_SEARCH_PARAM, MESSAGE_ACTIONS } from '../../constants';
import { isMessage, isSearch as testIsSearch } from '../../helpers/elements';
import { getFolderName } from '../../helpers/labels';
import { isColumnMode, isConversationMode } from '../../helpers/mailSettings';
import {
    extractSearchParameters,
    filterFromUrl,
    pageFromUrl,
    setFilterInUrl,
    setPageInUrl,
    setParamsInLocation,
    setSortInUrl,
    sortFromUrl,
} from '../../helpers/mailboxUrl';
import { MARK_AS_STATUS, useMarkAs } from '../../hooks/actions/useMarkAs';
import { usePermanentDelete } from '../../hooks/actions/usePermanentDelete';
import { ComposeTypes } from '../../hooks/composer/useCompose';
import { useApplyEncryptedSearch } from '../../hooks/mailbox/useApplyEncryptedSearch';
import { useElements, useGetElementsFromIDs } from '../../hooks/mailbox/useElements';
import { useMailboxFavicon } from '../../hooks/mailbox/useMailboxFavicon';
import { useMailboxFocus } from '../../hooks/mailbox/useMailboxFocus';
import { useMailboxHotkeys } from '../../hooks/mailbox/useMailboxHotkeys';
import { useMailboxPageTitle } from '../../hooks/mailbox/useMailboxPageTitle';
import useNewEmailNotification from '../../hooks/mailbox/useNewEmailNotification';
import usePreLoadElements from '../../hooks/mailbox/usePreLoadElements';
import { useWelcomeFlag } from '../../hooks/mailbox/useWelcomeFlag';
import { useDeepMemo } from '../../hooks/useDeepMemo';
import { useResizeMessageView } from '../../hooks/useResizeMessageView';
import { selectComposersCount } from '../../logic/composers/composerSelectors';
import { useAppSelector } from '../../logic/store';
import { Filter, SearchParameters, Sort } from '../../models/tools';
import { Breakpoints } from '../../models/utils';
import { useOnCompose, useOnMailTo } from '../ComposeProvider';
import MailboxContainerPlaceholder from './MailboxContainerPlaceholder';
import { MailboxContainerContextProvider } from './MailboxContainerProvider';

interface Props {
    labelID: string;
    mailSettings: MailSettings;
    userSettings: UserSettings;
    breakpoints: Breakpoints;
    elementID?: string;
    messageID?: string;
    toolbarBordered?: boolean;
}

const MailboxContainer = ({
    labelID: inputLabelID,
    mailSettings,
    userSettings,
    breakpoints,
    elementID,
    messageID,
    toolbarBordered,
}: Props) => {
    const location = useLocation();
    const history = useHistory();
    const [labels] = useLabels();
    const [folders] = useFolders();
    const { createLabel } = useLabelActionsContext();
    const getElementsFromIDs = useGetElementsFromIDs();
    const markAs = useMarkAs();
    const listRef = useRef<HTMLDivElement>(null);
    const forceRowMode = breakpoints.isNarrow || breakpoints.isTablet;
    const columnModeSetting = isColumnMode(mailSettings);
    const columnMode = columnModeSetting && !forceRowMode;
    const columnLayout = columnModeSetting || forceRowMode;
    const labelIDs = (labels || []).map(({ ID }) => ID);
    const messageContainerRef = useRef<HTMLElement>(null);
    const mainAreaRef = useRef<HTMLDivElement>(null);
    const resizeAreaRef = useRef<HTMLButtonElement>(null);
    const composersCount = useAppSelector(selectComposersCount);
    const isComposerOpened = composersCount > 0;

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

    const navigateTo = (labelID: MAILBOX_LABEL_IDS) => {
        history.push(`/${LABEL_IDS_TO_HUMAN[labelID]}`);
    };

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

    const handlePage = useCallback(
        (pageNumber: number) => {
            history.push(setPageInUrl(history.location, pageNumber));
        },
        [history]
    );
    const handleSort = useCallback((sort: Sort) => history.push(setSortInUrl(history.location, sort)), [history]);
    const handleFilter = useCallback(
        (filter: Filter) => history.push(setFilterInUrl(history.location, filter)),
        [history]
    );

    const [isMessageOpening, setIsMessageOpening] = useState(false);

    const onMessageLoad = useCallback(() => setIsMessageOpening(true), []);
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

    const handleBack = useCallback(
        () => history.push(setParamsInLocation(history.location, { labelID })),
        [history, labelID]
    );

    const onCompose = useOnCompose();

    useMailboxPageTitle(labelID, location);
    useMailboxFavicon(labelID, location);
    useScrollToTop(listRef as RefObject<HTMLElement>, [page, labelID, sort, filter, searchParameters]);

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
    // listen to calendar "core" updates
    useCalendarsInfoCoreListener();

    const elementsLength = loading ? placeholderCount : elements.length;
    const showToolbar = !breakpoints.isNarrow || !elementID;
    const showList = columnMode || !elementID;
    const showContentPanel = (columnMode && !!elementsLength) || !!elementID;
    const showPlaceholder = !breakpoints.isNarrow && (!elementID || !!checkedIDs.length);
    const showContentView = showContentPanel && !!elementID;
    const elementIDForList = checkedIDs.length ? undefined : elementID;
    const [commanderModalProps, showCommander, commanderRender] = useModalState();
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
                    type: ComposeTypes.existingDraft,
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
        [onCompose, isConversationContentView, labelID, history]
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

    const conversationMode = isConversationMode(labelID, mailSettings, location);

    usePreLoadElements({ elements, labelID, loading });

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
            showCommander,
        }
    );

    const handleMove = useCallback(
        async (LabelID: string) => {
            const folderName = getFolderName(LabelID, folders);
            const elements = getElementsFromIDs(selectedIDs);
            await moveToFolder(elements, LabelID, folderName, labelID, false);
            if (selectedIDs.includes(elementID || '')) {
                handleBack();
            }
        },
        [selectedIDs, elementID, labelID, labelIDs, folders, handleBack]
    );

    const commanderList = useMemo<CommanderItemInterface[]>(
        () => [
            {
                icon: 'envelope',
                label: c('Commander action').t`New message`,
                value: 'compose',
                action: () => onCompose({ type: ComposeTypes.newMessage, action: MESSAGE_ACTIONS.NEW }),
                shortcuts: ['N'],
            },
            {
                icon: 'tag',
                label: c('Commander action').t`Create a new label`,
                value: 'create-label',
                action: () => createLabel('label'),
            },
            {
                icon: 'folder',
                label: c('Commander action').t`Create a new folder`,
                value: 'create-folder',
                action: () => createLabel('folder'),
            },
            {
                icon: 'envelope-magnifying-glass',
                label: c('Commander action').t`Search`,
                value: 'search',
                action: () => {
                    const button = document.querySelector('[data-shorcut-target="searchbox-button"]') as HTMLElement;
                    button?.dispatchEvent(
                        new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: false,
                        })
                    );
                },
                shortcuts: ['/'],
            },
            {
                icon: 'inbox',
                label: c('Commander action').t`Go to Inbox`,
                value: 'inbox',
                action: () => navigateTo(MAILBOX_LABEL_IDS.INBOX),
                shortcuts: ['G', 'I'],
            },
            {
                icon: 'file-lines',
                label: c('Commander action').t`Go to Drafts`,
                value: 'drafts',
                action: () =>
                    navigateTo(
                        hasBit(mailSettings.ShowMoved, SHOW_MOVED.DRAFTS)
                            ? MAILBOX_LABEL_IDS.ALL_DRAFTS
                            : MAILBOX_LABEL_IDS.DRAFTS
                    ),
                shortcuts: ['G', 'D'],
            },
            {
                icon: 'paper-plane',
                label: c('Commander action').t`Go to Sent`,
                value: 'sent',
                action: () =>
                    navigateTo(
                        hasBit(mailSettings.ShowMoved, SHOW_MOVED.SENT)
                            ? MAILBOX_LABEL_IDS.ALL_SENT
                            : MAILBOX_LABEL_IDS.SENT
                    ),
                shortcuts: ['G', 'E'],
            },
            {
                icon: 'archive-box',
                label: c('Commander action').t`Go to Archive`,
                value: 'archive',
                action: () => navigateTo(MAILBOX_LABEL_IDS.ARCHIVE),
                shortcuts: ['G', 'A'],
            },
            {
                icon: 'star',
                label: c('Commander action').t`Go to Starred`,
                value: 'starred',
                action: () => navigateTo(MAILBOX_LABEL_IDS.STARRED),
                shortcuts: ['G', '*'],
            },
            {
                icon: 'fire',
                label: c('Commander action').t`Go to Spam`,
                value: 'spam',
                action: () => navigateTo(MAILBOX_LABEL_IDS.SPAM),
                shortcuts: ['G', 'S'],
            },
            {
                icon: 'trash',
                label: c('Commander action').t`Go to Trash`,
                value: 'trash',
                action: () => navigateTo(MAILBOX_LABEL_IDS.TRASH),
                shortcuts: ['G', 'T'],
            },
        ],
        []
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
                    <Toolbar
                        labelID={labelID}
                        elementID={elementID}
                        messageID={messageID}
                        selectedIDs={selectedIDs}
                        checkedIDs={checkedIDs}
                        elementIDs={elementIDs}
                        columnMode={columnMode}
                        conversationMode={conversationMode}
                        breakpoints={breakpoints}
                        onCheck={handleCheck}
                        page={page}
                        total={total}
                        isSearch={isSearch}
                        onPage={handlePage}
                        onBack={handleBack}
                        onElement={handleElement}
                        onMarkAs={handleMarkAs}
                        onMove={handleMove}
                        onDelete={handleDelete}
                        labelDropdownToggleRef={labelDropdownToggleRef}
                        moveDropdownToggleRef={moveDropdownToggleRef}
                        bordered={toolbarBordered}
                    />
                )}
                <PrivateMainArea
                    className="flex"
                    hasToolbar={showToolbar}
                    hasRowMode={!showContentPanel}
                    ref={mainAreaRef}
                >
                    <List
                        ref={listRef}
                        show={showList}
                        conversationMode={conversationMode}
                        labelID={labelID}
                        loading={loading}
                        placeholderCount={placeholderCount}
                        columnLayout={columnLayout}
                        elementID={elementIDForList}
                        elements={elements}
                        checkedIDs={checkedIDs}
                        onCheck={handleCheck}
                        onClick={handleElement}
                        isSearch={isSearch}
                        breakpoints={breakpoints}
                        page={page}
                        total={total}
                        onPage={handlePage}
                        onFocus={handleFocus}
                        onCheckOne={handleCheckOne}
                        filter={filter}
                        resizeAreaRef={resizeAreaRef}
                        enableResize={enableResize}
                        resetWidth={resetWidth}
                        showContentPanel={showContentPanel}
                        scrollBarWidth={scrollBarWidth}
                        onMarkAs={handleMarkAs}
                        onDelete={handleDelete}
                        onMove={handleMove}
                        onBack={handleBack}
                        mailSettings={mailSettings}
                        userSettings={userSettings}
                        sort={sort}
                        onSort={handleSort}
                        onFilter={handleFilter}
                    />
                    <ErrorBoundary>
                        <section
                            className={clsx([
                                'view-column-detail flex flex-column flex-item-fluid flex-nowrap relative',
                                !showContentPanel && 'hidden',
                                showContentView ? 'no-scroll' : 'scroll-if-needed',
                            ])}
                        >
                            {showPlaceholder && (
                                <MailboxContainerPlaceholder
                                    showPlaceholder={showContentPanel}
                                    welcomeFlag={welcomeFlag}
                                    labelID={labelID}
                                    checkedIDs={checkedIDs}
                                    handleCheckAll={handleCheckAll}
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
                                        elementIDs={elementIDs}
                                        loadingElements={loading}
                                        conversationMode={conversationMode}
                                    />
                                ) : (
                                    <MessageOnlyView
                                        hidden={showPlaceholder}
                                        labelID={labelID}
                                        elementIDs={elementIDs}
                                        loadingElements={loading}
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
            {commanderRender ? <Commander list={commanderList} {...commanderModalProps} /> : null}
            {permanentDeleteModal}
            {moveScheduledModal}
            {moveAllModal}
            {moveToSpamModal}
            {deleteModal}
        </MailboxContainerContextProvider>
    );
};

export default memo(MailboxContainer);
