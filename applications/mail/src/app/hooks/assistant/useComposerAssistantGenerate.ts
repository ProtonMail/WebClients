import { useState } from 'react';

import { useAssistantSubscriptionStatus, useAuthentication, useUserSettings } from '@proton/components/hooks';
import useAssistantTelemetry from '@proton/components/hooks/assistant/useAssistantTelemetry';
import { isPromptSizeValid, useAssistant } from '@proton/llm/lib';
import type {
    Action,
    ActionType,
    PartialRefineAction,
    RefineAction,
    RefineActionType,
    RefineLocation,
} from '@proton/llm/lib/types';
import { OpenedAssistantStatus, isPredefinedRefineActionType, isRefineActionType } from '@proton/llm/lib/types';
import { ASSISTANT_TYPE, ERROR_TYPE } from '@proton/shared/lib/assistant';
import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';
import type { Recipient } from '@proton/shared/lib/interfaces';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';

import { prepareContentToModel } from 'proton-mail/helpers/assistant/input';
import { markdownToHTML } from 'proton-mail/helpers/assistant/markdown';
import type { ComposerReturnType } from 'proton-mail/helpers/composer/contentFromComposerMessage';
import { removeLineBreaks } from 'proton-mail/helpers/string';

export enum ASSISTANT_INSERT_TYPE {
    INSERT = 'INSERT',
    REPLACE = 'REPLACE',
}

export interface GenerateResultProps {
    actionType?: ActionType;
    setShouldShowRefineButtons?: (value: boolean) => void;
    assistantRequest: string;
    setAssistantRequest?: (value: string) => void;
}

interface Props {
    assistantID: string;
    isComposerPlainText: boolean;
    showAssistantSettingsModal: () => void;
    showResumeDownloadModal: () => void;
    showUpsellModal: () => void;
    onResetFeedbackSubmitted: () => void;
    expanded: boolean;
    recipients: Recipient[];
    sender: Recipient | undefined;
    getContentBeforeBlockquote: (returnType?: ComposerReturnType) => string;
    checkScrollButtonDisplay: () => boolean | undefined;
    selectedText: string | undefined;
    composerSelectedText: string;
    onUseGeneratedText: (value: string) => void;
    onUseRefinedText: (value: string) => void;
    setContentBeforeBlockquote: (content: string) => void;
    prompt: string;
    setPrompt: (value: string) => void;
    setAssistantStatus: (assistantID: string, status: OpenedAssistantStatus) => void;
}

const useComposerAssistantGenerate = ({
    assistantID,
    isComposerPlainText,
    showAssistantSettingsModal,
    showResumeDownloadModal,
    showUpsellModal,
    onResetFeedbackSubmitted,
    expanded,
    recipients,
    sender,
    getContentBeforeBlockquote,
    checkScrollButtonDisplay,
    selectedText,
    composerSelectedText,
    onUseGeneratedText,
    onUseRefinedText,
    setContentBeforeBlockquote,
    prompt,
    setPrompt,
}: Props) => {
    // Contains the current generation result that is visible in the assistant context
    const [generationResult, setGenerationResult] = useState('');
    // Contains the previous generation result.
    // When the user is generating a new text over a generated text and cancels it,
    // we want to fall back to the previous text instead of seeing a partial generation
    const [previousGenerationResult, setPreviousGenerationResult] = useState('');

    const [submittedPrompt, setSubmittedPrompt] = useState('');

    const [{ AIAssistantFlags, Locale: locale }] = useUserSettings();
    const { trialStatus, start: startTrial } = useAssistantSubscriptionStatus();
    const { downloadPaused, generateResult, setAssistantStatus, addSpecificError, canKeepFormatting } =
        useAssistant(assistantID);
    const { sendUseAnswerAssistantReport } = useAssistantTelemetry();

    const authentication = useAuthentication();

    const handleCheckValidPrompt = (action: Action) => {
        const isValidPrompt = isPromptSizeValid(action);
        if (!isValidPrompt) {
            addSpecificError({
                assistantID,
                errorType: ERROR_TYPE.GENERATION_TOO_LONG,
                assistantType:
                    AIAssistantFlags === AI_ASSISTANT_ACCESS.CLIENT_ONLY ? ASSISTANT_TYPE.LOCAL : ASSISTANT_TYPE.SERVER,
            });
        }
        return isValidPrompt;
    };

    const handleStartTrial = () => {
        let trialStarted = false;
        if (!trialStarted && trialStatus === 'trial-not-started') {
            trialStarted = true;
            void startTrial();
        }
    };

    const handleSetResult = (text: string) => {
        setGenerationResult(text);
        checkScrollButtonDisplay();
    };

    const handleSetGenerationResult = (fulltext: string, prompt?: string): void => {
        handleStartTrial();
        handleSetResult(fulltext);
        setSubmittedPrompt(prompt ?? '');
    };

    /* Refine with selection */

    const handleRefineEditorContent = async (partialAction: PartialRefineAction) => {
        if (selectedText) {
            /** There are 2 types of refine
             * 1- Refine text that is selected in the editor
             *      => We have a selected text in the editor
             *          && there is no result generated (otherwise, we are trying to refine a generated text, and we fall in the 2nd case)
             * 2- Refine selection of the text generated by the assistant. The user wants to improve it before inserting it.
             */
            if (composerSelectedText && !generationResult) {
                /** In the first case, when we have an input selected text (text coming from the editor),
                 * we can add the entire generated text inside the assistant result.
                 * To generate a result, we are sending to the llm manager:
                 * - The refine prompt
                 * - The full email in plaintext
                 * - The start and end index of the selection within the full email
                 */
                const plain = removeLineBreaks(getContentBeforeBlockquote('plaintext'));
                const idxStart = plain.indexOf(removeLineBreaks(selectedText));
                const idxEnd = idxStart + removeLineBreaks(selectedText).length;

                const action: RefineAction = {
                    ...partialAction,
                    fullEmail: plain,
                    idxStart,
                    idxEnd,
                    userInputFormat: 'plaintext',
                    assistantOutputFormat: isComposerPlainText || !canKeepFormatting ? 'plaintext' : 'markdown',
                };

                const isValidPrompt = handleCheckValidPrompt(action);
                if (!isValidPrompt) {
                    return;
                }

                await generateResult({
                    action,
                    callback: (res) => handleSetGenerationResult(res),
                    hasSelection: !!selectedText,
                });
            } else {
                /** In the second case, when we want to refine selection of the text generated by the assistant before importing it,
                 * we don't want to erase the full assistant result while generating.
                 * We want to replace the part that is being refined.
                 * In that case, we will get the text before the selection and the text after the selection so that we can replace
                 * the old text with the new generated text.
                 * To generate a result, we are sending to the llm manager:
                 * - The refine prompt
                 * - The previous generated text
                 * - The start and end index of the selection within the previous generated text
                 *
                 *
                 * Because generationResult contains Markdown text, we need to convert it to plaintext
                 * before searching for the text selection, otherwise we might not find it,
                 * which will break the refine.
                 * So same as the case with text selection in the composer, we cannot keep the HTML format.
                 */

                let content = '';

                if (canKeepFormatting) {
                    // Get the plaintext content by converting md content to HTML and getting the innerText
                    // We are also keeping line breaks in that case so that we don't break formatting
                    const html = markdownToHTML(generationResult, true);
                    content = parseStringToDOM(html).body.innerText;
                } else {
                    content = generationResult;
                }

                const idxStart = content.indexOf(selectedText);
                const idxEnd = idxStart + selectedText.length;
                const beforeSelection = content.slice(0, idxStart);
                const afterSelection = content.slice(idxEnd, content.length);

                const handleInsertRefineInGenerationResult = (textToReplace: string) => {
                    handleStartTrial();
                    const newResult = `${beforeSelection}${textToReplace}${afterSelection}`;
                    handleSetResult(newResult);
                };

                const action: Action = {
                    ...partialAction,
                    fullEmail: content,
                    idxStart,
                    idxEnd,
                    userInputFormat: 'plaintext',
                    assistantOutputFormat: isComposerPlainText || !canKeepFormatting ? 'plaintext' : 'markdown',
                };

                const isValidPrompt = handleCheckValidPrompt(action);
                if (!isValidPrompt) {
                    return;
                }

                await generateResult({
                    action,
                    callback: handleInsertRefineInGenerationResult,
                    hasSelection: !!selectedText,
                });
            }
        }
    };

    const refineWithSelection = async (assistantRequest: string, actionType: RefineActionType) => {
        let partialAction: PartialRefineAction;
        if (isPredefinedRefineActionType(actionType)) {
            partialAction = {
                type: actionType,
            };
        } else {
            partialAction = {
                type: actionType,
                prompt: assistantRequest,
            };
        }

        await handleRefineEditorContent(partialAction); // refine location (idxStart/idxEnd) is set later
    };

    /* Generation related */
    const getEmailContentsForRefinement = () => {
        const mode = composerSelectedText || !canKeepFormatting ? 'plaintext' : 'html';
        const contentBeforeBlockquote = getContentBeforeBlockquote(mode);

        let composerContent;
        if (isComposerPlainText || composerSelectedText || !canKeepFormatting) {
            composerContent = removeLineBreaks(contentBeforeBlockquote);
        } else {
            const uid = authentication.getUID();
            composerContent = prepareContentToModel(contentBeforeBlockquote, uid);
        }

        if (expanded && generationResult) {
            return generationResult;
        } else if (composerContent) {
            return composerContent;
        }
    };

    const buildAction = (assistantRequest: string, actionType: ActionType): Action | undefined => {
        if (actionType === 'writeFullEmail') {
            return {
                type: 'writeFullEmail',
                prompt: assistantRequest,
                recipient: recipients?.[0]?.Name,
                sender: sender?.Name,
                locale,
                // no need to set input format since it can only be plaintext in that case
                assistantOutputFormat: isComposerPlainText || !canKeepFormatting ? 'plaintext' : 'markdown',
            };
        }

        const fullEmail = getEmailContentsForRefinement();
        if (!fullEmail) {
            return undefined;
        }

        const refineLocation: RefineLocation = {
            fullEmail,
            idxStart: 0,
            idxEnd: fullEmail.length,
            userInputFormat: isComposerPlainText || !canKeepFormatting ? 'plaintext' : 'markdown',
            assistantOutputFormat: isComposerPlainText || !canKeepFormatting ? 'plaintext' : 'markdown',
        };

        // Predefined refine (shorten, proofread etc)
        if (isPredefinedRefineActionType(actionType)) {
            return {
                type: actionType,
                ...refineLocation,
            };
        }

        // Custom refine (with user prompt)
        return {
            type: actionType,
            prompt: assistantRequest,
            ...refineLocation,
        };
    };

    const generate = async ({ actionType }: GenerateResultProps) => {
        // If user hasn't set the assistant yet, invite him to do so
        if (AIAssistantFlags === AI_ASSISTANT_ACCESS.UNSET) {
            showAssistantSettingsModal();
            return;
        }

        // Warn the user that we need the download to be completed before generating a result
        if (downloadPaused) {
            showResumeDownloadModal();
            return;
        }

        // Stop if trial ended or if user has no trial (free users)
        if (trialStatus === 'trial-ended' || trialStatus === 'no-trial') {
            showUpsellModal();
            setAssistantStatus(assistantID, OpenedAssistantStatus.COLLAPSED);
            return;
        }

        // Store previous generation in case the user cancels the current one (we'll have to revert it)
        if (generationResult) {
            setPreviousGenerationResult(generationResult);
        }

        onResetFeedbackSubmitted();

        // If actionType is undefined, it means we're being called with a user request
        // (user has typed stuff the AI input field), but caller doesn't know if this
        // has to be applied to full message generation or refinement of a specific part.
        if (!actionType) {
            actionType = !!selectedText ? 'customRefine' : 'writeFullEmail';
        }

        const generateType = (() => {
            const isRefineAction = isRefineActionType(actionType);
            if (isRefineAction && !!selectedText) {
                return 'refine-with-selection';
            }
            if (isRefineAction) {
                return 'refine';
            }

            return 'generate';
        })();

        if (generateType === 'refine-with-selection') {
            await refineWithSelection(prompt, actionType as RefineActionType);
        }

        if (generateType === 'refine') {
            // Empty the user request field after they typed Enter
            setPrompt('');

            const action = buildAction(prompt, actionType);

            if (action) {
                const isValidPrompt = handleCheckValidPrompt(action);
                if (!isValidPrompt) {
                    return;
                }

                await generateResult({
                    action,
                    callback: (res) => {
                        handleSetGenerationResult(res, prompt);
                    },
                    hasSelection: !!selectedText,
                });
            }
        }

        if (generateType === 'generate') {
            const action = buildAction(prompt, actionType);
            if (action) {
                await generateResult({
                    action,
                    callback: (res) => {
                        handleSetGenerationResult(res, prompt);
                    },
                    hasSelection: !!selectedText,
                });
            }
        }
    };

    /* Insert generation in composer */

    // This function defines what happens when the user commits the proposed generation with the button "Add" or "Replace".
    const replaceMessageBody = async (action: ASSISTANT_INSERT_TYPE) => {
        /**
         * There are 3 different usages of the generated text:
         * 1- Insert text at the beginning of the composer, when there is no selected text in the editor
         * 2- Replace text in the composer where the current selection is
         * 3- Replace the full message body (signature and blockquote excluded)
         */
        const replacementStyle = (() => {
            if (action === ASSISTANT_INSERT_TYPE.REPLACE) {
                if (composerSelectedText) {
                    return 'refineSelectedText';
                }
                return 'refineFullMessage';
            }

            return 'generateFullMessage';
        })();

        if (replacementStyle === 'generateFullMessage') {
            onUseGeneratedText(generationResult);
        }

        if (replacementStyle === 'refineSelectedText') {
            onUseRefinedText(generationResult);
        }

        if (replacementStyle === 'refineFullMessage') {
            setContentBeforeBlockquote(generationResult);
        }

        sendUseAnswerAssistantReport(action);
        setAssistantStatus(assistantID, OpenedAssistantStatus.COLLAPSED);
        setGenerationResult('');
    };

    return {
        generationResult,
        setGenerationResult,
        previousGenerationResult,
        setPreviousGenerationResult,
        generate,
        replaceMessageBody,
        submittedPrompt,
    };
};

export default useComposerAssistantGenerate;
