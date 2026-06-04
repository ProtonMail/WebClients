import { useCallback, useRef } from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import Commander from '@proton/components/components/commander/Commander';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useCategoriesData } from '@proton/mail/features/categoriesView/useCategoriesData';
import { useFolders } from '@proton/mail/store/labels/hooks';
import clsx from '@proton/utils/clsx';

import { CategoriesTabs } from 'proton-mail/components/categoryView/categoriesTabs/CategoriesTabs';
import { useCategoriesView } from 'proton-mail/components/categoryView/useCategoriesView';
import { useCategoryFlagWatcher } from 'proton-mail/components/categoryView/useCategoryFlagWatcher';
import MailboxList from 'proton-mail/components/list/MailboxList';
import { ResizableWrapper } from 'proton-mail/components/list/ResizableWrapper';
import { ResizeHandlePosition } from 'proton-mail/components/list/ResizeHandle';
import { MailToolbar } from 'proton-mail/components/toolbar/MailToolbar';
import { ROUTE_ELEMENT } from 'proton-mail/constants';
import MailboxContainerPlaceholder from 'proton-mail/containers/mailbox/MailboxContainerPlaceholder';
import { APPLY_LOCATION_TYPES } from 'proton-mail/hooks/actions/applyLocation/interface';
import { useApplyLocation } from 'proton-mail/hooks/actions/applyLocation/useApplyLocation';
import { MoveAllType } from 'proton-mail/hooks/actions/move/useMoveAllToFolder';
import { useMailCommander } from 'proton-mail/hooks/commander/useMailCommander';
import { type ElementsStructure, useGetElementsFromIDs } from 'proton-mail/hooks/mailbox/useElements';
import { useMailboxFocus } from 'proton-mail/hooks/mailbox/useMailboxFocus';
import { useMailboxHotkeys } from 'proton-mail/hooks/mailbox/useMailboxHotkeys';
import { useWelcomeFlag } from 'proton-mail/hooks/mailbox/useWelcomeFlag';
import { DEFAULT_MIN_WIDTH_OF_MAILBOX_LIST } from 'proton-mail/hooks/useResizableUtils';
import { selectComposersCount } from 'proton-mail/store/composers/composerSelectors';
import { selectElementID, selectParams } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { RouterElementContainer } from './RouterElementContainer';
import { useMailboxLayoutProvider } from './components/MailboxLayoutContext';
import { MailboxToolbar } from './components/MailboxToolbar';
import type { MailboxActions, RouterNavigation } from './interface';

interface Props {
    navigation: RouterNavigation;
    elementsData: ElementsStructure;
    actions: MailboxActions;
    hasRowMode?: boolean;
    onResizingChange?: (isResizing: boolean) => void;
}

export const RouterLabelContainer = ({
    navigation,
    elementsData,
    actions,
    hasRowMode = false,
    onResizingChange,
}: Props) => {
    const elementID = useMailSelector(selectElementID);
    const { labelID, messageID } = useMailSelector(selectParams);
    const { handleBack } = navigation;
    const { elementIDs, loading } = elementsData;
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
    const { shouldSeeWideToolbars } = useCategoriesData();

    const categoryViewControl = useCategoriesView();
    useCategoryFlagWatcher();

    const [commanderModalProps, showCommander, commanderRender] = useModalState();
    const welcomeFlag = useWelcomeFlag([labelID, selectedIDs.length]);

    const [folders] = useFolders();
    const getElementsFromIDs = useGetElementsFromIDs();

    const showList = isColumnModeActive || !elementID;
    const showContentPanel = isColumnModeActive || !!elementID;
    const showContentView = showContentPanel && !!elementID;
    const showRightPlaceholder = isColumnModeActive && (!elementID || !!checkedIDs.length);

    const { commanderList } = useMailCommander();
    const { applyLocation } = useApplyLocation();

    const { focusID, setFocusID, focusLastID, focusFirstID, focusNextID, focusPreviousID } = useMailboxFocus({
        showList,
        listRef,
        isComposerOpened: composersCount > 0,
        loading,
    });

    const {
        moveAllToFolder,
        selectAll,
        elementRef,
        deleteSelectionModal: hotkeyDeleteSelectionShortcutModal,
        deleteAllModal: hotkeyDeleteAllShortcutModal,
        selectAllMoveModal: hotkeySelectAllMoveModal,
        selectAllMarkModal: hotkeyMarkAllModal,
    } = useMailboxHotkeys(
        {
            labelID,
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
            handleCheckAll,
            setFocusID,
            showCommander,
        }
    );

    const handleMove = useCallback(
        async (newLabelID: string): Promise<void> => {
            const elements = getElementsFromIDs(selectedIDs);
            if (selectAll) {
                await moveAllToFolder({
                    type: MoveAllType.selectAll,
                    elements,
                    sourceLabelID: labelID,
                    destinationLabelID: newLabelID,
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

    const mailboxColumns = (
        <>
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
                        shouldSeeWideToolbars ? null : (
                            <>
                                <MailboxToolbar
                                    navigation={navigation}
                                    elementsData={elementsData}
                                    actions={{ ...actions, handleMove }}
                                />
                                {categoryViewControl.shouldShowTabs && <CategoriesTabs />}
                            </>
                        )
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
                {showRightPlaceholder && (
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
                        render={() => <RouterElementContainer navigation={navigation} actions={actions} />}
                    />
                </Switch>
            </section>
        </>
    );

    // This can be removed once the refreshed toolbar UI is fully implemented and validated
    // elementRef must include the toolbar so that hotkeys remain active when focus is on toolbar elements (e.g. SelectAll checkbox)
    return (
        <div
            ref={elementRef}
            tabIndex={-1}
            className={clsx(
                'outline-none relative',
                shouldSeeWideToolbars ? 'flex flex-column flex-1 flex-nowrap' : 'flex flex-1 flex-nowrap'
            )}
            data-testid="mailbox"
        >
            {shouldSeeWideToolbars && (
                <MailToolbar placement="list" actions={{ ...actions, handleMove }} elementsData={elementsData} />
            )}
            {shouldSeeWideToolbars ? <div className="flex flex-1 flex-nowrap">{mailboxColumns}</div> : mailboxColumns}
            {commanderRender ? <Commander list={commanderList} {...commanderModalProps} /> : null}
            {deleteAllModal}
            {selectAllMoveModal}
            {selectAllMarkModal}
            {deleteSelectionModal}
            {hotkeyMarkAllModal}
            {hotkeySelectAllMoveModal}
            {hotkeyDeleteAllShortcutModal}
            {hotkeyDeleteSelectionShortcutModal}
        </div>
    );
};
