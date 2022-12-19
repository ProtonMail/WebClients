import { ChangeEvent, Fragment, Ref, RefObject, forwardRef, memo, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import {
    MnemonicPromptModal,
    PaginationRow,
    classnames,
    getCanReactiveMnemonic,
    useConversationCounts,
    useEventManager,
    useIsMnemonicAvailable,
    useItemsDraggable,
    useMessageCounts,
    useModalState,
    useModals,
    useSettingsLink,
    useUser,
} from '@proton/components';
import { DENSITY } from '@proton/shared/lib/constants';
import { ChecklistKey, MailSettings, UserSettings } from '@proton/shared/lib/interfaces';

import { MESSAGE_ACTIONS } from '../../constants';
import { useOnCompose } from '../../containers/ComposeProvider';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { useGetStartedChecklist, usePaidUserChecklist } from '../../containers/checklists';
import { isMessage as testIsMessage } from '../../helpers/elements';
import { isColumnMode } from '../../helpers/mailSettings';
import { MARK_AS_STATUS } from '../../hooks/actions/useMarkAs';
import { usePaging } from '../../hooks/usePaging';
import { usePlaceholders } from '../../hooks/usePlaceholders';
import { showLabelTaskRunningBanner } from '../../logic/elements/elementsSelectors';
import { Element } from '../../models/element';
import { Filter, Sort } from '../../models/tools';
import { Breakpoints } from '../../models/utils';
import GetStartedChecklist from '../checklist/GetStartedChecklist';
import ModalGetMobileApp from '../checklist/ModalGetMobileApp';
import ModalImportEmails from '../checklist/ModalImportEmails';
import PaidUserGetStartedChecklist from '../checklist/PaidUserGetStartedChecklist';
import EmptyView from '../view/EmptyView';
import ESSlowToolbar from './ESSlowToolbar';
import Item from './Item';
import ListSettings from './ListSettings';
import { ResizeHandle } from './ResizeHandle';
import TaskRunningBanner from './TaskRunningBanner';
import useEncryptedSearchList from './useEncryptedSearchList';
import { useItemContextMenu } from './useItemContextMenu';

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
    sort: Sort;
    onSort: (sort: Sort) => void;
    onFilter: (filter: Filter) => void;
    mailSettings: MailSettings;
    userSettings: UserSettings;
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
        sort,
        onSort,
        onFilter,
        mailSettings,
        userSettings,
    }: Props,
    ref: Ref<HTMLDivElement>
) => {
    const { shouldHighlight, getESDBStatus } = useEncryptedSearchContext();
    // Override compactness of the list view to accomodate body preview when showing encrypted search results
    const { esEnabled, dbExists } = getESDBStatus();
    const shouldOverrideCompactness = shouldHighlight() && dbExists && esEnabled;
    const isCompactView = userSettings.Density === DENSITY.COMPACT && !shouldOverrideCompactness;

    const [user] = useUser();
    const onCompose = useOnCompose();
    const { createModal } = useModals();
    const goToSettings = useSettingsLink();

    // We want to display placeholders only when we are currently loading elements AND we don't have elements already
    const displayPlaceholders = loading && inputElements?.length === 0;

    const elements = usePlaceholders(inputElements, displayPlaceholders, placeholderCount);
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

    const [messageCounts] = useMessageCounts();
    const [conversationCounts] = useConversationCounts();

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

    const { contextMenu, onContextMenu, blockSenderModal } = useItemContextMenu({
        elementID,
        labelID,
        anchorRef: ref as RefObject<HTMLElement>,
        checkedIDs,
        onCheck,
        onMarkAs,
        onMove,
        onDelete,
    });

    const unreads = useMemo(() => {
        const counters = conversationMode ? conversationCounts : messageCounts;
        return (counters || []).find((counter) => counter.LabelID === labelID)?.Unread || 0;
    }, [conversationMode, labelID, conversationCounts, messageCounts]);

    return (
        <div className={classnames(['relative items-column-list relative', !show && 'hidden'])}>
            <div
                ref={ref}
                className={classnames(['h100 scroll-if-needed scroll-smooth-touch', isCompactView && 'list-compact'])}
            >
                <h1 className="sr-only">
                    {conversationMode ? c('Title').t`Conversation list` : c('Title').t`Message list`}{' '}
                    {c('Title').ngettext(msgid`${unreads} unread message`, `${unreads} unread messages`, unreads)}
                </h1>
                <div className="items-column-list-inner flex flex-nowrap flex-column relative items-column-list-inner--mail">
                    <ListSettings
                        sort={sort}
                        onSort={onSort}
                        onFilter={onFilter}
                        filter={filter}
                        conversationMode={conversationMode}
                        mailSettings={mailSettings}
                        isSearch={isSearch}
                        labelID={labelID}
                    />
                    {showESSlowToolbar && <ESSlowToolbar />}
                    {showTaskRunningBanner && <TaskRunningBanner className={showESSlowToolbar ? '' : 'mt1'} />}
                    {elements.length === 0 ? (
                        <EmptyView labelID={labelID} isSearch={isSearch} isUnread={filter.Unread === 1} />
                    ) : (
                        <>
                            {/* div needed here for focus management */}
                            <div>
                                {elements.map((element, index) => (
                                    <Fragment key={element.ID}>
                                        <Item
                                            conversationMode={conversationMode}
                                            isCompactView={isCompactView}
                                            labelID={labelID}
                                            loading={displayPlaceholders}
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
                                    </Fragment>
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
                                    {userSettings.Checklists?.includes('paying-user') &&
                                        !isPaidUserChecklistDismissed && (
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
            {blockSenderModal}
        </div>
    );
};

export default memo(forwardRef(List));
