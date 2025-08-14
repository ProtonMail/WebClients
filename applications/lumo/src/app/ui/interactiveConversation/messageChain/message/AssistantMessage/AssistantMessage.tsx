import { useCallback, useRef, useState } from 'react';

import type { HandleRegenerateMessage } from 'applications/lumo/src/app/hooks/useLumoActions';
import type { Message, SiblingInfo } from 'applications/lumo/src/app/types';
import clsx from 'clsx';
import { c } from 'ttag';
import TurndownService from 'turndown';

import { Icon, useModalStateObject } from '@proton/components';

import { useTierErrors } from '../../../../../hooks/useTierErrors';
import type { SearchItem } from '../../../../../lib/toolCall/types';
import { useIsGuest } from '../../../../../providers/IsGuestProvider';
import { sendMessageCopyEvent, sendMessageRegenerateEvent } from '../../../../../util/telemetry';
import { ReferenceFilesButton } from '../../../../components/Files';
import LumoButton from '../../../../components/LumoButton';
import LinkWarningModal from '../../../../components/LumoMarkdown/LinkWarningModal';
import LumoMarkdown from '../../../../components/LumoMarkdown/LumoMarkdown';
import SiblingSelector from '../../../../components/SiblingSelector';
import ToolCallLoading from '../../../../components/ToolCallLoading/ToolCallLoading';
import AssistantFeedbackModal from '../actionToolbar/AssistantFeedbackModal';
import LumoCopyButton from '../actionToolbar/LumoCopyButton';
import { SourcesButton } from '../toolCall/SourcesBlock';
import { useToolCallInfo } from '../toolCall/useToolCallInfo';
import { AvatarAndNotice } from './AvatarAndNotice';

import './AssistantMessage.scss';

// Initialize turndown service once
const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
});

interface AssistantActionToolbarProps {
    message: Message;
    isFinishedGenerating: boolean;
    siblingInfo: SiblingInfo;
    handleRegenerateMessage: HandleRegenerateMessage;
    generationFailed: boolean;
    results: SearchItem[] | null;
    onToggleMessageSource: () => void;
    messageChain: Message[];
    onToggleFilesManagement: (message?: Message) => void;
    markdownContainerRef: React.MutableRefObject<HTMLDivElement | null>;
    isWebSearchButtonToggled: boolean;
}

const AssistantActionToolbar = ({
    message,
    isFinishedGenerating,
    siblingInfo,
    handleRegenerateMessage,
    generationFailed,
    results,
    onToggleMessageSource,
    messageChain,
    onToggleFilesManagement,
    markdownContainerRef,
    isWebSearchButtonToggled,
}: AssistantActionToolbarProps) => {
    const { hasTierErrors } = useTierErrors();
    const isGuest = useIsGuest();
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

    const isMessageEmpty = !message?.content || message?.content?.trim()?.length === 0;

    const handleRegenerate = () => {
        sendMessageRegenerateEvent();
        void handleRegenerateMessage(message, isWebSearchButtonToggled);
    };

    const handleCopy = () => {
        sendMessageCopyEvent();
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
                        onCopy={handleCopy}
                        disabled={!isFinishedGenerating || generationFailed || isMessageEmpty}
                        className="lumo-no-copy"
                    />
                    <LumoButton
                        className="lumo-no-copy"
                        iconName="arrows-rotate"
                        title={c('collider_2025:Action').t`Regenerate`}
                        tooltipPlacement="top"
                        onClick={handleRegenerate}
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
    onCopy: () => void;
    handleRegenerateMessage: HandleRegenerateMessage;
    isLastMessage?: boolean;
    handleOpenSources: (message: Message) => void;
    handleOpenFiles: (message?: Message) => void;
    messageChain: Message[];
    isGenerating: boolean;
    isGeneratingWithToolCall: boolean;
    onToggleMessageSource: (message: Message) => void;
    onToggleFilesManagement: (message?: Message) => void;
    isWebSearchButtonToggled: boolean;
}

// Add CSS to enforce consistent message width
// const messageContainerStyle = {
//     minWidth: '100%',
//     width: '100%',
//     maxWidth: '100%',
//     boxSizing: 'border-box' as const,
// };

const AssistantMessage = ({
    isLoading,
    isRunning: _isRunning,
    message,
    onCopy,
    siblingInfo,
    messageChainRef: _messageChainRef,
    sourcesContainerRef,
    handleRegenerateMessage,
    isLastMessage = false,
    handleOpenSources,
    handleOpenFiles,
    messageChain,
    isGenerating,
    isGeneratingWithToolCall,
    isWebSearchButtonToggled,
}: AssistantMessageProps) => {
    const isFinishedGenerating = message?.status !== undefined;
    const generationFailed = message.status === 'failed';
    const doNotShowEmptyMessage = isGenerating;
    const linkWarningModal = useModalStateObject();
    const [currentLink, setCurrentLink] = useState<string>('');
    const markdownContainerRef = useRef<HTMLDivElement>(null);
    const messageContent = preprocessContent(message?.content);

    const { query, results } = useToolCallInfo(message.toolCall, message.toolResult);
    const hasToolCall = !!query;

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

    return (
        <>
            <div className="gap-2 relative">
                <div
                    // ref={markdownContainerRef}
                    className={clsx(
                        'assistant-msg-container w-full flex flex-row flex-nowrap rounded-xl p-4 border border-weak bg-norm'
                    )}
                    style={{
                        '--min-h-custom': '62px',
                    }}
                >
                    <div
                        ref={markdownContainerRef}
                        className="markdown-rendering flex *:min-size-auto flex-nowrap items-start flex-column gap-2"
                    >
                        {
                            // eslint-disable-next-line no-nested-ternary
                            isLoading ? (
                                hasToolCall ? (
                                    <ToolCallLoading />
                                ) : (
                                    <div className="w-full pt-1" style={{ minHeight: '2em' }}>
                                        <div className="rectangle-skeleton keep-motion"></div>
                                    </div>
                                )
                            ) : (
                                <div className="w-full" style={{ minHeight: '2em' }}>
                                    {messageContent || doNotShowEmptyMessage ? (
                                        <div className="w-full">
                                            <LumoMarkdown
                                                message={message}
                                                content={messageContent}
                                                onCopy={onCopy}
                                                handleLinkClick={handleLinkClick}
                                                toolCallResults={results}
                                                sourcesContainerRef={sourcesContainerRef}
                                            />
                                        </div>
                                    ) : (
                                        <EmptyMessage />
                                    )}

                                    {/* <SourcesBlock results={results} onClick={onToggleMessageSource} /> */}
                                    <AssistantActionToolbar
                                        message={message}
                                        isFinishedGenerating={isFinishedGenerating}
                                        handleRegenerateMessage={handleRegenerateMessage}
                                        siblingInfo={siblingInfo}
                                        generationFailed={generationFailed}
                                        results={results}
                                        onToggleMessageSource={onToggleMessageSource}
                                        messageChain={messageChain}
                                        onToggleFilesManagement={(filterMessage) => handleOpenFiles(filterMessage)}
                                        markdownContainerRef={markdownContainerRef}
                                        isWebSearchButtonToggled={isWebSearchButtonToggled}
                                    />
                                </div>
                            )
                        }
                    </div>
                </div>
                {isLastMessage && (
                    <AvatarAndNotice
                        isFinishedGenerating={isFinishedGenerating}
                        isGenerating={isGenerating}
                        isGeneratingWithToolCall={isGeneratingWithToolCall}
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

function preprocessContent(content: string | undefined): string {
    if (!content) return '';
    content = content.trim();
    // Sometimes the model replies in raw html, e.g. "<p>Hello World</p>", even though we expect Markdown.
    if (
        content.startsWith('<div>') ||
        content.startsWith('<p>') ||
        content.endsWith('</div>') ||
        content.endsWith('</p>')
    ) {
        return turndownService.turndown(content);
    }
    return content;
}

export default AssistantMessage;
