import type { Dispatch, ReactNode, RefObject, SetStateAction } from 'react';
import { useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { useLabels } from '@proton/mail/store/labels/hooks';

import type { ElementsStructure } from '../../hooks/mailbox/useElements';
import type { MailboxActions } from '../../router/interface';
import { selectElementID, selectLabelID } from '../../store/elements/elementsSelectors';

import { pageFromUrl } from '../../helpers/mailboxUrl';
import { useMailboxLayoutProvider } from '../../router/components/MailboxLayoutContext';
import { useRouterNavigation } from '../../router/hooks/useRouterNavigation';
import { useMailSelector } from '../../store/hooks';
import MailboxListBannersWrapper from './MailboxListBannersWrapper';
import MailboxListContainer from './MailboxListContainer';
import MailboxListItems from './MailboxListItems';
import { MailboxListProvider } from './MailboxListProvider';

import './MailboxList.scss';
import './delight/DelightList.scss';

interface MailboxListProps {
    elementsData: ElementsStructure;

    actions: MailboxActions;
    overrideColumnMode?: boolean;

    toolbar?: ReactNode;
    listRef?: RefObject<HTMLDivElement>;
    scrollContainerRef?: RefObject<HTMLDivElement>;
    noBorder?: boolean;
    setFocusID?: Dispatch<SetStateAction<string | undefined>>;
    noPlaceholder?: boolean;
}

export default function MailboxList({
    elementsData,
    toolbar,
    actions,
    listRef: externalListRef,
    scrollContainerRef,
    noBorder = false,
    overrideColumnMode = false,
    setFocusID,
    noPlaceholder = false,
}: MailboxListProps) {
    const [labels = []] = useLabels();
    const location = useLocation();
    const elementID = useMailSelector(selectElementID);
    const labelID = useMailSelector(selectLabelID);
    const { total, loading, placeholderCount } = elementsData;
    const {
        handleElement,
        handleMarkAs,
        handleDelete,
        handleMove,
        handleCheck,
        handleCheckOne,
        handleCheckAll,
        checkedIDs,
    } = actions;

    const navigation = useRouterNavigation({ labelID });

    const { isColumnModeActive, isColumnLayoutPreferred, listContainerRef } = useMailboxLayoutProvider();

    const showList = overrideColumnMode || isColumnModeActive || !elementID;
    const showContentPanel = overrideColumnMode || isColumnModeActive;

    const currentPage = pageFromUrl(location);

    const internalListRef = useRef<HTMLDivElement>(null);
    const listRefToUse = externalListRef || internalListRef;

    const handleFocus = useCallback(
        (elementID: string) => {
            setFocusID?.(elementID);
        },
        [setFocusID]
    );

    return (
        <MailboxListProvider
            inputElements={elementsData.elements}
            checkedIDs={checkedIDs}
            page={currentPage}
            total={total}
            loading={loading}
            placeholderCount={placeholderCount}
            onCheck={handleCheck}
            handlePage={navigation.handlePage}
            anchorRef={listContainerRef}
            customActions={{
                onMarkAs: handleMarkAs,
                onDelete: handleDelete,
                onMove: handleMove,
            }}
        >
            <MailboxListContainer
                ref={listContainerRef}
                show={showList}
                showContentPanel={showContentPanel}
                noBorder={noBorder}
                className="enhanced-list-container"
            >
                {toolbar && <div className="shrink-0 sticky top-0 z-up">{toolbar}</div>}
                <MailboxListBannersWrapper
                    columnLayout={overrideColumnMode || isColumnLayoutPreferred}
                    checkedIDs={checkedIDs}
                    onCheckAll={handleCheckAll}
                />
                <MailboxListItems
                    listRef={listRefToUse}
                    scrollContainerRef={scrollContainerRef}
                    onClick={handleElement}
                    onFocus={handleFocus}
                    onCheckOne={handleCheckOne}
                    columnLayout={overrideColumnMode || isColumnLayoutPreferred}
                    onBack={navigation.handleBack}
                    labels={labels}
                    noPlaceholder={noPlaceholder}
                />
            </MailboxListContainer>
        </MailboxListProvider>
    );
}
