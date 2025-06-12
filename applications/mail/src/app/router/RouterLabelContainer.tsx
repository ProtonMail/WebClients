import { useCallback, useRef } from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';

import { Commander, useActiveBreakpoint, useDrawer, useModalState } from '@proton/components';
import { useFolders } from '@proton/mail/index';
import { getFolderName } from '@proton/mail/labels/helpers';
import clsx from '@proton/utils/clsx';

import MailboxList from 'proton-mail/components/list/MailboxList';
import ResizableWrapper from 'proton-mail/components/list/ResizableWrapper';
import { ResizeHandlePosition } from 'proton-mail/components/list/ResizeHandle';
import type { SOURCE_ACTION } from 'proton-mail/components/list/useListTelemetry';
import { ROUTE_ELEMENT } from 'proton-mail/constants';
import MailboxContainerPlaceholder from 'proton-mail/containers/mailbox/MailboxContainerPlaceholder';
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
import type { MailboxActions, RouterNavigation } from './interface';

interface Props {
    params: ElementsStateParams;
    navigation: RouterNavigation;
    elementsData: ElementsStructure;
    actions: MailboxActions;
    hasRowMode?: boolean;
}

export const RouterLabelContainer = ({ params, navigation, elementsData, actions, hasRowMode = false }: Props) => {
    const { sort, filter, labelID, elementID, messageID } = params;
    const { handleBack, page, handleFilter } = navigation;
    const { elements, elementIDs, loading, placeholderCount } = elementsData;
    const {
        handleElement,
        isMessageOpening,
        checkedIDs,
        selectedIDs,
        handleCheck,
        handleCheckOnlyOne,
        handleCheckRange,
        handleCheckAll,
        deleteAllModal,
        deleteSelectionModal,
        selectAllMarkModal,
        moveToSpamModal,
        moveSnoozedModal,
        moveScheduledModal,
        selectAllMoveModal,
    } = actions;

    const listRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    const { columnMode, columnLayout, labelDropdownToggleRef, resizeAreaRef, moveDropdownToggleRef } =
        useMailboxLayoutProvider();
    const composersCount = useMailSelector(selectComposersCount);
    const breakpoints = useActiveBreakpoint();

    const [commanderModalProps, showCommander, commanderRender] = useModalState();
    const welcomeFlag = useWelcomeFlag([labelID, selectedIDs.length]);
    const { appInView: isDrawerOpen } = useDrawer();

    const [folders] = useFolders();
    const getElementsFromIDs = useGetElementsFromIDs();

    const showList = columnMode || !elementID;
    const elementsLength = loading ? placeholderCount : elements.length;
    const showContentPanel = (columnMode && !!elementsLength) || !!elementID;
    const showContentView = showContentPanel && !!elementID;
    const isComposerOpened = composersCount > 0;
    const showPlaceholder =
        !breakpoints.viewportWidth['<=small'] && (!elementID || (!!checkedIDs.length && columnMode));

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
        moveScheduledModal: hotkeyMoveScheduledModal,
        moveSnoozedModal: hotkeyMoveSnoozedModal,
        moveToSpamModal: hotkeyMoveToSpamModal,
        deleteSelectionModal: hotkeyDeleteSelectionShortcutModal,
        deleteAllModal: hotkeyDeleteAllShortcutModal,
        selectAllMoveModal: hotkeySelectAllMoveModal,
        selectAllMarkModal: hotkeyMarkAllModal,
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
            if (selectedIDs.includes(elementID || '')) {
                handleBack();
            }
        },
        [selectedIDs, elementID, labelID, folders, handleBack, selectAll]
    );

    return (
        <div
            ref={elementRef}
            tabIndex={-1}
            className="flex flex-1 flex-nowrap outline-none relative"
            data-testid="mailbox"
        >
            <ResizableWrapper
                resizeHandlePosition={ResizeHandlePosition.RIGHT}
                minWidth={360}
                maxRatio={isDrawerOpen ? 0.3 : 0.5}
                className="view-column-detail"
                resizeHandleRef={resizeAreaRef}
                persistKey="messageListRatio"
                drawerKey="messageListRatioWithDrawer"
                resizingDisabled={hasRowMode || !showContentPanel}
            >
                <MailboxList
                    actions={actions}
                    elementsData={elementsData}
                    toolbar={
                        <MailboxToolbar
                            inHeader
                            params={params}
                            navigation={navigation}
                            elementsData={elementsData}
                            actions={{ ...actions, handleMove }}
                        />
                    }
                    listRef={listRef}
                    noBorder={hasRowMode || !showContentPanel}
                />
            </ResizableWrapper>

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
            {deleteAllModal}
            {moveToSpamModal}
            {moveSnoozedModal}
            {moveScheduledModal}
            {selectAllMoveModal}
            {selectAllMarkModal}
            {deleteSelectionModal}
            {hotkeyMarkAllModal}
            {hotkeyMoveToSpamModal}
            {hotkeyMoveSnoozedModal}
            {hotkeyMoveScheduledModal}
            {hotkeySelectAllMoveModal}
            {hotkeyDeleteAllShortcutModal}
            {hotkeyDeleteSelectionShortcutModal}
        </div>
    );
};
