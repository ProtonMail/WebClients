import { useCallback, useRef } from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Commander, useActiveBreakpoint, useModalState } from '@proton/components';
import { useFolders } from '@proton/mail/store/labels/hooks';
import clsx from '@proton/utils/clsx';

import { CategoriesTabs } from 'proton-mail/components/categoryView/categoriesTabs/CategoriesTabs';
import { useCategoriesView } from 'proton-mail/components/categoryView/useCategoriesView';
import MailboxList from 'proton-mail/components/list/MailboxList';
import { ResizableWrapper } from 'proton-mail/components/list/ResizableWrapper';
import { ResizeHandlePosition } from 'proton-mail/components/list/ResizeHandle';
import type { SOURCE_ACTION } from 'proton-mail/components/list/list-telemetry/useListTelemetry';
import { ROUTE_ELEMENT } from 'proton-mail/constants';
import MailboxContainerPlaceholder from 'proton-mail/containers/mailbox/MailboxContainerPlaceholder';
import { APPLY_LOCATION_TYPES } from 'proton-mail/hooks/actions/applyLocation/interface';
import { useApplyLocation } from 'proton-mail/hooks/actions/applyLocation/useApplyLocation';
import { useMailCommander } from 'proton-mail/hooks/commander/useMailCommander';
import { type ElementsStructure, useGetElementsFromIDs } from 'proton-mail/hooks/mailbox/useElements';
import { useMailboxFocus } from 'proton-mail/hooks/mailbox/useMailboxFocus';
import { useMailboxHotkeys } from 'proton-mail/hooks/mailbox/useMailboxHotkeys';
import { useWelcomeFlag } from 'proton-mail/hooks/mailbox/useWelcomeFlag';
import { DEFAULT_MIN_WIDTH_OF_MAILBOX_LIST } from 'proton-mail/hooks/useResizableUtils';
import { selectComposersCount } from 'proton-mail/store/composers/composerSelectors';
import type { ElementsStateParams } from 'proton-mail/store/elements/elementsTypes';
import { useMailSelector } from 'proton-mail/store/hooks';

import { getFolderName } from '../helpers/labels';
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
    onResizingChange?: (isResizing: boolean) => void;
}

export const RouterLabelContainer = ({
    params,
    navigation,
    elementsData,
    actions,
    hasRowMode = false,
    onResizingChange,
}: Props) => {
    const { sort, filter, labelID, elementID, messageID } = params;
    const { handleBack, page, handleFilter } = navigation;
    const { elements, elementIDs, loading } = elementsData;
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

    const {
        isColumnModeActive,
        isColumnLayoutPreferred,
        labelDropdownToggleRef,
        resizeAreaRef,
        moveDropdownToggleRef,
        scrollContainerRef,
    } = useMailboxLayoutProvider();

    const composersCount = useMailSelector(selectComposersCount);
    const breakpoints = useActiveBreakpoint();

    const categoryViewControl = useCategoriesView();

    const [commanderModalProps, showCommander, commanderRender] = useModalState();
    const welcomeFlag = useWelcomeFlag([labelID, selectedIDs.length]);

    const [folders] = useFolders();
    const getElementsFromIDs = useGetElementsFromIDs();

    const showList = isColumnModeActive || !elementID;
    const showContentPanel = isColumnModeActive || !!elementID;
    const showContentView = showContentPanel && !!elementID;
    const isComposerOpened = composersCount > 0;
    const showPlaceholder =
        (!breakpoints.viewportWidth['<=small'] && !elementID && elements.length) ||
        (!!checkedIDs.length && isColumnModeActive) ||
        (!elements.length && isColumnModeActive);

    const { commanderList } = useMailCommander();
    const { applyLocation } = useApplyLocation();

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
            columnLayout: isColumnLayoutPreferred,
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
            if (selectAll) {
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
            } else {
                await applyLocation({ type: APPLY_LOCATION_TYPES.MOVE, elements, destinationLabelID: newLabelID });
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-D39BF9
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
                containerRef={elementRef}
                maxRatio={0.5}
                // The MailboxList Toolbar is designed for 360px width
                minWidth={DEFAULT_MIN_WIDTH_OF_MAILBOX_LIST}
                defaultRatio={0.4}
                className="view-column-detail"
                resizeHandleRef={resizeAreaRef}
                persistKey="messageListRatio"
                resizingDisabled={hasRowMode || !showContentPanel}
                onResizingChange={onResizingChange}
            >
                <MailboxList
                    actions={actions}
                    elementsData={elementsData}
                    toolbar={
                        <>
                            <MailboxToolbar
                                params={params}
                                navigation={navigation}
                                elementsData={elementsData}
                                actions={{ ...actions, handleMove }}
                            />
                            {categoryViewControl.shouldShowTabs && <CategoriesTabs categoryLabelID={labelID} />}
                        </>
                    }
                    listRef={listRef}
                    scrollContainerRef={scrollContainerRef}
                    noBorder={hasRowMode || !showContentPanel}
                    setFocusID={setFocusID}
                />
            </ResizableWrapper>

            <section
                className={clsx([
                    'view-column-detail flex flex-column flex-1 *:min-size-auto flex-nowrap relative',
                    !showContentPanel && 'hidden',
                    showContentView ? 'overflow-hidden' : 'overflow-auto',
                ])}
                aria-label={c('Info').t`Message view`}
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
                            <RouterElementContainer params={params} navigation={navigation} actions={actions} />
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
