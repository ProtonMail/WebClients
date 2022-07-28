import { ChangeEvent, Ref, memo, forwardRef, RefObject } from 'react';
import { useSelector } from 'react-redux';
import { c, msgid } from 'ttag';
import {
    classnames,
    MnemonicPromptModal,
    PaginationRow,
    useItemsDraggable,
    useModals,
    useIsMnemonicAvailable,
    useModalState,
    useSettingsLink,
    useUser,
    getCanReactiveMnemonic,
    useEventManager,
    useUserSettings,
    useMailSettings,
} from '@proton/components';
import { ChecklistKey } from '@proton/shared/lib/interfaces';
import { DENSITY } from '@proton/shared/lib/constants';
import Item from './Item';
import { Element } from '../../models/element';
import EmptyView from '../view/EmptyView';
import { isMessage as testIsMessage } from '../../helpers/elements';
import { usePlaceholders } from '../../hooks/usePlaceholders';
import { Breakpoints } from '../../models/utils';
import { Filter } from '../../models/tools';
import { usePaging } from '../../hooks/usePaging';
import ESSlowToolbar from './ESSlowToolbar';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import useEncryptedSearchList from './useEncryptedSearchList';
import GetStartedChecklist from '../checklist/GetStartedChecklist';
import PaidUserGetStartedChecklist from '../checklist/PaidUserGetStartedChecklist';
import { isColumnMode } from '../../helpers/mailSettings';
import { MESSAGE_ACTIONS } from '../../constants';
import { useOnCompose } from '../../containers/ComposeProvider';
import { useGetStartedChecklist, usePaidUserChecklist } from '../../containers/checklists';
import ModalImportEmails from '../checklist/ModalImportEmails';
import ModalGetMobileApp from '../checklist/ModalGetMobileApp';
import { ResizeHandle } from './ResizeHandle';
import TaskRunningBanner from './TaskRunningBanner';
import { showLabelTaskRunningBanner } from '../../logic/elements/elementsSelectors';
import { useItemContextMenu } from './useItemContextMenu';
import { MARK_AS_STATUS } from '../../hooks/useMarkAs';

const defaultCheckedIDs: string[] = [];
const defaultElements: Element[] = [];

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
    onFocus: (number: number) => void;
    conversationMode: boolean;
    isSearch: boolean;
    breakpoints: Breakpoints;
    page: number;
    total: number | undefined;
    onPage: (page: number) => void;
    filter: Filter;
    resizeAreaRef: Ref<HTMLButtonElement>;
    enableResize: () => void;
    resetWidth: () => void;
    showContentPanel: boolean;
    scrollBarWidth: number;
    onMarkAs: (status: MARK_AS_STATUS) => void;
    onMove: (labelID: string) => void;
    onDelete: () => void;
    onBack: () => void;
}

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
        breakpoints,
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
    }: Props,
    ref: Ref<HTMLDivElement>
) => {
    const [userSettings] = useUserSettings();
    const [mailSettings] = useMailSettings();

    const { shouldHighlight } = useEncryptedSearchContext();
    // Override compactness of the list view to accomodate body preview when showing encrypted search results
    const isCompactView = userSettings.Density === DENSITY.COMPACT && !shouldHighlight();

    const [user] = useUser();
    const onCompose = useOnCompose();
    const { createModal } = useModals();
    const goToSettings = useSettingsLink();
    const elements = usePlaceholders(inputElements, loading, placeholderCount);
    const { dismissed: isGetStartedChecklistDismissed, handleDismiss: dismissGetStartedChecklist } =
        useGetStartedChecklist();
    const { dismissed: isPaidUserChecklistDismissed, handleDismiss: dismissPaidUserChecklist } = usePaidUserChecklist();
    const pagingHandlers = usePaging(inputPage, inputTotal, onPage);
    const { page, total } = pagingHandlers;

    const { call } = useEventManager();
    const [mnemonicPromptModal, setMnemonicPromptModalOpen, render] = useModalState({ onExit: call });
    const showTaskRunningBanner = useSelector(showLabelTaskRunningBanner);

    const [isMnemonicAvailable] = useIsMnemonicAvailable();
    const canReactivateMnemonic = getCanReactiveMnemonic(user);
    const displayMnemonicPrompt = isMnemonicAvailable && canReactivateMnemonic;

    // ES options: offer users the option to turn off ES if it's taking too long, and
    // enable/disable UI elements for incremental partial searches
    const { showESSlowToolbar, loadingElement, disableGoToLast, useLoadingElement } = useEncryptedSearchList(
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

    const { contextMenu, onContextMenu } = useItemContextMenu({
        elementID,
        labelID,
        anchorRef: ref as RefObject<HTMLElement>,
        checkedIDs,
        onCheck,
        onMarkAs,
        onMove,
        onDelete,
    });

    return (
        <div className={classnames(['relative items-column-list relative', !show && 'hidden'])}>
            <div
                ref={ref}
                className={classnames(['h100 scroll-if-needed scroll-smooth-touch', isCompactView && 'list-compact'])}
            >
                <h1 className="sr-only">
                    {conversationMode ? c('Title').t`Conversation list` : c('Title').t`Message list`}
                </h1>
                <div className="items-column-list-inner opacity-on-hover-supercontainer flex flex-nowrap flex-column relative items-column-list-inner--mail">
                    {/* <ListSettings
                        sort={sort}
                        onSort={onSort}
                        onFilter={onFilter}
                        filter={filter}
                        conversationMode={conversationMode}
                        mailSettings={mailSettings}
                        isSearch={isSearch}
                        labelID={labelID}
                    /> */}
                    {showESSlowToolbar && <ESSlowToolbar />}
                    {showTaskRunningBanner && <TaskRunningBanner className={showESSlowToolbar ? '' : 'mt1'} />}
                    {elements.length === 0 ? (
                        <EmptyView labelID={labelID} isSearch={isSearch} isUnread={filter.Unread === 1} />
                    ) : (
                        <>
                            {/* div needed here for focus management */}
                            <div>
                                {elements.map((element, index) => (
                                    <Item
                                        key={element.ID}
                                        conversationMode={conversationMode}
                                        labelID={labelID}
                                        loading={loading}
                                        columnLayout={columnLayout}
                                        elementID={elementID}
                                        element={element}
                                        checked={checkedIDs.includes(element.ID || '')}
                                        onCheck={onCheckOne}
                                        onClick={onClick}
                                        onContextMenu={onContextMenu}
                                        onDragStart={handleDragStart}
                                        onDragEnd={handleDragEnd}
                                        dragged={draggedIDs.includes(element.ID || '')}
                                        index={index}
                                        breakpoints={breakpoints}
                                        onFocus={onFocus}
                                        onBack={onBack}
                                    />
                                ))}
                            </div>

                            {!loading && !(total > 1) && (
                                <>
                                    {render && <MnemonicPromptModal {...mnemonicPromptModal} />}
                                    {userSettings.Checklists?.includes('get-started') &&
                                        !isGetStartedChecklistDismissed && (
                                            <GetStartedChecklist
                                                limitedMaxWidth={!isColumnMode(mailSettings)}
                                                onDismiss={dismissGetStartedChecklist}
                                                onItemSelection={(key: ChecklistKey) => () => {
                                                    switch (key) {
                                                        case ChecklistKey.SendMessage: {
                                                            onCompose({ action: MESSAGE_ACTIONS.NEW });
                                                            break;
                                                        }

                                                        case ChecklistKey.MobileApp: {
                                                            createModal(<ModalGetMobileApp />);
                                                            break;
                                                        }

                                                        case ChecklistKey.RecoveryMethod: {
                                                            if (displayMnemonicPrompt) {
                                                                setMnemonicPromptModalOpen(true);
                                                            } else {
                                                                goToSettings('/recovery', undefined, true);
                                                            }
                                                            break;
                                                        }

                                                        case ChecklistKey.Import: {
                                                            createModal(<ModalImportEmails />);
                                                            break;
                                                        }
                                                    }
                                                }}
                                            />
                                        )}
                                    {userSettings.Checklists?.includes('paying-user') && !isPaidUserChecklistDismissed && (
                                        <PaidUserGetStartedChecklist
                                            limitedMaxWidth={!isColumnMode(mailSettings)}
                                            onDismiss={dismissPaidUserChecklist}
                                            onItemSelection={(key: ChecklistKey) => () => {
                                                switch (key) {
                                                    case ChecklistKey.SendMessage: {
                                                        onCompose({ action: MESSAGE_ACTIONS.NEW });
                                                        break;
                                                    }
                                                    case ChecklistKey.MobileApp: {
                                                        createModal(<ModalGetMobileApp />);
                                                        break;
                                                    }
                                                    case ChecklistKey.RecoveryMethod: {
                                                        if (displayMnemonicPrompt) {
                                                            setMnemonicPromptModalOpen(true);
                                                        } else {
                                                            goToSettings('/recovery', undefined, true);
                                                        }
                                                        break;
                                                    }
                                                    case ChecklistKey.Import: {
                                                        createModal(<ModalImportEmails />);
                                                        break;
                                                    }
                                                }
                                            }}
                                        />
                                    )}
                                </>
                            )}

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
            {elements.length !== 0 && showContentPanel && (
                <ResizeHandle
                    resizeAreaRef={resizeAreaRef}
                    enableResize={enableResize}
                    resetWidth={resetWidth}
                    scrollBarWidth={scrollBarWidth}
                />
            )}
            {contextMenu}
        </div>
    );
};

export default memo(forwardRef(List));
