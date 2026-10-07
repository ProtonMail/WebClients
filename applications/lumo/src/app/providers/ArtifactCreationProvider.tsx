import { type ReactNode, createContext, useCallback, useContext, useEffect } from 'react';

import { resolveArtifactCreationEnabled } from '../components/Conversation/helper';
import { useLumoDispatch, useLumoSelector } from '../redux/hooks';
import { clearPendingArtifactCreation, setPendingArtifactCreation } from '../redux/slices/composerActions';
import { pushConversationRequest, setConversationArtifactCreation } from '../redux/slices/core/conversations';
import { sendArtifactCreationToggledEvent } from '../util/telemetry';
import { useConversation } from './ConversationProvider';

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
    const { conversationId } = useConversation();
    const conversationExists = useLumoSelector((state) => {
        return conversationId !== undefined && state.conversations[conversationId] !== undefined;
    });
    const isArtifactCreationEnabled = useLumoSelector((state) => {
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

    const handleArtifactCreationToggle = useCallback(() => {
        const scope = conversationId && conversationExists ? 'conversation' : 'pending-new-chat';
        sendArtifactCreationToggledEvent(isArtifactCreationEnabled, scope);
        const newValue = !isArtifactCreationEnabled;
        if (conversationId && conversationExists) {
            dispatch(setConversationArtifactCreation({ id: conversationId, artifactCreation: newValue }));
            dispatch(pushConversationRequest({ id: conversationId }));
        } else {
            dispatch(setPendingArtifactCreation(newValue));
        }
    }, [isArtifactCreationEnabled, conversationId, conversationExists, dispatch]);

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
