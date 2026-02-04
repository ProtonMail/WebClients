import type { MutableRefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import throttle from 'lodash/throttle';

import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import type { EditorMetadata } from '@proton/components';
import { useModalStateObject } from '@proton/components';
import ComposerAssistantUpsellModal from '@proton/components/components/upsell/modals/ComposerAssistantUpsellModal';
import useAssistantSubscriptionStatus from '@proton/components/hooks/assistant/useAssistantSubscriptionStatus';
import { ASSISTANT_SERVER_THROTTLE_TIMEOUT, getHasAssistantStatus, useAssistant } from '@proton/llm/lib';
import { OpenedAssistantStatus } from '@proton/llm/lib/types';
import { removeLineBreaks } from '@proton/mail/helpers/string';
import { ERROR_TYPE } from '@proton/shared/lib/assistant';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Recipient } from '@proton/shared/lib/interfaces';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import ComposerAssistantExpanded from 'proton-mail/components/assistant/ComposerAssistantExpanded';
import ResumeDownloadingModal from 'proton-mail/components/assistant/modals/ResumeDownloadingModal';
import ComposerAssistantToolbar from 'proton-mail/components/assistant/toolbar/ComposerAssistantToolbar';
import type { ComposerReturnType } from 'proton-mail/helpers/composer/contentFromComposerMessage';
import useComposerAssistantGenerate from 'proton-mail/hooks/assistant/useComposerAssistantGenerate';
import useComposerAssistantScrollButton from 'proton-mail/hooks/assistant/useComposerAssistantScrollButton';
import useComposerAssistantSelectedText from 'proton-mail/hooks/assistant/useComposerAssistantSelectedText';
import { ComposerInnerModalStates } from 'proton-mail/hooks/composer/useComposerInnerModals';

import { useComposerAssistantProvider } from './provider/ComposerAssistantProvider';

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

    const [{ AIAssistantFlags }] = useUserSettings();
    const [user] = useUser();

    const { trialStatus } = useAssistantSubscriptionStatus();

    const {
        openedAssistants,
        hasCompatibleHardware,
        hasCompatibleBrowser,
        downloadPaused,
        setAssistantStatus,
        resumeDownloadModel,
        error,
        cleanSpecificErrors,
    } = useAssistant(assistantID);

    const { displayAssistantModal } = useComposerAssistantProvider();

    const isAssistantExpanded = useMemo(() => {
        return getHasAssistantStatus(openedAssistants, assistantID, OpenedAssistantStatus.EXPANDED);
    }, [assistantID, openedAssistants]);

    // Returns true if assistant can be expanded; if a modal is opened instead, returns false
    const canExpandAssistant = (skipTrialCheck = false): boolean => {
        // If user hasn't set the assistant yet, invite him to do so
        // Stop if trial ended or if user has no trial (free users)
        if ((!skipTrialCheck && (trialStatus === 'trial-ended' || trialStatus === 'no-trial')) || user.isFree) {
            assistantUpsellModal.openModal(true);
            return false;
        }

        if (AIAssistantFlags === AI_ASSISTANT_ACCESS.UNSET) {
            setInnerModal(ComposerInnerModalStates.AssistantSettings);
            return false;
        }

        // if user chose client then check their setup is compatible
        if (AIAssistantFlags === AI_ASSISTANT_ACCESS.CLIENT_ONLY) {
            if (!hasCompatibleBrowser) {
                displayAssistantModal('incompatibleBrowser');
                return false;
            }

            if (!hasCompatibleHardware) {
                displayAssistantModal('incompatibleHardware');
                return false;
            }
        }

        // Warn the user that we need the download to be completed before generating a result
        if (downloadPaused) {
            resumeDownloadModal.openModal(true);
            return false;
        }

        return true;
    };

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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-9141B6
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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-122A6C
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
                canExpandAssistant={canExpandAssistant}
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
