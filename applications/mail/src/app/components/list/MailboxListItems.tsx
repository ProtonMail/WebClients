import { type ChangeEvent, Fragment, type RefObject, useEffect } from 'react';
import { useLocation } from 'react-router';

import { c } from 'ttag';

import { useUserSettings } from '@proton/account';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { DENSITY } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';
import { CUSTOM_VIEWS, CUSTOM_VIEWS_LABELS } from '@proton/shared/lib/mail/constants';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { useGetStartedChecklist } from '../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { useMailboxLayoutProvider } from '../../router/components/MailboxLayoutContext';
import {
    selectConversationMode,
    selectElementID,
    selectIsSearching,
    selectLabelID,
} from '../../store/elements/elementsSelectors';
import { useMailSelector } from '../../store/hooks';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { isElementMessage } from '../../helpers/elements';
import { PLACEHOLDER_ID_PREFIX } from '../../hooks/usePlaceholders';
import type { ESMessage } from '../../models/encryptedSearch';
import { useCategoriesOnboarding } from '../categoryView/categoriesOnboarding/CategoriesOnboardingContext';
import { CategoriesOnboardingSpotlight } from '../categoryView/categoriesOnboarding/CategoriesOnboardingSpotlights';
import { HIGHLIGHTED_ITEM_INDEX } from '../categoryView/categoriesOnboarding/onboardingInterface';
import UserOnboardingMessageListPlaceholder from '../onboarding/checklist/messageListPlaceholder/UserOnboardingMessageListPlaceholder';
import EmptyListPlaceholder from '../view/EmptyListPlaceholder';
import Item from './Item';
import MailboxListPaginationWrapper from './MailboxListPaginationWrapper';
import { useMailboxListContext } from './MailboxListProvider';
import SkeletonItem from './SkeletonItem';

interface MailboxListItemsProps {
    onCheckOne: (event: ChangeEvent, elementID: string) => void;
    onClick: (elementID: string | undefined) => void;
    onFocus: (elementID: string) => void;
    onBack: () => void;
    labels: Label[];
    columnLayout?: boolean;
    listRef?: RefObject<HTMLDivElement>;
    scrollContainerRef?: RefObject<HTMLDivElement>;
    noPlaceholder?: boolean;
}

const MailboxListItems = ({
    onCheckOne,
    onClick,
    onFocus,
    onBack,
    labels = [],
    columnLayout = true,
    listRef,
    scrollContainerRef,
    noPlaceholder = false,
}: MailboxListItemsProps) => {
    const [userSettings] = useUserSettings();
    const {
        elements,
        checkedIDsMap,
        draggedIDsMap,
        handleDragStart,
        handleDragEnd,
        onContextMenu,
        mailboxListLoading,
        useLoadingElement,
        loadingElement,
        total,
        shouldShowPrimaryBadge,
    } = useMailboxListContext();

    const labelID = useMailSelector(selectLabelID);
    const isSearch = useMailSelector(selectIsSearching);
    const conversationMode = useMailSelector(selectConversationMode);
    const elementID = useMailSelector(selectElementID);

    const { displayState, changeChecklistDisplay, canDisplayChecklist, byoeFlowInProgress } = useGetStartedChecklist();
    const { shouldHighlight, esStatus } = useEncryptedSearchContext();
    const [mailSettings] = useMailSettings();
    const { contentIndexingDone, esEnabled, dbExists } = esStatus;
    const shouldHighlightSearch = shouldHighlight();
    const shouldOverrideCompactness = shouldHighlightSearch && contentIndexingDone && esEnabled;
    const isCompactView = userSettings.Density === DENSITY.COMPACT && !shouldOverrideCompactness;
    const isConversationContentView = mailSettings.ViewMode === VIEW_MODE.GROUP;
    // Whether content-search highlighting can apply; combined per-row with the element's decrypted body
    const contentSearchEnabled = dbExists && esEnabled && shouldHighlightSearch && contentIndexingDone;

    const location = useLocation();

    const { isColumnModeActive } = useMailboxLayoutProvider();
    const { listSpotlightStep } = useCategoriesOnboarding();

    useEffect(() => {
        // When we show more than 5 elements in the list, the onboarding should be collapsed.
        // However, if the user is in the middle of the BYOE flow, we want to keep the checklist expanded
        // in case the import started but the user is going through the upgrade flow.
        if (elements.length >= 5 && displayState === CHECKLIST_DISPLAY_TYPE.FULL && !byoeFlowInProgress) {
            changeChecklistDisplay(CHECKLIST_DISPLAY_TYPE.REDUCED);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-A1D418
    }, [elements, byoeFlowInProgress]);

    if (elements.length === 0) {
        if (noPlaceholder) {
            return null;
        }

        // Small message in column view to inform user that no messages are available
        if (
            isColumnModeActive &&
            !location.pathname.includes(CUSTOM_VIEWS[CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS].route)
        ) {
            return (
                <div className="w-full h-full flex items-center justify-center">
                    <p className="text-center color-weak">{c('Info').t`Seems like you are all caught up for now`}</p>
                </div>
            );
        }

        return <EmptyListPlaceholder labelID={labelID} isSearch={isSearch} isUnread={false} />;
    }

    const shouldShowUserOnboarding = () => {
        if (mailboxListLoading || !canDisplayChecklist) {
            return false;
        }

        return byoeFlowInProgress || (total <= 1 && displayState === CHECKLIST_DISPLAY_TYPE.FULL);
    };

    return (
        <div className="overflow-auto h-full" ref={scrollContainerRef}>
            <div className="w-full shrink-0" ref={listRef}>
                {elements.map((element, index) => {
                    const isPlaceholder = element.ID.startsWith(PLACEHOLDER_ID_PREFIX);
                    const isSelected =
                        isConversationContentView && isElementMessage(element)
                            ? elementID === element.ConversationID
                            : elementID === element.ID;
                    const useContentSearch = contentSearchEnabled && !!(element as ESMessage)?.decryptedBody;

                    const item = (
                        <Item
                            conversationMode={conversationMode}
                            isCompactView={isCompactView}
                            labelID={labelID}
                            loading={mailboxListLoading}
                            columnLayout={columnLayout}
                            element={element}
                            isSelected={isSelected}
                            useContentSearch={useContentSearch}
                            checked={!!checkedIDsMap[element.ID || '']}
                            onCheck={onCheckOne}
                            onClick={onClick}
                            onContextMenu={onContextMenu}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            dragged={!!draggedIDsMap[element.ID || '']}
                            index={index}
                            onFocus={onFocus}
                            userSettings={userSettings}
                            onBack={onBack}
                            labels={labels}
                            shouldShowPrimaryBadge={shouldShowPrimaryBadge}
                        />
                    );

                    if (!isPlaceholder && listSpotlightStep !== undefined && index === HIGHLIGHTED_ITEM_INDEX) {
                        return (
                            <Fragment key={element.ID}>
                                <CategoriesOnboardingSpotlight step={listSpotlightStep}>
                                    {item}
                                </CategoriesOnboardingSpotlight>
                            </Fragment>
                        );
                    }

                    return (
                        <Fragment key={element.ID}>
                            {isPlaceholder ? (
                                <SkeletonItem
                                    conversationMode={conversationMode}
                                    isCompactView={isCompactView}
                                    labelID={labelID}
                                    loading={mailboxListLoading}
                                    columnLayout={columnLayout}
                                    element={element}
                                    index={index}
                                />
                            ) : (
                                item
                            )}
                        </Fragment>
                    );
                })}

                {shouldShowUserOnboarding() && <UserOnboardingMessageListPlaceholder location="list" />}

                {useLoadingElement && loadingElement}
            </div>
            <MailboxListPaginationWrapper />
        </div>
    );
};

export default MailboxListItems;
