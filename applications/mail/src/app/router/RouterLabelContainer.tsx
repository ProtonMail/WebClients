import { useRef } from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import Commander from '@proton/components/components/commander/Commander';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import clsx from '@proton/utils/clsx';

import { useCategoryFlagWatcher } from '../components/categoryView/useCategoryFlagWatcher';
import MailboxList from '../components/list/MailboxList';
import { ResizableWrapper } from '../components/list/ResizableWrapper';
import { ResizeHandlePosition } from '../components/list/ResizeHandle';
import { MailToolbar } from '../components/toolbar/MailToolbar';
import { ROUTE_ELEMENT } from '../constants';
import MailboxContainerPlaceholder from '../containers/mailbox/MailboxContainerPlaceholder';
import { useMailCommander } from '../hooks/commander/useMailCommander';
import type { ElementsStructure } from '../hooks/mailbox/useElements';
import { useMailboxFocus } from '../hooks/mailbox/useMailboxFocus';
import { useMailboxHotkeys } from '../hooks/mailbox/useMailboxHotkeys';
import { useWelcomeFlag } from '../hooks/mailbox/useWelcomeFlag';
import { DEFAULT_MIN_WIDTH_OF_MAILBOX_LIST } from '../hooks/useResizableUtils';
import { selectComposersCount } from '../store/composers/composerSelectors';
import { selectElementID, selectLabelID, selectMessageID } from '../store/elements/elementsSelectors';
import { useMailSelector } from '../store/hooks';
import { RouterElementContainer } from './RouterElementContainer';
import { useMailboxLayoutProvider } from './components/MailboxLayoutContext';
import type { MailboxActions, RouterNavigation } from './interface';
import { useUnreadCategoryCount } from './useUnreadCategoryCount';

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
    useUnreadCategoryCount(elementsData);

    const elementID = useMailSelector(selectElementID);
    const labelID = useMailSelector(selectLabelID);
    const messageID = useMailSelector(selectMessageID);
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

    useCategoryFlagWatcher();

    const [commanderModalProps, showCommander, commanderRender] = useModalState();
    const welcomeFlag = useWelcomeFlag([labelID, selectedIDs.length]);

    const showList = isColumnModeActive || !elementID;
    const showContentPanel = isColumnModeActive || !!elementID;
    const showContentView = showContentPanel && !!elementID;
    const showRightPlaceholder = isColumnModeActive && (!elementID || !!checkedIDs.length);

    const { commanderList } = useMailCommander();

    const { focusID, setFocusID, focusLastID, focusFirstID, focusNextID, focusPreviousID } = useMailboxFocus({
        showList,
        listRef,
        isComposerOpened: composersCount > 0,
        loading,
    });

    const {
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

    // elementRef must include the toolbar so that hotkeys remain active when focus is on toolbar elements (e.g. SelectAll checkbox)
    return (
        <div
            ref={elementRef}
            tabIndex={-1}
            className="outline-none relative flex flex-column flex-1 flex-nowrap"
            data-testid="mailbox"
        >
            <MailToolbar placement="list" actions={actions} elementsData={elementsData} />
            <div className="flex flex-1 flex-nowrap">{mailboxColumns}</div>
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
