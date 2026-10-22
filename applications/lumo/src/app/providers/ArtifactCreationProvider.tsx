import { type ReactNode, createContext, useCallback, useContext, useEffect } from 'react';

import { messageHasCreateArtifactToolCall } from '../components/Conversation/artifact/artifactGenerationState';
import { resolveArtifactCreationEnabled } from '../components/Conversation/helper';
import { useLumoDispatch, useLumoSelector, useLumoStore } from '../redux/hooks';
import { selectMessagesByConversationId } from '../redux/selectors';
import { clearPendingArtifactCreation, setPendingArtifactCreation } from '../redux/slices/composerActions';
import { pushConversationRequest, setConversationArtifactCreation } from '../redux/slices/core/conversations';
import { sendArtifactCreationToggledEvent } from '../util/telemetry';
import { useConversation } from './ConversationProvider';
import { useIsGuest } from './IsGuestProvider';

interface ArtifactCreationContextType {
    isArtifactCreationEnabled: boolean;
    handleArtifactCreationToggle: () => void;
}

const ArtifactCreationContext = createContext<ArtifactCreationContextType | undefined>(undefined);

interface ArtifactCreationProviderProps {
    children: ReactNode;
}

/**
 * Per-conversation artifact-creation toggle for the composer tool menu. The global default lives in
 * `LumoUserSettings.automaticArtifactCreation` (Settings modal); toggling here only affects the
 * current conversation — or, on the new-chat page, the conversation about to be created.
 */
export const ArtifactCreationProvider = ({ children }: ArtifactCreationProviderProps) => {
    const dispatch = useLumoDispatch();
    const store = useLumoStore();
    const isGuest = useIsGuest();
    const { conversationId } = useConversation();
    const conversationExists = useLumoSelector((state) => {
        return conversationId !== undefined && state.conversations[conversationId] !== undefined;
    });
    const isArtifactCreationEnabled = useLumoSelector((state) => {
        if (isGuest) {
            return false;
        }
        return resolveArtifactCreationEnabled(state, conversationId);
    });
    const hasPendingChoice = useLumoSelector((state) => {
        return state.composerActions.pendingArtifactCreation !== null;
    });

    // A choice made on the new-chat page belongs to that new chat only. If the user opens an
    // existing conversation instead, drop it so it doesn't leak into a later new chat.
    useEffect(() => {
        if (conversationExists && hasPendingChoice) {
            dispatch(clearPendingArtifactCreation());
        }
    }, [conversationExists, hasPendingChoice, dispatch]);

    useEffect(() => {
        if (isGuest && hasPendingChoice) {
            dispatch(clearPendingArtifactCreation());
        }
    }, [isGuest, hasPendingChoice, dispatch]);

    const handleArtifactCreationToggle = useCallback(() => {
        if (isGuest) {
            return;
        }
        const scope = conversationId && conversationExists ? 'conversation' : 'pending-new-chat';
        // Read at click time rather than subscribed to: only the telemetry needs it.
        const state = store.getState();
        const conversationHasArtifact =
            scope === 'conversation' &&
            Object.values(selectMessagesByConversationId(conversationId)(state)).some((message) => {
                return messageHasCreateArtifactToolCall(message) || message.artifactManualEdit !== undefined;
            });
        sendArtifactCreationToggledEvent({
            isCurrentlyEnabled: isArtifactCreationEnabled,
            scope,
            globalDefault: state.lumoUserSettings?.automaticArtifactCreation ?? true,
            conversationHasArtifact,
        });
        const newValue = !isArtifactCreationEnabled;
        if (conversationId && conversationExists) {
            dispatch(setConversationArtifactCreation({ id: conversationId, artifactCreation: newValue }));
            dispatch(pushConversationRequest({ id: conversationId }));
        } else {
            dispatch(setPendingArtifactCreation(newValue));
        }
    }, [isGuest, isArtifactCreationEnabled, conversationId, conversationExists, dispatch, store]);

    const value = {
        isArtifactCreationEnabled,
        handleArtifactCreationToggle,
    };

    return <ArtifactCreationContext.Provider value={value}>{children}</ArtifactCreationContext.Provider>;
};

export const useArtifactCreation = (): ArtifactCreationContextType => {
    const context = useContext(ArtifactCreationContext);
    if (context === undefined) {
        throw new Error('useArtifactCreation must be used within an ArtifactCreationProvider');
    }
    return context;
};
