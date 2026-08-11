import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { useModalStateObject } from '@proton/components';
import { useFlag } from '@proton/unleash/useFlag';

import { useCopyNotification } from '../../../../../hooks/useCopyNotification';
import type { HandleRegenerateMessage } from '../../../../../hooks/useLumoActions';
import { useTierErrors } from '../../../../../hooks/useTierErrors';
import type { SearchItem, ToolCallName } from '../../../../../lib/toolCall/types';
import { getMessageBlocks, getMessageContent, messagesEqualForRendering } from '../../../../../messageHelpers';
import { useIsGuest } from '../../../../../providers/IsGuestProvider';
import { useWebSearch } from '../../../../../providers/WebSearchProvider';
import type { ContentBlock, Message, MessageUsage, RetryStrategy, SiblingInfo } from '../../../../../types';
import { sendMessageCopyEvent } from '../../../../../util/telemetry';
import { isTrustedProtonLink, openTrustedLink } from '../../../../../util/trustedLinks';
import LumoButton from '../../../../Buttons/LumoButton';
import { ReferenceFilesButton } from '../../../../Files';
import LumoAvatar from '../../../../LumoAvatar/LumoAvatar/LumoAvatar';
import { LumoIcon } from '../../../../LumoIcon/LumoIcon';
import AssistantFeedbackModal from '../../../../Modals/AssistantFeedbackModal';
import LinkWarningModal from '../../../../Modals/LinkWarningModal';
import SiblingSelector from '../../../../SiblingSelector';
import { ArtifactChip } from '../../../artifact/ArtifactChip';
import { useArtifactContext } from '../../../artifact/ArtifactContext';
import { getArtifactVersionIndexForMessage } from '../../../artifact/artifactRegistry';
import {
    CREATE_ARTIFACT_TOOL_NAME,
    extractCompleteArtifactsFromBlocks,
    getCompleteArtifactBlocksKey,
} from '../../../artifact/createArtifactTool';
import LumoCopyButton from '../actionToolbar/LumoCopyButton';
import { SourcesButton } from '../toolCall/SourcesBlock';
import { extractSearchResults, parseToolCallBlock } from '../toolCall/toolCallUtils';
import { SuggestedQuestions } from './SuggestedQuestions';
import { RenderBlocks } from './toolCallTimeline/RenderBlocks';

import './AssistantMessage.scss';

const ENABLE_DEBUG_INFO = false;

interface AssistantActionToolbarProps {
    message: Message;
    isFinishedGenerating: boolean;
    siblingInfo: SiblingInfo;
    handleRegenerate: (retryStrategy?: RetryStrategy, customInstructions?: string) => void;
    generationFailed: boolean;
    results: SearchItem[] | null;
    onToggleMessageSource: () => void;
    messageChain: Message[];
    onToggleFilesManagement: (message?: Message) => void;
    markdownContainerRef: React.MutableRefObject<HTMLDivElement | null>;
    onRetryPanelToggle?: (messageId: string, show: boolean, buttonRef?: HTMLElement) => void;
    retryButtonRef: React.RefObject<HTMLButtonElement>;
    isLastMessage: boolean;
    isGenerating: boolean;
    toolCallName?: ToolCallName;
}

const AssistantActionToolbar = ({
    message,
    isFinishedGenerating,
    siblingInfo,
    generationFailed,
    results,
    onToggleMessageSource,
    messageChain,
    onToggleFilesManagement,
    markdownContainerRef,
    onRetryPanelToggle,
    retryButtonRef,
    isLastMessage,
    isGenerating,
    toolCallName,
}: AssistantActionToolbarProps) => {
    const { hasTierErrors } = useTierErrors();
    const isGuest = useIsGuest();
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const { showCopyNotification } = useCopyNotification(c('collider_2025:Notification').t`Copied to clipboard`);

    const isMessageEmpty = !message?.content || message?.content?.trim()?.length === 0;

    const handleCopy = () => {
        sendMessageCopyEvent();
        showCopyNotification();
    };

    return (
        <div className="flex flex-row flex-nowrap">
            {isLastMessage && <LumoAvatar isGenerating={isGenerating} toolCallName={toolCallName} />}
            <div
                className={clsx([
                    'action-toolbar no-print text-sm w-full',
                    'flex flex-row items-center flex-1 gap-3',
                    'justify-end items-center',
                ])}
            >
                <>
                    {!isGuest && (
                        <div className="flex flex-row flex-nowrap gap-3">
                            <AssistantFeedbackModal
                                disabled={!isFinishedGenerating}
                                setFeedbackSubmitted={setFeedbackSubmitted}
                                feedbackSubmitted={feedbackSubmitted}
                                message={message}
                            />
                        </div>
                    )}
                    {/* <div className="flex-1"></div> */}
                    <div className="flex flex-row flex-nowrap gap-3">
                        <SiblingSelector siblingInfo={siblingInfo} />
                        {results && <SourcesButton results={results} onClick={onToggleMessageSource} />}
                        <ReferenceFilesButton
                            messageChain={messageChain}
                            message={message}
                            onClick={onToggleFilesManagement}
                        />
                        <LumoCopyButton
                            textToCopy={getMessageContent(message)}
                            containerRef={markdownContainerRef}
                            onSuccess={handleCopy}
                            disabled={!isFinishedGenerating || generationFailed || isMessageEmpty}
                            className="lumo-no-copy"
                            shape="ghost"
                        />
                        <LumoButton
                            buttonRef={retryButtonRef}
                            className="lumo-no-copy"
                            shape="ghost"
                            iconName="RefreshCw"
                            title={c('collider_2025:Action').t`Regenerate`}
                            tooltipPlacement="top"
                            onClick={() => {
                                if (onRetryPanelToggle && retryButtonRef.current) {
                                    onRetryPanelToggle(message.id, true, retryButtonRef.current);
                                }
                            }}
                            disabled={!isFinishedGenerating || generationFailed || hasTierErrors}
                        />
                    </div>
                </>
                {/* <div>{message.content}</div> */}
            </div>
        </div>
    );
};

interface AssistantMessageProps {
    isLoading?: boolean;
    isRunning: boolean;
    message: Message;
    siblingInfo: SiblingInfo;
    messageChainRef: React.MutableRefObject<HTMLDivElement | null>;
    sourcesContainerRef: React.MutableRefObject<HTMLDivElement | null>;
    handleRegenerateMessage: HandleRegenerateMessage;
    isLastMessage?: boolean;
    handleOpenSources: (message: Message) => void;
    handleOpenFiles: (message?: Message) => void;
    messageChain: Message[];
    isGenerating: boolean;
    onToggleMessageSource: (message: Message) => void;
    onToggleFilesManagement: (message?: Message) => void;
    onRetryPanelToggle?: (messageId: string, show: boolean, buttonRef?: HTMLElement) => void;
}

// Add CSS to enforce consistent message width
// const messageContainerStyle = {
//     minWidth: '100%',
//     width: '100%',
//     maxWidth: '100%',
//     boxSizing: 'border-box' as const,
// };

function DebugInfo(props: {
    isLoading: boolean;
    hasToolCall: boolean;
    blocks: ContentBlock[];
    searchResults: SearchItem[];
    usage?: MessageUsage;
}) {
    if (!ENABLE_DEBUG_INFO) {
        return null;
    }
    const { usage } = props;
    return (
        <div className="border border-weak rounded p-2" style={{ fontFamily: 'monospace' }}>
            <p className="color-weak font-bold mb-1">DEBUG INFO</p>
            <p className="color-weak m-0">isLoading: {JSON.stringify(props.isLoading)}</p>
            <p className="color-weak m-0">hasToolCall: {JSON.stringify(props.hasToolCall)}</p>
            <p className="color-weak m-0 break-all">blocks: {JSON.stringify(props.blocks.length)}</p>
            <p className="color-weak m-0">searchResults: {JSON.stringify(props.searchResults !== null)}</p>
            {usage ? (
                <p className="color-weak m-0 break-all">
                    usage: prompt={usage.promptTokens ?? '—'} completion={usage.completionTokens ?? '—'} total=
                    {usage.totalTokens ?? '—'} files={usage.ctxFilesTokenEstimate ?? '—'} baseline=
                    {usage.promptTokens !== undefined ? usage.promptTokens - (usage.ctxFilesTokenEstimate ?? 0) : '—'}
                </p>
            ) : (
                <p className="color-weak m-0">usage: none</p>
            )}
        </div>
    );
}

const AssistantMessage = ({
    isLoading,
    isRunning: _isRunning,
    message,
    siblingInfo,
    messageChainRef: _messageChainRef,
    sourcesContainerRef,
    handleRegenerateMessage,
    isLastMessage = false,
    handleOpenSources,
    handleOpenFiles,
    messageChain,
    isGenerating,
    onRetryPanelToggle,
}: AssistantMessageProps) => {
    const { isWebSearchButtonToggled } = useWebSearch();
    const isFinishedGenerating = message?.status !== undefined;
    const generationFailed = message.status === 'failed';
    const doNotShowEmptyMessage = isGenerating;
    const linkWarningModal = useModalStateObject();
    const [currentLink, setCurrentLink] = useState<string>('');
    const markdownContainerRef = useRef<HTMLDivElement>(null);
    const retryButtonRef = useRef<HTMLButtonElement>(null);

    const showNextPromptSuggestionEnabled = useFlag('LumoShowNextPromptSuggestions');

    // Get blocks for interleaved rendering
    const blocks = useMemo(
        () => getMessageBlocks(message),
        [message.blocks, message.content, message.toolCall, message.toolResult]
    );
    const hasContent = blocks.length > 0;

    // Extract create_artifact tool calls directly from the structured blocks — no text parsing.
    // In practice arguments arrive as a parsed object in one shot (see DESIGN.md); partial
    // string arguments are ignored until JSON completes.
    const artifactBlocksKey = useMemo(() => {
        return getCompleteArtifactBlocksKey(blocks);
    }, [blocks]);
    const completeArtifacts = useMemo(() => {
        return extractCompleteArtifactsFromBlocks(blocks);
    }, [artifactBlocksKey, blocks]);

    const hasArtifacts = completeArtifacts.length > 0;

    // Hide create_artifact tool_call/tool_result blocks from the generic tool-call timeline —
    // ArtifactChip renders them instead, below.
    const cleanedBlocks = useMemo(() => {
        if (!hasArtifacts) {
            return blocks;
        }
        const artifactCallIndices = new Set<number>();
        blocks.forEach((block, idx) => {
            const parsed = block.type === 'tool_call' ? (block.toolCall as { name?: string } | undefined) : undefined;
            if (parsed?.name === CREATE_ARTIFACT_TOOL_NAME) {
                artifactCallIndices.add(idx);
            }
        });
        return blocks.filter((block, idx) => {
            if (artifactCallIndices.has(idx)) {
                return false;
            }
            return !(block.type === 'tool_result' && artifactCallIndices.has(idx - 1));
        });
    }, [blocks, hasArtifacts]);

    const { selectedId, openArtifact, registry, panelUserClosed, resetPanelUserClosed } = useArtifactContext();

    const wasGeneratingRef = useRef(isGenerating);
    useEffect(() => {
        const generationStarted = !wasGeneratingRef.current && isGenerating;
        wasGeneratingRef.current = isGenerating;

        if (isLastMessage && generationStarted) {
            resetPanelUserClosed();
        }
    }, [isLastMessage, isGenerating, resetPanelUserClosed]);

    const hasAutoOpenedRef = useRef(false);
    useEffect(() => {
        hasAutoOpenedRef.current = false;
    }, [message.id]);

    useEffect(() => {
        if (!isLastMessage || completeArtifacts.length === 0 || !completeArtifacts[0] || hasAutoOpenedRef.current) {
            return;
        }

        const artifact = completeArtifacts[0];
        const versionIndex = getArtifactVersionIndexForMessage(registry, artifact.id, message.id);
        if (versionIndex === null) {
            return;
        }

        if (panelUserClosed) {
            return;
        }

        if (selectedId !== null && selectedId !== artifact.id) {
            return;
        }

        hasAutoOpenedRef.current = true;
        openArtifact(artifact.id, versionIndex);
    }, [isLastMessage, completeArtifacts, registry, message.id, panelUserClosed, selectedId, openArtifact]);

    // Extract search results for legacy sources button
    const searchResults = useMemo(() => extractSearchResults(blocks), [blocks]);

    // Check if any block is a tool call (for loading state)
    const hasToolCall = blocks.some((b) => b.type === 'tool_call');
    const lastToolCall = blocks.findLast((b) => b.type === 'tool_call');
    const lastToolCallParsed = lastToolCall?.type === 'tool_call' ? parseToolCallBlock(lastToolCall) : null;

    const handleLinkClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
            e.preventDefault();

            if (isTrustedProtonLink(href)) {
                openTrustedLink(href);
                return;
            }

            setCurrentLink(href);
            linkWarningModal.openModal(true);
        },
        [linkWarningModal.openModal]
    );

    const onToggleMessageSource = useCallback(() => {
        handleOpenSources(message);
    }, [handleOpenSources, message]);

    const handleRegenerate = useCallback(
        (retryStrategy: RetryStrategy = 'simple', customInstructions?: string) => {
            void handleRegenerateMessage(message, isWebSearchButtonToggled, retryStrategy, customInstructions);
        },
        [handleRegenerateMessage, message, isWebSearchButtonToggled]
    );

    // Hide message if it's loading and truly empty, except the last message while
    // generating — show the bubble immediately so the user gets feedback before
    // the first streamed token arrives.
    const shouldShow = !isLoading || hasContent || hasToolCall || (isGenerating && isLastMessage);

    const shouldShowNextPromptSuggestions =
        showNextPromptSuggestionEnabled && isLastMessage && isFinishedGenerating && !generationFailed;

    return (
        <>
            <div className="gap-2 relative w-full">
                {shouldShow && (
                    <div
                        className="assistant-msg-container w-full flex flex-row flex-nowrap rounded-xl p-bg-norm"
                        style={{
                            '--min-h-custom': '62px',
                        }}
                    >
                        <div className="w-full flex *:min-size-auto flex-nowrap items-start flex-column gap-2">
                            <DebugInfo
                                isLoading={isLoading || false}
                                hasToolCall={hasToolCall}
                                blocks={blocks}
                                searchResults={searchResults ?? []}
                                usage={message.usage}
                            />
                            {isLoading && !hasToolCall && !isGenerating ? (
                                <div className="w-full pt-1" style={{ minHeight: '2em' }}>
                                    <div className="rectangle-skeleton keep-motion"></div>
                                </div>
                            ) : (
                                <div className="w-full" style={{ minHeight: '2em' }}>
                                    {/* Always show RenderBlocks if there's reasoning, content, or tool calls */}
                                    {hasContent || doNotShowEmptyMessage || message.reasoning || hasToolCall ? (
                                        <>
                                            <RenderBlocks
                                                blocks={cleanedBlocks}
                                                message={message}
                                                isGenerating={isGenerating}
                                                isLastMessage={isLastMessage}
                                                handleLinkClick={handleLinkClick}
                                                sourcesContainerRef={sourcesContainerRef}
                                                messageContentContainerRef={markdownContainerRef}
                                                reasoning={message.reasoning}
                                            />
                                            {hasArtifacts && (
                                                <div className="flex flex-column gap-1 mt-1">
                                                    {completeArtifacts.map((artifact) => (
                                                        <ArtifactChip
                                                            key={`${artifact.id}-${message.id}`}
                                                            artifact={artifact}
                                                            messageId={message.id}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <EmptyMessage />
                                    )}

                                    <AssistantActionToolbar
                                        message={message}
                                        isFinishedGenerating={isFinishedGenerating}
                                        handleRegenerate={handleRegenerate}
                                        siblingInfo={siblingInfo}
                                        generationFailed={generationFailed}
                                        results={searchResults}
                                        onToggleMessageSource={onToggleMessageSource}
                                        messageChain={messageChain}
                                        onToggleFilesManagement={(filterMessage) => handleOpenFiles(filterMessage)}
                                        markdownContainerRef={markdownContainerRef}
                                        onRetryPanelToggle={onRetryPanelToggle}
                                        retryButtonRef={retryButtonRef}
                                        isLastMessage={isLastMessage}
                                        isGenerating={isGenerating}
                                        toolCallName={lastToolCallParsed?.name}
                                    />

                                    {shouldShowNextPromptSuggestions && message.suggestedQuestions && (
                                        <SuggestedQuestions questions={message.suggestedQuestions} />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {isLastMessage && isFinishedGenerating && (
                    <div className="w-full text-right text-sm color-hint">
                        {c('collider_2025:Info').t`Conversation encrypted`}
                    </div>
                )}
                {/* <p>{message?.content}</p>
                <p>{message.toolCall}</p>
                <p>{message.toolResult}</p> */}
            </div>

            {linkWarningModal.render && (
                <LinkWarningModal
                    {...linkWarningModal.modalProps}
                    url={currentLink}
                    onClose={linkWarningModal.modalProps.onClose}
                />
            )}
        </>
    );
};

const EmptyMessage = () => (
    <>
        <div className="flex flex-row items-center gap-2 color-hint px-1 py-2">
            <LumoIcon name="Info" size={16} />
            <p className="text-sm">{c('collider_2025:Info').t`This message is empty. Sorry about that.`}</p>
        </div>
    </>
);

// Memoize to prevent unnecessary re-renders
export default memo(AssistantMessage, (prevProps, nextProps) => {
    return (
        messagesEqualForRendering(prevProps.message, nextProps.message) &&
        prevProps.message.suggestedQuestions?.length === nextProps.message.suggestedQuestions?.length &&
        prevProps.isGenerating === nextProps.isGenerating &&
        prevProps.isLastMessage === nextProps.isLastMessage
    );
});
