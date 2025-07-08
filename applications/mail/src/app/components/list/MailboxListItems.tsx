import { type ChangeEvent, Fragment, type RefObject, useEffect } from 'react';

import { useUserSettings } from '@proton/account';
import { DENSITY } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import useMailModel from 'proton-mail/hooks/useMailModel';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { PLACEHOLDER_ID_PREFIX } from '../../hooks/usePlaceholders';
import UserOnboardingMessageListPlaceholder from '../onboarding/checklist/messageListPlaceholder/UserOnboardingMessageListPlaceholder';
import EmptyListPlaceholder from '../view/EmptyListPlaceholder';
import Item from './Item';
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
        labelID = '',
        conversationMode,
        elementID,
        isSearch,
    } = useMailboxListContext();
    const { displayState, changeChecklistDisplay, canDisplayChecklist } = useGetStartedChecklist();
    const { shouldHighlight, esStatus } = useEncryptedSearchContext();
    const mailSettings = useMailModel('MailSettings');
    const { contentIndexingDone, esEnabled } = esStatus;
    const shouldOverrideCompactness = shouldHighlight() && contentIndexingDone && esEnabled;
    const isCompactView = userSettings.Density === DENSITY.COMPACT && !shouldOverrideCompactness;

    useEffect(() => {
        if (elements.length >= 5 && displayState === CHECKLIST_DISPLAY_TYPE.FULL) {
            changeChecklistDisplay(CHECKLIST_DISPLAY_TYPE.REDUCED);
        }
    }, [elements]);

    if (elements.length === 0) {
        return noPlaceholder ? null : <EmptyListPlaceholder labelID={labelID} isSearch={isSearch} isUnread={false} />;
    }

    const showUserOnboarding =
        !mailboxListLoading && !(total > 1) && canDisplayChecklist && displayState === CHECKLIST_DISPLAY_TYPE.FULL;

    return (
        <>
            <div className="w-full shrink-0" ref={listRef}>
                {elements.map((element, index) => {
                    return (
                        <Fragment key={element.ID}>
                            {element.ID.startsWith(PLACEHOLDER_ID_PREFIX) ? (
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
                                <Item
                                    conversationMode={conversationMode}
                                    isCompactView={isCompactView}
                                    labelID={labelID}
                                    loading={mailboxListLoading}
                                    columnLayout={columnLayout}
                                    elementID={elementID}
                                    element={element}
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
                                    mailSettings={mailSettings}
                                    onBack={onBack}
                                    labels={labels}
                                />
                            )}
                        </Fragment>
                    );
                })}

                {showUserOnboarding && <UserOnboardingMessageListPlaceholder location="list" />}

                {useLoadingElement && loadingElement}
            </div>
        </>
    );
};

export default MailboxListItems;
