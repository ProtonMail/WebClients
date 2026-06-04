import Toolbar from 'proton-mail/components/toolbar/Toolbar';
import type { ElementsStructure } from 'proton-mail/hooks/mailbox/useElements';
import { selectParams } from 'proton-mail/store/elements/elementsSelectors';
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
    const { conversationMode, labelID, messageID, isSearching } = useMailSelector(selectParams);
    const { handleBack, handlePage, page } = navigation;
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

    return (
        <>
            <Toolbar
                labelID={labelID}
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
                toolbarInHeader={inHeader}
                loading={loading}
                onCheckAll={handleCheckAll}
            />
        </>
    );
};
