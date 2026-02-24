import { memo, useCallback, useMemo, useRef, useState } from 'react';

import type { HandleRegenerateMessage } from 'applications/lumo/src/app/hooks/useLumoActions';
import type { ContentBlock, Message, RetryStrategy, SiblingInfo } from 'applications/lumo/src/app/types';
import { clsx } from 'clsx';
import { c } from 'ttag';

import { Icon, useModalStateObject } from '@proton/components';

import { useCopyNotification } from '../../../../../hooks/useCopyNotification';
import { useTierErrors } from '../../../../../hooks/useTierErrors';
import type { SearchItem } from '../../../../../lib/toolCall/types';
import { getMessageBlocks, messagesEqualForRendering } from '../../../../../messageHelpers';
import { useIsGuest } from '../../../../../providers/IsGuestProvider';
import { useWebSearch } from '../../../../../providers/WebSearchProvider';
import { sendMessageCopyEvent } from '../../../../../util/telemetry';

import LumoCopyButton from '../actionToolbar/LumoCopyButton';
import { SourcesButton } from '../toolCall/SourcesBlock';
import { extractSearchResults, parseToolCallBlock } from '../toolCall/toolCallUtils';
import { AvatarAndNotice } from './AvatarAndNotice';
import { RenderBlocks } from './toolCallTimeline/RenderBlocks';

import './AssistantMessage.scss';
import SiblingSelector from "../../../../SiblingSelector";
import {ReferenceFilesButton} from "../../../../Files";
import LumoButton from "../../../../Buttons/LumoButton";
import LinkWarningModal from "../../../../Modals/LinkWarningModal";
import AssistantFeedbackModal from '../../../../Modals/AssistantFeedbackModal';

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
        <div
            className={clsx([
                'action-toolbar no-print text-sm w-full mt-2  ',
                'flex flex-row items-center flex-1 gap-3',
                'justify-space-between items-center',
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
                <div className="flex-1"></div>
                <div className="flex flex-row flex-nowrap gap-3">
                    <SiblingSelector siblingInfo={siblingInfo} />
                    {results && <SourcesButton results={results} onClick={onToggleMessageSource} />}
                    <ReferenceFilesButton
                        messageChain={messageChain}
                        message={message}
                        onClick={onToggleFilesManagement}
                    />
                    <LumoCopyButton
                        containerRef={markdownContainerRef}
                        onSuccess={handleCopy}
                        disabled={!isFinishedGenerating || generationFailed || isMessageEmpty}
                        className="lumo-no-copy"
                    />
                    <LumoButton
                        buttonRef={retryButtonRef}
                        className="lumo-no-copy"
                        iconName="arrows-rotate"
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
        </div>
        // </div>
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
}) {
    if (!ENABLE_DEBUG_INFO) {
        return null;
    }
    return (
        <div className="border border-weak rounded p-2" style={{ fontFamily: 'monospace' }}>
            <p className="color-weak font-bold mb-1">DEBUG INFO</p>
            <p className="color-weak m-0">isLoading: {JSON.stringify(props.isLoading)}</p>
            <p className="color-weak m-0">hasToolCall: {JSON.stringify(props.hasToolCall)}</p>
            <p className="color-weak m-0 break-all">blocks: {JSON.stringify(props.blocks.length)}</p>
            <p className="color-weak m-0">searchResults: {JSON.stringify(props.searchResults !== null)}</p>
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

    // Get blocks for interleaved rendering
    const blocks = useMemo(
        () => getMessageBlocks(message),
        [message.blocks, message.content, message.toolCall, message.toolResult]
    );
    const hasContent = blocks.length > 0;

    // Extract search results for legacy sources button
    const searchResults = useMemo(() => extractSearchResults(blocks), [blocks]);

    // Check if any block is a tool call (for loading state)
    const hasToolCall = blocks.some((b) => b.type === 'tool_call');
    const lastToolCall = blocks.findLast((b) => b.type === 'tool_call');
    const lastToolCallParsed = lastToolCall?.type === 'tool_call' ? parseToolCallBlock(lastToolCall) : null;

    const handleLinkClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
            e.preventDefault();
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

    // Hide message if it's loading and truly empty (no content, no tool calls)
    const shouldShow = !isLoading || hasContent || hasToolCall;

    return (
        <>
            <div className="gap-2 relative w-full">
                {shouldShow && (
                    <div
                        // ref={markdownContainerRef}
                        className={clsx(
                            'assistant-msg-container w-full flex flex-row flex-nowrap rounded-xl p-bg-norm'
                        )}
                        style={{
                            '--min-h-custom': '62px',
                        }}
                    >
                        <div
                            ref={markdownContainerRef}
                            className="w-full flex *:min-size-auto flex-nowrap items-start flex-column gap-2"
                        >
                            <DebugInfo
                                isLoading={isLoading || false}
                                hasToolCall={hasToolCall}
                                blocks={blocks}
                                searchResults={searchResults ?? []}
                            />
                            {isLoading && !hasToolCall ? (
                                <div className="w-full pt-1" style={{ minHeight: '2em' }}>
                                    <div className="rectangle-skeleton keep-motion"></div>
                                </div>
                            ) : (
                                <div className="w-full" style={{ minHeight: '2em' }}>
                                    {/* Always show RenderBlocks if there's reasoning, content, or tool calls */}
                                    {hasContent || doNotShowEmptyMessage || message.reasoning || hasToolCall ? (
                                        <RenderBlocks
                                            blocks={blocks}
                                            message={message}
                                            isGenerating={isGenerating}
                                            isLastMessage={isLastMessage}
                                            handleLinkClick={handleLinkClick}
                                            sourcesContainerRef={sourcesContainerRef}
                                            reasoning={message.reasoning}
                                        />
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
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {isLastMessage && (
                    <AvatarAndNotice
                        isFinishedGenerating={isFinishedGenerating}
                        isGenerating={isGenerating}
                        toolCallName={lastToolCallParsed?.name}
                    />
                )}
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
            <Icon size={4} name="info-circle" className={clsx('')} />
            <p className="text-sm">{c('collider_2025:Info').t`This message is empty. Sorry about that.`}</p>
        </div>
    </>
);

// Memoize to prevent unnecessary re-renders
export default memo(AssistantMessage, (prevProps, nextProps) => {
    return (
        messagesEqualForRendering(prevProps.message, nextProps.message) &&
        prevProps.isGenerating === nextProps.isGenerating &&
        prevProps.isLastMessage === nextProps.isLastMessage
    );
});
