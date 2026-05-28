import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import Toolbar from 'proton-mail/components/toolbar/Toolbar';
import type { ElementsStructure } from 'proton-mail/hooks/mailbox/useElements';
import { params } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import type { MailboxActions, RouterNavigation } from '../interface';
import { useMailboxLayoutProvider } from './MailboxLayoutContext';

interface MailboxToolbarProps {
    inHeader?: boolean;
    navigation: RouterNavigation;
    elementsData: ElementsStructure;
    actions: MailboxActions;

    /**
     * Override the column mode of the toolbar. If not provided it is determined by the columnMode of the MailboxLayoutProvider.
     */
    overrideColumnMode?: boolean;
}

export const MailboxToolbar = ({
    inHeader = false,
    navigation,
    elementsData,
    actions,
    overrideColumnMode,
}: MailboxToolbarProps) => {
    const { conversationMode, sort, filter, labelID, elementID, messageID, isSearching } = useMailSelector(params);
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

    const { labelDropdownToggleRef, moveDropdownToggleRef, isColumnModeActive } = useMailboxLayoutProvider();

    const [mailSettings] = useMailSettings();

    return (
        <>
            <Toolbar
                labelID={labelID}
                elementID={elementID}
                messageID={messageID}
                selectedIDs={selectedIDs}
                checkedIDs={checkedIDs}
                elementIDs={elementIDs}
                columnMode={overrideColumnMode ?? isColumnModeActive}
                conversationMode={conversationMode}
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
        </>
    );
};
