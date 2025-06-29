import type { MutableRefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { EditorMetadata } from '@proton/components';
import { useModalStateObject } from '@proton/components';
import ComposerAssistantUpsellModal from '@proton/components/components/upsell/modals/ComposerAssistantUpsellModal';
import { ASSISTANT_SERVER_THROTTLE_TIMEOUT, getHasAssistantStatus, useAssistant } from '@proton/llm/lib';
import { OpenedAssistantStatus } from '@proton/llm/lib/types';
import { removeLineBreaks } from '@proton/mail/helpers/string';
import { ERROR_TYPE } from '@proton/shared/lib/assistant';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Recipient } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import throttle from '@proton/utils/throttle';

import ComposerAssistantExpanded from 'proton-mail/components/assistant/ComposerAssistantExpanded';
import ResumeDownloadingModal from 'proton-mail/components/assistant/modals/ResumeDownloadingModal';
import ComposerAssistantToolbar from 'proton-mail/components/assistant/toolbar/ComposerAssistantToolbar';
import type { ComposerReturnType } from 'proton-mail/helpers/composer/contentFromComposerMessage';
import useComposerAssistantGenerate from 'proton-mail/hooks/assistant/useComposerAssistantGenerate';
import useComposerAssistantScrollButton from 'proton-mail/hooks/assistant/useComposerAssistantScrollButton';
import useComposerAssistantSelectedText from 'proton-mail/hooks/assistant/useComposerAssistantSelectedText';
import { ComposerInnerModalStates } from 'proton-mail/hooks/composer/useComposerInnerModals';

import './ComposerAssistant.scss';

/**
 * Execute timeout on first call and then execute the function every 150ms
 * This is used to avoid too many calls to getContentBeforeBlockquote
 * as it could impact performances
 */
const throttleHasComposerContent = throttle(
    (getContentBeforeBlockquote: () => string) => !!removeLineBreaks(getContentBeforeBlockquote()),
    150,
    {
        leading: false,
        trailing: true,
    }
);

interface Props {
    assistantID: string;
    editorMetadata: EditorMetadata;
    composerSelectedText: string;
    getContentBeforeBlockquote: (returnType?: ComposerReturnType) => string;
    setContentBeforeBlockquote: (content: string) => void;
    onUseRefinedText: (value: string) => void;
    onUseGeneratedText: (value: string) => void;
    setInnerModal: (innerModal: ComposerInnerModalStates) => void;
    recipients: Recipient[];
    sender: Recipient | undefined;
    setAssistantStateRef: MutableRefObject<() => void>;
    messageID: string;
}

const ComposerAssistant = ({
    assistantID,
    editorMetadata,
    composerSelectedText,
    getContentBeforeBlockquote,
    setContentBeforeBlockquote,
    onUseRefinedText,
    onUseGeneratedText,
    setInnerModal,
    recipients,
    sender,
    setAssistantStateRef,
    messageID,
}: Props) => {
    // Prompt that is currently in the input
    const [prompt, setPrompt] = useState('');
    // Previous prompt of the user request.
    // We want to show it again to the user by default in the input when improving generated text
    const previousPrompt = useRef<string>('');
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

    const assistantResultChildRef = useRef<HTMLDivElement>(null);
    const assistantResultRef = useRef<HTMLDivElement>(null);

    const assistantUpsellModal = useModalStateObject();
    const resumeDownloadModal = useModalStateObject();

    const { openedAssistants, setAssistantStatus, resumeDownloadModel, error, cleanSpecificErrors } =
        useAssistant(assistantID);

    const isAssistantExpanded = useMemo(() => {
        return getHasAssistantStatus(openedAssistants, assistantID, OpenedAssistantStatus.EXPANDED);
    }, [assistantID, openedAssistants]);

    const expandAssistant = () => {
        if (!isAssistantExpanded) {
            setAssistantStatus(assistantID, OpenedAssistantStatus.EXPANDED);
        }
    };

    const { showArrow, handleScrollToBottom, checkScrollButtonDisplay } = useComposerAssistantScrollButton({
        assistantResultChildRef,
        assistantResultRef,
    });

    // Selected text in the composer or assistant result that the user might want to refine
    const { selection, handleMouseDown, handleSelectionChange } = useComposerAssistantSelectedText({
        assistantID,
        assistantResultRef,
        composerSelectedText,
        onResetRequest: () => setPrompt(''),
    });

    const {
        generationResult,
        setGenerationResult,
        previousGenerationResult,
        setPreviousGenerationResult,
        generate,
        submittedPrompt,
        replaceMessageBody,
    } = useComposerAssistantGenerate({
        assistantID,
        isComposerPlainText: editorMetadata.isPlainText,
        showAssistantSettingsModal: () => setInnerModal(ComposerInnerModalStates.AssistantSettings),
        showResumeDownloadModal: () => resumeDownloadModal.openModal(true),
        showUpsellModal: () => assistantUpsellModal.openModal(true),
        onResetFeedbackSubmitted: () => {
            setFeedbackSubmitted(false);
        },
        expanded: isAssistantExpanded,
        recipients,
        sender,
        getContentBeforeBlockquote,
        checkScrollButtonDisplay,
        selection,
        onSelectionChange: handleSelectionChange,
        onUseGeneratedText,
        onUseRefinedText,
        setContentBeforeBlockquote,
        prompt,
        setPrompt,
        setAssistantStatus,
        messageID,
    });

    const handleResetToPreviousPrompt = () => {
        if (previousGenerationResult) {
            setGenerationResult(previousGenerationResult);
        }
    };

    const handleResetGeneration = () => {
        setGenerationResult('');
        setPreviousGenerationResult('');
    };

    // When user is making a harmful generation on top of a previous generation, reset the content to the previous generation
    useEffect(() => {
        if (error && error.errorType === ERROR_TYPE.GENERATION_HARMFUL) {
            handleResetToPreviousPrompt();
        }
    }, [error]);

    // Set ref content used to reset assistant state when user is using escape shortcut
    useEffect(() => {
        setAssistantStateRef.current = async () => {
            setPrompt('');
            // Wait for the last callback to be called before cleaning the generation
            await wait(ASSISTANT_SERVER_THROTTLE_TIMEOUT + 20);
            setGenerationResult('');
            setPreviousGenerationResult('');
            cleanSpecificErrors();
        };
    }, [setPrompt, setPreviousGenerationResult]);

    const hasComposerContent = !!throttleHasComposerContent(getContentBeforeBlockquote);

    // Show refine buttons when:
    // - There is some content selected in the assistant expanded
    // - Message body in composer has some content
    // - There is some content that has been generated in the assistant expanded
    const canUseRefineButtons =
        !!selection.generationSelectedText || (!isAssistantExpanded && hasComposerContent) || !!generationResult;

    const handleResetPrompt = () => {
        previousPrompt.current = '';
        setPrompt('');
    };

    return (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
            className={clsx([
                'composer-assistant-container mt-2 relative flex flex-column flex-nowrap',
                isAssistantExpanded && 'absolute composer-assistant-container--expanded',
            ])}
            onMouseDown={handleMouseDown}
        >
            <ComposerAssistantToolbar
                assistantID={assistantID}
                prompt={prompt}
                setPrompt={setPrompt}
                previousPrompt={previousPrompt}
                selection={selection}
                isAssistantExpanded={isAssistantExpanded}
                onExpandAssistant={expandAssistant}
                onGenerate={generate}
                canUseRefineButtons={canUseRefineButtons}
                onCancelGeneration={handleResetToPreviousPrompt}
            />

            {isAssistantExpanded && (
                <ComposerAssistantExpanded
                    assistantID={assistantID}
                    isComposerPlainText={editorMetadata.isPlainText}
                    generationResult={generationResult}
                    assistantResultChildRef={assistantResultChildRef}
                    assistantResultRef={assistantResultRef}
                    onSelectionChange={handleSelectionChange}
                    checkScrollButtonDisplay={checkScrollButtonDisplay}
                    showArrow={showArrow}
                    onScrollToBottom={handleScrollToBottom}
                    replaceMessageBody={replaceMessageBody}
                    submittedPrompt={submittedPrompt}
                    feedbackSubmitted={feedbackSubmitted}
                    setFeedbackSubmitted={setFeedbackSubmitted}
                    onResetPrompt={handleResetPrompt}
                    onResetGeneration={handleResetGeneration}
                    showReplaceButton={hasComposerContent}
                    messageID={messageID}
                />
            )}

            {assistantUpsellModal.render && (
                <ComposerAssistantUpsellModal modalProps={assistantUpsellModal.modalProps} />
            )}
            {resumeDownloadModal.render && (
                <ResumeDownloadingModal
                    modalProps={{
                        ...resumeDownloadModal.modalProps,
                    }}
                    onResumeDownload={() => resumeDownloadModel?.()}
                />
            )}
        </div>
    );
};

export default ComposerAssistant;
