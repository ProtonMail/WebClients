import type { RefObject } from 'react';
import { useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import { Scroll } from '@proton/atoms/Scroll';
import { Icon, Tooltip } from '@proton/components';
import Copy from '@proton/components/components/button/Copy';
import { useNotifications } from '@proton/components/hooks';
import useAssistantTelemetry from '@proton/components/hooks/assistant/useAssistantTelemetry';
import { ASSISTANT_SERVER_THROTTLE_TIMEOUT, useAssistant } from '@proton/llm/lib';
import { OpenedAssistantStatus } from '@proton/llm/lib/types';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import AssistantFeedbackModal from 'proton-mail/components/assistant/modals/AssistantFeedbackModal';
import { ASSISTANT_INSERT_TYPE } from 'proton-mail/hooks/assistant/useComposerAssistantGenerate';

import ComposerAssistantResult from './ComposerAssistantResult';

interface Props {
    assistantID: string;
    isComposerPlainText: boolean;
    generationResult: string;
    assistantResultRef: RefObject<HTMLElement>;
    assistantResultChildRef: RefObject<HTMLElement>;
    onSelectionChange: () => void;
    checkScrollButtonDisplay: () => void;
    showArrow: boolean;
    onScrollToBottom: () => void;
    replaceMessageBody: (action: ASSISTANT_INSERT_TYPE) => void;
    submittedPrompt: string;
    feedbackSubmitted: boolean;
    setFeedbackSubmitted: (value: boolean) => void;
    onResetPrompt: () => void;
    onResetGeneration: () => void;
    showReplaceButton: boolean;
}

const ComposerAssistantExpanded = ({
    assistantID,
    isComposerPlainText,
    generationResult,
    assistantResultRef,
    assistantResultChildRef,
    onSelectionChange,
    checkScrollButtonDisplay,
    showArrow,
    onScrollToBottom,
    replaceMessageBody,
    submittedPrompt,
    feedbackSubmitted,
    setFeedbackSubmitted,
    onResetPrompt,
    onResetGeneration,
    showReplaceButton,
}: Props) => {
    const { createNotification } = useNotifications();
    const { sendNotUseAnswerAssistantReport } = useAssistantTelemetry();
    const { isGeneratingResult, setAssistantStatus, cancelRunningAction, cleanSpecificErrors, canKeepFormatting } =
        useAssistant(assistantID);
    const generatedContentRef = useRef<HTMLDivElement>(null);

    const handleCancel = async () => {
        if (isGeneratingResult) {
            cancelRunningAction();
        }
        cleanSpecificErrors();
        sendNotUseAnswerAssistantReport();
        setAssistantStatus(assistantID, OpenedAssistantStatus.COLLAPSED);
        onResetPrompt();
        // Wait for the last callback to be called before cleaning the generation
        await wait(ASSISTANT_SERVER_THROTTLE_TIMEOUT + 20);
        onResetGeneration();
    };

    // translator: full sentence is: This is intended as a writing aid. Check suggested text for accuracy. <Learn more>
    const learnMoreResult = (
        <Href
            href={getKnowledgeBaseUrl('/proton-scribe-writing-assistant')}
            className="inline-block color-weak"
            key="composer-assistant-learn-more-result"
        >{c('Link').t`Learn more`}</Href>
    );

    const handleInsertGenerationInComposer = (action: ASSISTANT_INSERT_TYPE) => {
        replaceMessageBody(action);
        onResetPrompt();
        onResetGeneration();
    };

    const hasPlaintextGeneration =
        isComposerPlainText || isGeneratingResult || !canKeepFormatting || !generatedContentRef.current;

    return (
        <div className="flex-1 flex flex-nowrap flex-column">
            {generationResult && (
                <div className="flex-1 overflow-auto mt-0 mb-4 text-pre-line relative">
                    {showArrow && (
                        <Tooltip title={c('Action').t`Scroll to bottom`}>
                            <Button
                                onClick={onScrollToBottom}
                                shape="outline"
                                icon
                                className="shadow-raised absolute bottom-0 right-0 mr-1 mb-2"
                            >
                                <Icon name="arrow-down" alt={c('Action').t`Scroll to bottom`} />
                            </Button>
                        </Tooltip>
                    )}
                    <Scroll
                        customContainerRef={assistantResultRef}
                        customChildRef={assistantResultChildRef}
                        onKeyUp={onSelectionChange}
                        onScroll={checkScrollButtonDisplay}
                    >
                        <div
                            className={clsx([
                                'mt-2 border border-weak color-weak rounded-xl p-7 relative',
                                isGeneratingResult && 'pointer-events-none',
                            ])}
                            aria-busy={isGeneratingResult ? true : undefined}
                        >
                            <div ref={generatedContentRef}>
                                <ComposerAssistantResult
                                    result={generationResult}
                                    assistantID={assistantID}
                                    isComposerPlainText={isComposerPlainText}
                                />
                            </div>

                            <Copy
                                size="small"
                                className="absolute top-0 right-0 mt-2 mr-2"
                                shape="ghost"
                                value={hasPlaintextGeneration ? generationResult : generatedContentRef.current}
                                disabled={isGeneratingResult || !generationResult}
                                onCopy={() => {
                                    createNotification({
                                        text: c('Success').t`Content copied to clipboard`,
                                    });
                                }}
                            />
                        </div>
                    </Scroll>
                </div>
            )}

            <Button
                onClick={handleCancel}
                shape="ghost"
                className="absolute top-0 right-0 mr-3 mt-3"
                icon
                aria-label={c('Action').t`Cancel`}
            >
                <Icon name="cross-big" />
            </Button>

            <div className="shrink-0 mt-auto">
                {showReplaceButton && (
                    <Tooltip title={c('Action').t`Replaces the selected text in your message`}>
                        <Button
                            onClick={() => handleInsertGenerationInComposer(ASSISTANT_INSERT_TYPE.REPLACE)}
                            shape="outline"
                            className="mr-2"
                            disabled={!generationResult || isGeneratingResult}
                        >
                            {c('Action').t`Replace`}
                        </Button>
                    </Tooltip>
                )}
                <Tooltip title={c('Action').t`Adds it above your existing message`}>
                    <Button
                        onClick={() => handleInsertGenerationInComposer(ASSISTANT_INSERT_TYPE.INSERT)}
                        color="norm"
                        shape="solid"
                        className="mr-2"
                        disabled={!generationResult || isGeneratingResult}
                    >
                        {c('Action').t`Insert`}
                    </Button>
                </Tooltip>
                <AssistantFeedbackModal
                    disabled={!generationResult || isGeneratingResult}
                    result={generationResult}
                    prompt={submittedPrompt}
                    feedbackSubmitted={feedbackSubmitted}
                    setFeedbackSubmitted={setFeedbackSubmitted}
                />
                <p className="color-weak mt-2 mb-1 text-sm flex-1">{
                    // translator: full sentence is: This is intended as a writing aid. Check suggested text for accuracy. <Learn more>
                    c('Info')
                        .jt`This is intended as a writing aid. Check suggested text for accuracy. ${learnMoreResult}`
                }</p>
            </div>
        </div>
    );
};

export default ComposerAssistantExpanded;
