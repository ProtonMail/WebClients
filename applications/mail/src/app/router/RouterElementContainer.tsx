import { useDeferredValue } from 'react';

import { ErrorBoundary, useActiveBreakpoint } from '@proton/components';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import ConversationView from 'proton-mail/components/conversation/ConversationView';
import MessageOnlyView from 'proton-mail/components/message/MessageOnlyView';
import { type ElementsStructure } from 'proton-mail/hooks/mailbox/useElements';
import { selectComposersCount } from 'proton-mail/store/composers/composerSelectors';
import { type ElementsStateParams } from 'proton-mail/store/elements/elementsTypes';
import { useMailSelector } from 'proton-mail/store/hooks';

import { useMailboxLayoutProvider } from './components/MailboxLayoutContext';
import { useMailSettingsViewModeEvent } from './hooks/useMailSettingsViewModeEvent';
import type { MailboxActions, RouterNavigation } from './interface';

interface Props {
    params: ElementsStateParams;
    navigation: RouterNavigation;
    elementsData: ElementsStructure;
    actions: MailboxActions;
}

export const RouterElementContainer = ({ params, navigation, elementsData, actions }: Props) => {
    const { labelID, elementID, messageID } = params;
    const { handleBack } = navigation;
    const { loading, placeholderCount, elements } = elementsData;
    const { checkedIDs, onMessageReady } = actions;

    const [mailSettings] = useMailSettings();

    const {
        isColumnLayoutPreferred,
        isConversationGroupingEnabled: immediateIsConversationContentView,
        messageContainerRef,
        isColumnModeActive,
    } = useMailboxLayoutProvider();

    // Defer view mode change until navigation completes to prevent API errors
    const isConversationContentView = useDeferredValue(immediateIsConversationContentView);

    // Used to move back when the view mode change
    useMailSettingsViewModeEvent({ navigation });

    const breakpoints = useActiveBreakpoint();
    const composersCount = useMailSelector(selectComposersCount);

    const isComposerOpened = composersCount > 0;
    const elementsLength = loading ? placeholderCount : elements.length;
    const showContentPanel = (isColumnModeActive && !!elementsLength) || !!elementID;
    const showContentView = showContentPanel && !!elementID;
    const showPlaceholder =
        !breakpoints.viewportWidth['<=small'] && (!elementID || (!!checkedIDs.length && isColumnModeActive));

    return (
        <ErrorBoundary>
            {showContentView &&
                (isConversationContentView ? (
                    <ConversationView
                        hidden={showPlaceholder}
                        labelID={labelID}
                        messageID={messageID}
                        mailSettings={mailSettings!}
                        conversationID={elementID as string}
                        onBack={handleBack}
                        onMessageReady={onMessageReady}
                        columnLayout={isColumnLayoutPreferred}
                        isComposerOpened={isComposerOpened}
                        containerRef={messageContainerRef}
                    />
                ) : (
                    <MessageOnlyView
                        hidden={showPlaceholder}
                        labelID={labelID}
                        mailSettings={mailSettings!}
                        messageID={elementID as string}
                        onBack={handleBack}
                        onMessageReady={onMessageReady}
                        columnLayout={isColumnLayoutPreferred}
                        isComposerOpened={isComposerOpened}
                    />
                ))}
        </ErrorBoundary>
    );
};
