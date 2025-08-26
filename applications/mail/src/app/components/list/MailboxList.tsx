import type { Dispatch, ReactNode, RefObject, SetStateAction } from 'react';
import { useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { useLabels } from '@proton/mail/index';

import type { ElementsStructure } from 'proton-mail/hooks/mailbox/useElements';
import type { MailboxActions } from 'proton-mail/router/interface';

import { pageFromUrl } from '../../helpers/mailboxUrl';
import { useMailboxLayoutProvider } from '../../router/components/MailboxLayoutContext';
import { useRouterNavigation } from '../../router/hooks/useRouterNavigation';
import { useMailSelector } from '../../store/hooks';
import MailboxListBannersWrapper from './MailboxListBannersWrapper';
import MailboxListContainer from './MailboxListContainer';
import MailboxListItems from './MailboxListItems';
import MailboxListPaginationWrapper from './MailboxListPaginationWrapper';
import { MailboxListProvider } from './MailboxListProvider';

import './MailboxList.scss';
import './delight/DelightList.scss';

interface MailboxListProps {
    elementsData: ElementsStructure;

    actions: MailboxActions;
    overrideColumnMode?: boolean;

    toolbar?: ReactNode;
    listRef?: RefObject<HTMLDivElement>;
    noBorder?: boolean;
    noPlaceholder?: boolean;
    setFocusID?: Dispatch<SetStateAction<string | undefined>>;
}

export default function MailboxList({
    elementsData,
    toolbar,
    actions,
    listRef: externalListRef,
    noBorder = false,
    overrideColumnMode = false,
    noPlaceholder = false,
    setFocusID,
}: MailboxListProps) {
    const [labels = []] = useLabels();
    const location = useLocation();
    const params = useMailSelector((state) => state.elements.params);
    const { labelID, elementID } = params;
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

    const elementsLength = loading ? placeholderCount : elementsData.elements.length;
    const showList = overrideColumnMode || isColumnModeActive || !elementID;
    const showContentPanel = overrideColumnMode || (isColumnModeActive && !!elementsLength) || !!elementID;

    const currentPage = pageFromUrl(location);

    const internalListRef = useRef<HTMLDivElement>(null);
    const listRefToUse = externalListRef || internalListRef;

    const handleFocus = (elementID: string) => {
        setFocusID?.(elementID);
    };

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
                    onClick={handleElement}
                    onFocus={handleFocus}
                    onCheckOne={handleCheckOne}
                    columnLayout={overrideColumnMode || isColumnLayoutPreferred}
                    onBack={navigation.handleBack}
                    labels={labels}
                    noPlaceholder={noPlaceholder}
                />
                <MailboxListPaginationWrapper />
            </MailboxListContainer>
        </MailboxListProvider>
    );
}
