import type { ReactNode, RefObject } from 'react';
import { createContext, useContext } from 'react';

import type { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import type { Filter } from '@proton/shared/lib/mail/search';

import { useListActions } from '../../hooks/list/useListActions';
import { useListElements } from '../../hooks/list/useListElements';
import { useListSelection } from '../../hooks/list/useListSelection';
import { usePaging } from '../../hooks/usePaging';
import type { Element as MailElement } from '../../models/element';
import { pageSize as pageSizeSelector, params } from '../../store/elements/elementsSelectors';
import { useMailSelector } from '../../store/hooks';
import type { SOURCE_ACTION } from './list-telemetry/useListTelemetry';

interface MailboxListProviderProps {
    children: ReactNode;
    inputElements?: MailElement[];
    checkedIDs?: string[];
    page?: number;
    total?: number;
    loading?: boolean;
    placeholderCount?: number;
    onCheck: (IDs: string[], checked: boolean, replace: boolean) => void;
    handlePage: (page: number) => void;
    anchorRef?: RefObject<HTMLElement>;
    customActions?: {
        onMarkAs?: (status: MARK_AS_STATUS, sourceAction: SOURCE_ACTION) => void;
        onDelete?: (sourceAction: SOURCE_ACTION) => void;
        onMove?: (destinationLabelID: string, sourceAction: SOURCE_ACTION) => void;
    };
}

interface MailboxListContextValue {
    // Elements
    elements: MailElement[];
    isESLoading: boolean;
    showESSlowToolbar: boolean;
    loadingElement: ReactNode;
    useLoadingElement: boolean;

    // Selection
    checkedIDsMap: { [ID: string]: boolean };
    draggedIDsMap: { [ID: string]: boolean };
    handleDragStart: (event: React.DragEvent, element: MailElement) => void;
    handleDragEnd: (event: React.DragEvent) => void;
    canShowSelectAllBanner: boolean;

    // Actions
    contextMenu: ReactNode;
    onContextMenu: (event: React.MouseEvent<HTMLDivElement>, element: MailElement) => void;
    blockSenderModal: ReactNode;
    onMarkAs: (status: MARK_AS_STATUS, sourceAction: SOURCE_ACTION) => void;
    onDelete: (sourceAction: SOURCE_ACTION) => void;
    onMove: (labelID: string, sourceAction: SOURCE_ACTION) => void;

    // Pagination
    total: number;
    page: number;
    pageSize: number;
    handlePrevious: () => void;
    handleNext: () => void;
    handlePage: (page: number) => void;

    // Others
    labelID?: string;
    elementID?: string;
    conversationMode: boolean;
    mailboxListLoading: boolean;
    isSearch: boolean;
    filter: Filter;
}

const MailboxListContext = createContext<MailboxListContextValue | null>(null);

export const useMailboxListContext = () => {
    const context = useContext(MailboxListContext);
    if (!context) {
        throw new Error('useMailboxListContext must be used within a MailboxListProvider');
    }
    return context;
};

export const MailboxListProvider = ({
    children,
    inputElements = [],
    checkedIDs = [],
    loading = false,
    page = 1,
    total,
    placeholderCount = 0,
    onCheck,
    handlePage,
    anchorRef,
    customActions = {},
}: MailboxListProviderProps) => {
    const { labelID, isSearching: isSearch, filter, elementID, conversationMode } = useMailSelector(params);

    const elementsData = useListElements({
        inputElements,
        loading,
        placeholderCount,
        labelID,
        isSearch,
        page,
        total,
    });

    const selectionData = useListSelection({
        elements: elementsData.elements,
        checkedIDs,
        labelID,
        onCheck,
        isSearch,
        hasFilter: Object.keys(filter).length > 0,
    });

    const actionsData = useListActions({
        elementID,
        labelID,
        checkedIDs,
        onCheck,
        conversationMode,
        anchorRef: anchorRef as RefObject<HTMLElement>,
        customActions,
    });

    const pageSize = useMailSelector(pageSizeSelector);
    const pagingHandlers = usePaging(page, pageSize, total, handlePage);

    const { onPrevious, onNext, onPage } = pagingHandlers;
    const contextValue: MailboxListContextValue = {
        elements: elementsData.elements,
        isESLoading: elementsData.isESLoading,
        showESSlowToolbar: elementsData.showESSlowToolbar,
        loadingElement: elementsData.loadingElement,
        useLoadingElement: elementsData.useLoadingElement,

        checkedIDsMap: selectionData.checkedIDsMap,
        draggedIDsMap: selectionData.draggedIDsMap,
        handleDragStart: selectionData.handleDragStart,
        handleDragEnd: selectionData.handleDragEnd,
        canShowSelectAllBanner: selectionData.canShowSelectAllBanner,

        contextMenu: actionsData.contextMenu,
        onContextMenu: actionsData.onContextMenu,
        blockSenderModal: actionsData.blockSenderModal,
        onMarkAs: actionsData.onMarkAs,
        onDelete: actionsData.onDelete,
        onMove: actionsData.onMove,

        total: pagingHandlers.total,
        page: pagingHandlers.page,
        pageSize,
        handlePrevious: onPrevious,
        handleNext: onNext,
        handlePage: onPage,

        labelID,
        elementID,
        conversationMode,
        mailboxListLoading: loading,
        isSearch,
        filter: filter || {},
    };

    return <MailboxListContext.Provider value={contextValue}>{children}</MailboxListContext.Provider>;
};
