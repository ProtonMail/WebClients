import { type RefObject, useCallback, useRef } from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';

import { useUserSettings } from '@proton/account';
import { Commander, useActiveBreakpoint, useModalState } from '@proton/components';
import { useFolders } from '@proton/mail/index';
import { getFolderName } from '@proton/mail/labels/helpers';
import clsx from '@proton/utils/clsx';

import List from 'proton-mail/components/list/List';
import { type SOURCE_ACTION } from 'proton-mail/components/list/useListTelemetry';
import useScrollToTop from 'proton-mail/components/list/useScrollToTop';
import { ROUTE_ELEMENT } from 'proton-mail/constants';
import MailboxContainerPlaceholder from 'proton-mail/containers/mailbox/MailboxContainerPlaceholder';
import { usePermanentDelete } from 'proton-mail/hooks/actions/delete/usePermanentDelete';
import { useMarkAs } from 'proton-mail/hooks/actions/markAs/useMarkAs';
import { useMailCommander } from 'proton-mail/hooks/commander/useMailCommander';
import { type ElementsStructure, useGetElementsFromIDs } from 'proton-mail/hooks/mailbox/useElements';
import { useMailboxFocus } from 'proton-mail/hooks/mailbox/useMailboxFocus';
import { useMailboxHotkeys } from 'proton-mail/hooks/mailbox/useMailboxHotkeys';
import { useWelcomeFlag } from 'proton-mail/hooks/mailbox/useWelcomeFlag';
import { selectComposersCount } from 'proton-mail/store/composers/composerSelectors';
import { type ElementsStateParams } from 'proton-mail/store/elements/elementsTypes';
import { useMailSelector } from 'proton-mail/store/hooks';

import { RouterElementContainer } from './RouterElementContainer';
import { useMailboxLayoutProvider } from './components/MailboxLayoutContext';
import { MailboxToolbar } from './components/MailboxToolbar';
import { useGetElementParams } from './hooks/useGetElementParams';
import type { MailboxActions, RouterNavigation } from './interface';

interface Props {
    params: ElementsStateParams;
    navigation: RouterNavigation;
    elementsData: ElementsStructure;
    actions: MailboxActions;
}

export const RouterLabelContainer = ({ params, navigation, elementsData, actions }: Props) => {
    const { isSearching, conversationMode, sort, filter, labelID, elementID, messageID } = params;
    const { handlePage, handleBack, page, handleFilter } = navigation;
    const { elements, elementIDs, loading, placeholderCount, total } = elementsData;
    const {
        handleElement,
        handleMarkAs,
        handleDelete,
        isMessageOpening,
        checkedIDs,
        selectedIDs,
        handleCheck,
        handleCheckOne,
        handleCheckOnlyOne,
        handleCheckRange,
        handleCheckAll,
    } = actions;

    const listRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    const {
        columnMode,
        columnLayout,
        listContainerRef,
        resizeAreaRef,
        resize,
        labelDropdownToggleRef,
        moveDropdownToggleRef,
    } = useMailboxLayoutProvider();

    const composersCount = useMailSelector(selectComposersCount);

    const [userSettings] = useUserSettings();
    const breakpoints = useActiveBreakpoint();

    const [commanderModalProps, showCommander, commanderRender] = useModalState();
    const { deleteSelectionModal, deleteAllModal } = usePermanentDelete(labelID);
    const { selectAllMarkModal } = useMarkAs();
    const welcomeFlag = useWelcomeFlag([labelID, selectedIDs.length]);

    const [folders] = useFolders();
    const getElementsFromIDs = useGetElementsFromIDs();

    const showList = columnMode || !elementID;
    const elementsLength = loading ? placeholderCount : elements.length;
    const showContentPanel = (columnMode && !!elementsLength) || !!elementID;
    const showContentView = showContentPanel && !!elementID;
    const isComposerOpened = composersCount > 0;
    const showPlaceholder =
        !breakpoints.viewportWidth['<=small'] && (!elementID || (!!checkedIDs.length && columnMode));

    const elementParams = useGetElementParams({ params, navigation });
    useScrollToTop(listRef as RefObject<HTMLElement>, [page, labelID, sort, filter, elementParams.search]);

    const { commanderList } = useMailCommander();

    const { focusID, setFocusID, focusLastID, focusFirstID, focusNextID, focusPreviousID } = useMailboxFocus({
        elementIDs,
        page,
        filter,
        sort,
        showList,
        listRef,
        labelID,
        isComposerOpened,
        loading,
    });

    const {
        moveToFolder,
        selectAll,
        elementRef,
        moveScheduledModal,
        moveSnoozedModal,
        moveToSpamModal,
        deleteSelectionModal: deleteSelectionShortcutModal,
        deleteAllModal: deleteAllShortcutModal,
        selectAllMoveModal,
        selectAllMarkModal: markAllModal,
    } = useMailboxHotkeys(
        {
            labelID,
            elementID,
            messageID,
            elementIDs,
            checkedIDs,
            selectedIDs,
            focusID,
            columnLayout,
            isMessageOpening,
            location,
            labelDropdownToggleRefProps: labelDropdownToggleRef,
            moveDropdownToggleRefProps: moveDropdownToggleRef,
        },
        {
            focusLastID,
            focusFirstID,
            focusNextID,
            focusPreviousID,
            handleBack,
            handleCheck,
            handleCheckOnlyOne,
            handleCheckRange,
            handleElement,
            handleFilter,
            handleCheckAll,
            setFocusID,
            showCommander,
        }
    );

    const handleMove = useCallback(
        async (newLabelID: string, sourceAction: SOURCE_ACTION): Promise<void> => {
            const folderName = getFolderName(newLabelID, folders);
            const elements = getElementsFromIDs(selectedIDs);
            await moveToFolder({
                elements,
                sourceLabelID: labelID,
                destinationLabelID: newLabelID,
                folderName,
                selectAll,
                sourceAction: sourceAction,
            });
        },
        [selectedIDs, elementID, labelID, folders, selectAll]
    );

    const handleFocus = useCallback(
        (elementID: string) => {
            setFocusID(elementID);
        },
        [setFocusID]
    );

    return (
        <div ref={elementRef} tabIndex={-1} className="flex flex-1 flex-nowrap outline-none" data-testid="mailbox">
            <List
                ref={listRef}
                listContainerRef={listContainerRef}
                show={showList}
                conversationMode={conversationMode}
                labelID={labelID}
                loading={loading}
                placeholderCount={placeholderCount}
                columnLayout={columnLayout}
                elementID={elementID}
                elements={elements}
                checkedIDs={checkedIDs}
                onCheck={handleCheck}
                onClick={handleElement}
                isSearch={isSearching}
                breakpoints={breakpoints}
                page={page}
                total={total}
                onPage={handlePage}
                onFocus={handleFocus}
                onCheckOne={handleCheckOne}
                filter={filter}
                resizeAreaRef={resizeAreaRef}
                enableResize={resize.enableResize}
                resetWidth={resize.resetWidth}
                showContentPanel={showContentPanel}
                scrollBarWidth={resize.scrollBarWidth}
                onMarkAs={handleMarkAs}
                onDelete={handleDelete}
                onMove={handleMove}
                onBack={handleBack}
                userSettings={userSettings}
                toolbar={
                    <MailboxToolbar
                        params={params}
                        navigation={navigation}
                        elementsData={elementsData}
                        // TODO improve this in the future, we should use the `handleMove` from the actions and not duplicate the code
                        actions={{ ...actions, handleMove }}
                    />
                }
                onCheckAll={handleCheckAll}
            />

            <section
                className={clsx([
                    'view-column-detail flex flex-column flex-1 *:min-size-auto flex-nowrap relative',
                    !showContentPanel && 'hidden',
                    showContentView ? 'overflow-hidden' : 'overflow-auto',
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
                <Switch>
                    <Route
                        path={ROUTE_ELEMENT}
                        render={() => (
                            <RouterElementContainer
                                params={params}
                                navigation={navigation}
                                elementsData={elementsData}
                                actions={actions}
                            />
                        )}
                    />
                </Switch>
            </section>
            {commanderRender ? <Commander list={commanderList} {...commanderModalProps} /> : null}
            {deleteSelectionModal}
            {deleteAllModal}
            {deleteSelectionShortcutModal}
            {deleteAllShortcutModal}
            {moveScheduledModal}
            {moveSnoozedModal}
            {moveToSpamModal}
            {selectAllMoveModal}
            {selectAllMarkModal}
            {markAllModal}
        </div>
    );
};
