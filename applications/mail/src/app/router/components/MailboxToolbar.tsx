import { useActiveBreakpoint } from '@proton/components';
import { useMailSettings } from '@proton/mail/mailSettings/hooks';

import Toolbar from 'proton-mail/components/toolbar/Toolbar';
import { type ElementsStructure } from 'proton-mail/hooks/mailbox/useElements';
import { type ElementsStateParams } from 'proton-mail/store/elements/elementsTypes';

import type { MailboxActions, RouterNavigation } from '../interface';
import { useMailboxLayoutProvider } from './MailboxLayoutContext';

interface Props {
    inHeader?: boolean;
    params: ElementsStateParams;
    navigation: RouterNavigation;
    elementsData: ElementsStructure;
    actions: MailboxActions;
}

export const MailboxToolbar = ({ inHeader = false, params, navigation, elementsData, actions }: Props) => {
    const { conversationMode, sort, filter, labelID, elementID, messageID, isSearching } = params;
    const { handleBack, handlePage, page, handleFilter, handleSort } = navigation;
    const { loading, total, elementIDs } = elementsData;
    const {
        handleElement,
        handleMarkAs,
        handleMove,
        handleDelete,
        selectedIDs,
        checkedIDs,
        handleCheckAll,
        handleCheck,
    } = actions;

    const { labelDropdownToggleRef, moveDropdownToggleRef, columnMode } = useMailboxLayoutProvider();

    const breakpoints = useActiveBreakpoint();
    const [mailSettings] = useMailSettings();

    return (
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
            isSearch={isSearching}
            onPage={handlePage}
            onBack={handleBack}
            onElement={handleElement}
            onMarkAs={handleMarkAs}
            onMove={handleMove}
            onDelete={handleDelete}
            labelDropdownToggleRef={labelDropdownToggleRef}
            moveDropdownToggleRef={moveDropdownToggleRef}
            bordered
            sort={sort}
            onSort={handleSort}
            onFilter={handleFilter}
            filter={filter}
            mailSettings={mailSettings!}
            toolbarInHeader={inHeader}
            loading={loading}
            onCheckAll={handleCheckAll}
        />
    );
};
