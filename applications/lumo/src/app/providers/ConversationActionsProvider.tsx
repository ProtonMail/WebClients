import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';

import { ComposerPreInputPortalProvider } from '../components/Composer/ComposerPreInputPortal';
import type {
    HandleEditMessage,
    HandleRegenerateMessage,
    HandleSaveManualArtifactEdit,
    HandleSendArtifactAction,
    HandleSendAskUserQuestionsToolResponse,
    HandleSendCreateScheduleToolResponse,
    HandleSendMessage,
} from '../hooks/useLumoActions';
import type { ConversationError } from '../redux/slices/meta/errors';
import type { Message, SiblingInfo } from '../types';

interface ConversationActionsContextType {
    handleSendMessage: HandleSendMessage;
    handleSendAskUserQuestionsToolResponse: HandleSendAskUserQuestionsToolResponse;
    handleSendCreateScheduleToolResponse: HandleSendCreateScheduleToolResponse;
    handleSendArtifactAction: HandleSendArtifactAction;
    handleSaveManualArtifactEdit: HandleSaveManualArtifactEdit;
    handleAbort: () => void;
    handleEditMessage: HandleEditMessage;
    handleRegenerateMessage: HandleRegenerateMessage;
    getSiblingInfo: (message: Message) => SiblingInfo;
    handleRetryGeneration: (error: ConversationError) => void;
    messageChain: Message[];
    messageChainRef: React.MutableRefObject<HTMLDivElement | null>;
}

const ConversationActionsContext = createContext<ConversationActionsContextType | undefined>(undefined);

interface ConversationActionsProviderProps {
    children: ReactNode;
    handleSendMessage: HandleSendMessage;
    handleSendAskUserQuestionsToolResponse: HandleSendAskUserQuestionsToolResponse;
    handleSendCreateScheduleToolResponse: HandleSendCreateScheduleToolResponse;
    handleSendArtifactAction: HandleSendArtifactAction;
    handleSaveManualArtifactEdit: HandleSaveManualArtifactEdit;
    handleAbort: () => void;
    handleEditMessage: HandleEditMessage;
    handleRegenerateMessage: HandleRegenerateMessage;
    getSiblingInfo: (message: Message) => SiblingInfo;
    handleRetryGeneration: (error: ConversationError) => void;
    messageChain: Message[];
    messageChainRef: React.MutableRefObject<HTMLDivElement | null>;
}

export const ConversationActionsProvider = ({
    children,
    handleSendMessage,
    handleSendAskUserQuestionsToolResponse,
    handleSendCreateScheduleToolResponse,
    handleSendArtifactAction,
    handleSaveManualArtifactEdit,
    handleAbort,
    handleEditMessage,
    handleRegenerateMessage,
    getSiblingInfo,
    handleRetryGeneration,
    messageChain,
    messageChainRef,
}: ConversationActionsProviderProps) => {
    return (
        <ConversationActionsContext.Provider
            value={{
                handleSendMessage,
                handleSendAskUserQuestionsToolResponse,
                handleSendCreateScheduleToolResponse,
                handleSendArtifactAction,
                handleSaveManualArtifactEdit,
                handleAbort,
                handleEditMessage,
                handleRegenerateMessage,
                getSiblingInfo,
                handleRetryGeneration,
                messageChain,
                messageChainRef,
            }}
        >
            <ComposerPreInputPortalProvider>{children}</ComposerPreInputPortalProvider>
        </ConversationActionsContext.Provider>
    );
};

export const useConversationActions = (): ConversationActionsContextType => {
    const context = useContext(ConversationActionsContext);
    if (!context) {
        throw new Error('useConversationActions must be used within a ConversationActionsProvider');
    }
    return context;
};
