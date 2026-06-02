import { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { c } from 'ttag';

import { Icon } from '@proton/components';
import useDocumentTitle from '@proton/components/hooks/useDocumentTitle';
import type { IconName } from '@proton/icons/types';

import { LUMO_FULL_APP_TITLE } from '../../constants';
import { useSafeUser } from '../../contexts/SafeUserContext';
import type { RouteParams } from '../../entrypoint/auth/RouterContainer';
import { DEFAULT_AGENT_ICON } from '../../features/agents/constants';
import { useQueryParam, useSkillParam, useThemeParam } from '../../hooks';
import { useConversationAgent } from '../../hooks/useConversationAgent';
import { useLumoActions } from '../../hooks/useLumoActions';
import { useLumoNavigate as useNavigate } from '../../hooks/useLumoNavigate';
import { ComposerActionsProvider } from '../../providers/ComposerActionsProvider';
import { useConversation } from '../../providers/ConversationProvider';
import { DragAreaProvider } from '../../providers/DragAreaProvider';
import { ModelTierProvider } from '../../providers/ModelTierProvider';
import { WebSearchProvider } from '../../providers/WebSearchProvider';
import { useLumoMemoSelector, useLumoSelector } from '../../redux/hooks';
import {
    selectConversationById,
    selectMessagesByConversationId,
    selectProvisionalAttachments,
    selectSpaceByConversationId,
} from '../../redux/selectors';
import type { CustomAgent } from '../../redux/slices/lumoUserSettings';
import { type ConversationId, ConversationStatus } from '../../types';
import { ComposerMode } from '../../types';
import { ComposerComponent } from '../Composer/ComposerComponent';
import ConversationComponent from '../Conversation/ConversationComponent';

import '../Conversation/Conversation.scss';

/**
 * Intro shown above the composer before the first message. When an agent is loaded via
 * `?skill=`, we surface its name and description so the user immediately understands what
 * this assistant can help with.
 */
const AgentWelcome = ({ agent }: { agent?: CustomAgent }) => {
    const icon = (agent?.icon as IconName) || DEFAULT_AGENT_ICON;
    const title = agent?.name || LUMO_FULL_APP_TITLE;
    const description =
        agent?.description?.trim() ||
        c('collider_2025:Info').t`Ask a question to get started. Your conversation is private.`;

    return (
        <div className="flex flex-column items-center text-center gap-3 mb-6 px-4">
            <span
                className="flex items-center justify-center rounded-full bg-weak ratio-square w-custom"
                style={{ '--w-custom': '4rem' } as React.CSSProperties}
            >
                <Icon name={icon} size={7} className="color-norm" />
            </span>
            <h1 className="text-bold text-2xl m-0">{title}</h1>
            <p className="color-weak m-0 max-w-custom" style={{ '--max-w-custom': '32rem' } as React.CSSProperties}>
                {description}
            </p>
        </div>
    );
};

const AgentPageInner = () => {
    const user = useSafeUser();
    const navigate = useNavigate();
    const { conversationId: curConversationId } = useParams<RouteParams>();
    const { setConversationId } = useConversation();

    const provisionalAttachments = useLumoSelector(selectProvisionalAttachments);
    const initialQuery = useQueryParam('q');

    // Activate an agent from a `?skill=<agentId>` link.
    useSkillParam();
    // Match the host page's theme when embedded (e.g. `?theme=dark` from the account iframe).
    useThemeParam();

    const { activeAgent } = useConversationAgent(curConversationId);

    const messageMap = useLumoMemoSelector(selectMessagesByConversationId, [curConversationId]);
    const conversation = useLumoSelector(selectConversationById(curConversationId));
    const space = useLumoSelector(selectSpaceByConversationId(curConversationId));

    const isProcessingAttachment = provisionalAttachments.some((a) => a.processing);
    const isGenerating = conversation?.status === ConversationStatus.GENERATING;

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
    } = useLumoActions({
        user,
        conversationId: curConversationId,
        space,
        messageMap,
        provisionalAttachments,
        navigateCallback,
    });

    useDocumentTitle(activeAgent?.name || LUMO_FULL_APP_TITLE);

    // Keep ConversationProvider in sync with the /c/:conversationId param.
    useEffect(() => {
        setConversationId(curConversationId);
        return () => setConversationId(undefined);
    }, [curConversationId, setConversationId]);

    // Guests have no remote persistence: if we land on a conversation that doesn't exist
    // locally (e.g. a stale link), fall back to the welcome screen.
    useEffect(() => {
        if (curConversationId && conversation === undefined) {
            navigate('/');
        }
    }, [curConversationId, conversation, navigate]);

    return (
        <ComposerActionsProvider handleSendMessage={handleSendMessage}>
            <div className="relative flex-1 min-h-0 flex flex-column flex-nowrap reset4print overflow-auto">
                {!curConversationId ? (
                    <div
                        className="flex flex-column flex-nowrap flex-1 mx-auto justify-center w-full max-w-custom px-4 py-8"
                        style={{ '--max-w-custom': '43rem' } as React.CSSProperties}
                    >
                        <AgentWelcome agent={activeAgent} />
                        <ComposerComponent
                            composerMode={ComposerMode.NEW_CONVERSATION}
                            handleSendMessage={handleSendMessage}
                            isProcessingAttachment={isProcessingAttachment}
                            className="w-full"
                            initialQuery={initialQuery || undefined}
                            isAgent
                        />
                    </div>
                ) : (
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
                        initialQuery={initialQuery || undefined}
                        isAgent
                    />
                )}
            </div>
        </ComposerActionsProvider>
    );
};

/**
 * Simplified, single-agent chat surface served at `/agent?skill=<agentId>`. Runs in guest
 * mode (no authentication) for near-instant load, with no sidebar.
 */
export const AgentPage = () => {
    return (
        <DragAreaProvider>
            <WebSearchProvider>
                <ModelTierProvider>
                    <AgentPageInner />
                </ModelTierProvider>
            </WebSearchProvider>
        </DragAreaProvider>
    );
};
