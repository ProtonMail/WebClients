import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import { CategoriesTabs } from 'proton-mail/components/categoryView/categoriesTabs/CategoriesTabs';
import { useCategoryViewAccess } from 'proton-mail/components/categoryView/useCategoryViewAccess';
import Toolbar from 'proton-mail/components/toolbar/Toolbar';
import { type ElementsStructure } from 'proton-mail/hooks/mailbox/useElements';
import { type ElementsStateParams } from 'proton-mail/store/elements/elementsTypes';

import type { MailboxActions, RouterNavigation } from '../interface';
import { useMailboxLayoutProvider } from './MailboxLayoutContext';

interface MailboxToolbarProps {
    inHeader?: boolean;
    params: ElementsStateParams;
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
    params,
    navigation,
    elementsData,
    actions,
    overrideColumnMode,
}: MailboxToolbarProps) => {
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

    const canSeeCategoryView = useCategoryViewAccess();

    const { labelDropdownToggleRef, moveDropdownToggleRef, columnMode } = useMailboxLayoutProvider();

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
                columnMode={overrideColumnMode ?? columnMode}
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
            {canSeeCategoryView && <CategoriesTabs labelID={labelID} />}
        </>
    );
};
