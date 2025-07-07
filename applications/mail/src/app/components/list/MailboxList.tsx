import type { ReactNode, RefObject } from 'react';
import { useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { useLabels } from '@proton/mail/index';

import type { ElementsStructure } from 'proton-mail/hooks/mailbox/useElements';
import type { MailboxActions } from 'proton-mail/router/interface';

import { pageFromUrl } from '../../helpers/mailboxUrl';
import { useMailboxFocus } from '../../hooks/mailbox/useMailboxFocus';
import { useMailboxLayoutProvider } from '../../router/components/MailboxLayoutContext';
import { useRouterNavigation } from '../../router/hooks/useRouterNavigation';
import { selectComposersCount } from '../../store/composers/composerSelectors';
import { paramsSelector } from '../../store/elements/elementsSelectors';
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
}

export default function MailboxList({
    elementsData,
    toolbar,
    actions,
    listRef: externalListRef,
    noBorder = false,
    overrideColumnMode = false,
    noPlaceholder = false,
}: MailboxListProps) {
    const [labels = []] = useLabels();
    const location = useLocation();
    const params = useMailSelector(paramsSelector);
    const { filter, labelID, elementID, sort } = params;
    const { total, loading, placeholderCount, elementIDs } = elementsData;
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

    const { columnMode, columnLayout, listContainerRef } = useMailboxLayoutProvider();

    const elementsLength = loading ? placeholderCount : elementsData.elements.length;
    const showList = overrideColumnMode || columnMode || !elementID;
    const showContentPanel = overrideColumnMode || (columnMode && !!elementsLength) || !!elementID;

    const currentPage = pageFromUrl(location);

    const internalListRef = useRef<HTMLDivElement>(null);
    const listRefToUse = externalListRef || internalListRef;

    const composersCount = useMailSelector(selectComposersCount);
    const isComposerOpened = composersCount > 0;

    const { setFocusID } = useMailboxFocus({
        elementIDs,
        page: currentPage,
        filter,
        sort,
        showList,
        listRef: listRefToUse,
        labelID,
        isComposerOpened,
        loading,
    });

    const handleFocus = (elementID: string) => {
        setFocusID(elementID);
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
                    columnLayout={overrideColumnMode || columnLayout}
                    checkedIDs={checkedIDs}
                    onCheckAll={handleCheckAll}
                />
                <div className="overflow-auto">
                    <MailboxListItems
                        listRef={listRefToUse}
                        onClick={handleElement}
                        onFocus={handleFocus}
                        onCheckOne={handleCheckOne}
                        columnLayout={overrideColumnMode || columnLayout}
                        onBack={navigation.handleBack}
                        labels={labels}
                        noPlaceholder={noPlaceholder}
                    />
                    <MailboxListPaginationWrapper />
                </div>
            </MailboxListContainer>
        </MailboxListProvider>
    );
}
