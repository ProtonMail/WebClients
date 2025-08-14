import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import useDocumentTitle from '@proton/components/hooks/useDocumentTitle';
import type { User } from '@proton/shared/lib/interfaces';

import { LUMO_FULL_APP_TITLE } from '../../constants';

import type { RouteParams } from '../../entrypoint/auth/RouterContainer';
import { useLumoActions } from '../../hooks/useLumoActions';
import { useLumoNavigate as useNavigate } from '../../hooks/useLumoNavigate';
import { useConversation } from '../../providers/ConversationProvider';
import { DragAreaProvider, useDragArea } from '../../providers/DragAreaProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { PandocProvider } from '../../providers/PandocProvider';
import { useLumoDispatch, useLumoMemoSelector, useLumoSelector } from '../../redux/hooks';
import {
    selectConversationById,
    selectConversations,
    selectMessagesByConversationId,
    selectProvisionalAttachments,
    selectSpaceByConversationId,
} from '../../redux/selectors';
import { resetAllContextFilters } from '../../redux/slices/contextFilters';
import { clearProvisionalAttachments } from '../../redux/slices/core/attachments';
import { EMPTY_CONVERSATION_MAP, pullConversationRequest } from '../../redux/slices/core/conversations';
import { type ConversationId, ConversationStatus } from '../../types';
import ConversationSkeleton from '../components/ConversationSkeleton';
import ConversationComponent from './ConversationComponent';
import MainContainer from './MainContainer';

import './InteractiveConversation.scss';

export type InteractiveConversationComponentProps = { user: User | undefined };

const InteractiveConversationComponentInner = ({ user }: InteractiveConversationComponentProps) => {
    // ** Hooks **
    const navigate = useNavigate();
    const dispatch = useLumoDispatch();
    const { conversationId: curConversationId } = useParams<RouteParams>();
    const { setConversationId } = useConversation();
    const isGuest = useIsGuest();
    const provisionalAttachments = useLumoSelector(selectProvisionalAttachments);
    const { onDragOver, onDragEnter, onDragLeave, onDrop } = useDragArea();

    // ** State & refs **
    const [isWebSearchButtonToggled, setIsWebSearchButtonToggled] = useState<boolean>(false);

    // ** Selectors **
    const messageMap = useLumoMemoSelector(selectMessagesByConversationId, [curConversationId]);
    const conversation = useLumoSelector(selectConversationById(curConversationId));
    const conversations = useLumoSelector(selectConversations);
    const space = useLumoSelector(selectSpaceByConversationId(curConversationId));

    // ** Derived values **
    const conversationTitle = conversation?.title.trim() || '';
    // const spaceId = conversation?.spaceId;
    const isProcessingAttachment = provisionalAttachments.some((a) => a.processing);
    const remoteWasSynced = conversations !== EMPTY_CONVERSATION_MAP;
    // const displayName = user?.DisplayName ?? ''; //TODO: if not using user, can update guest vs authorized use of component
    const isGenerating = conversation?.status && conversation.status === ConversationStatus.GENERATING;
    // const welcomeText = displayName
    //     ? c('collider_2025:Title').jt`Hi ${displayName}, how can I help you today?`
    //     : c('collider_2025:Title').t`Hello, how can I help you today?`;

    const isLoading = !isGuest && (!remoteWasSynced || (curConversationId && !messageMap));

    const navigateCallback = useCallback((conversationId: ConversationId) => {
        navigate(`/c/${conversationId}`);
    }, []);

    const {
        messageChain,
        handleSendMessage,
        handleEditMessage,
        handleRegenerateMessage,
        getSiblingInfo,
        messageChainRef,
        handleAbort,
        handleRetryGeneration,
        // newMessageRef,
    } = useLumoActions({
        user,
        conversationId: curConversationId,
        space,
        messageMap,
        provisionalAttachments,
        navigateCallback,
    });

    // ** Callbacks **
    const toggleWebSearch = useCallback(() => {
        setIsWebSearchButtonToggled((prev) => !prev);
    }, []);

    // ** Effects & related **

    // Set document title
    useDocumentTitle(conversationTitle ? `${conversationTitle} | Lumo` : LUMO_FULL_APP_TITLE);

    // Synchronize the /c/:conversationId parameter with ConversationProvider.
    useEffect(() => {
        setConversationId(curConversationId);

        // Clear context filters and provisional attachments when switching conversations
        // to prevent them from previous conversations affecting the current one
        // Only clear if we're switching to a different conversation (not initial load)
        if (curConversationId) {
            dispatch(resetAllContextFilters());
            dispatch(clearProvisionalAttachments());
        }

        return () => setConversationId(undefined);
    }, [curConversationId, dispatch]);

    // When browsing to a new conversation, we do two things:
    //   1. Check if this id really exists, if not navigate away asap
    //     - Otherwise, the user may post messages to a nonexistent conversation id
    //   2. Initiate a background sync of the conversation messages.
    //     - Before that time, conversations are only fetched shallowly: title and metadata,
    //       but not the messages, because they're expensive to read from storage.
    //     - getConversationRequest() will fetch the message list, then fetch the messages individually.
    //     - The redux state is refreshed with the arrival of new messages, which should update the UI.
    //     - This sync only happens in auth mode, since guests don't have remote persistence.
    useEffect(
        () => {
            if (!curConversationId) return;
            if (isGuest) {
                const conversationExistsLocally = conversation !== undefined;
                if (!conversationExistsLocally) {
                    console.log('conversation does not exist locally, going home');
                    navigate(`/`);
                }
            } /* !isGuest */ else {
                console.log('new conversation effect: persistence.ready check');
                // if (!persistence?.ready) return;

                console.log('new conversation effect: local existence check');
                const conversationDoesNotExistLocally = remoteWasSynced && conversation === undefined;
                if (conversationDoesNotExistLocally) {
                    console.log('conversation does not exist locally, going home');
                    navigate(`/`);
                    return;
                }

                // Don't refresh the conversation if the message is being generated. This would cause
                // the message being generated (more up-to-date locally) to be replaced by an older remote copy.
                console.log('new conversation effect: isGenerating check');
                if (isGenerating) return;

                // Initiate bg sync, fetch messages.
                // If successful, this will change the redux state and the component will be reloaded
                // with `messageMap` filled. This won't re-run the effect however.
                console.log(
                    `new conversation effect: calling getConversationRequest(curConversationId=${curConversationId})`
                );
                void dispatch(pullConversationRequest({ id: curConversationId }));

                
            }
        },
        // This effect is meant to run when we browse to a different /c/:conversation_id.
        // It is also re-ran if the remote gets synced for the first time
        // (remoteWasSynced will transition from false to true).
        // It is deliberately not re-ran when the conversation object changes (e.g. new title) or
        // when the messageMap changes (e.g. new message posted).
        [dispatch, curConversationId, remoteWasSynced]
    );

    // ** Main layout **
    return (
        <div
            className="relative flex-1 min-h-0 flex flex-column *:min-size-auto flex-nowrap reset4print overflow-auto"
            onDrop={onDrop}
            onDragLeave={onDragLeave}
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
        >
            {!curConversationId && (
                <MainContainer
                    isProcessingAttachment={isProcessingAttachment}
                    handleSendMessage={handleSendMessage}
                    isWebSearchButtonToggled={isWebSearchButtonToggled}
                    onToggleWebSearch={toggleWebSearch}
                />
            )}
            {curConversationId && isLoading && <ConversationSkeleton />}
            {curConversationId && !isLoading && (
                <ConversationComponent
                    key={curConversationId}
                    conversation={conversation}
                    handleSendMessage={handleSendMessage}
                    handleAbort={handleAbort}
                    isGenerating={isGenerating}
                    isProcessingAttachment={isProcessingAttachment}
                    messageChainRef={messageChainRef}
                    messageChain={messageChain}
                    handleRegenerateMessage={handleRegenerateMessage}
                    handleEditMessage={handleEditMessage}
                    getSiblingInfo={getSiblingInfo}
                    handleRetryGeneration={handleRetryGeneration}
                    isWebSearchButtonToggled={isWebSearchButtonToggled}
                    onToggleWebSearch={toggleWebSearch}
                />
            )}
        </div>
    );
};

export const InteractiveConversationComponent = (props: InteractiveConversationComponentProps) => {
    return (
        <DragAreaProvider>
            <PandocProvider>
                <InteractiveConversationComponentInner {...props} />
            </PandocProvider>
        </DragAreaProvider>
    );
};
