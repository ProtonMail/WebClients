import { RefObject, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import { Scroll } from '@proton/atoms/Scroll';
import { Icon, Tooltip } from '@proton/components/components';
import { getHasAssistantStatus } from '@proton/llm/lib';
import { OpenedAssistantStatus, PartialRefineAction, RefineAction } from '@proton/llm/lib/types';
import { useAssistant } from '@proton/llm/lib/useAssistant';
import useAssistantTelemetry from '@proton/llm/lib/useAssistantTelemetry';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import ComposerAssistantInput from 'proton-mail/components/assistant/ComposerAssistantInput';
import { removeLineBreaks } from 'proton-mail/helpers/string';
import useComposerAssistantScrollButton from 'proton-mail/hooks/assistant/useComposerAssistantScrollButton';
import useComposerAssistantSelectedText from 'proton-mail/hooks/assistant/useComposerAssistantSelectedText';
import { ComposerInnerModalStates } from 'proton-mail/hooks/composer/useComposerInnerModals';

import useComposerAssistantPosition from '../../hooks/assistant/useComposerAssistantPosition';
import AssitantFeedbackModal from './modals/AssistantFeedbackModal';

import './ComposerAssistant.scss';

interface Props {
    onUseGeneratedText: (value: string) => void;
    assistantID: string;
    composerContentRef: RefObject<HTMLElement>;
    composerContainerRef: RefObject<HTMLElement>;
    composerMetaRef: RefObject<HTMLElement>;
    isAssistantInitialSetup?: boolean;
    selectedText: string;
    onUseRefinedText: (value: string) => void;
    getContentBeforeBlockquote: () => string;
    setContentBeforeBlockquote: (content: string) => void;
    setInnerModal: (innerModal: ComposerInnerModalStates) => void;
}

export type ReplacementStyle = 'generateFullMessage' | 'refineFullMessage' | 'refineSelectedText' | undefined;

const ComposerAssistant = ({
    assistantID,
    composerContainerRef,
    composerContentRef,
    composerMetaRef,
    isAssistantInitialSetup,
    onUseGeneratedText,
    onUseRefinedText,
    selectedText: inputSelectedText,
    getContentBeforeBlockquote,
    setContentBeforeBlockquote,
    setInnerModal,
}: Props) => {
    const [result, setResult] = useState('');
    const [replacementStyle, setReplacementStyle] = useState<ReplacementStyle>(
        inputSelectedText ? 'refineSelectedText' : undefined
    );
    const [submittedPrompt, setSubmittedPrompt] = useState('');

    const { sendUseAnswerAssistantReport, sendNotUseAnswerAssistantReport } = useAssistantTelemetry();

    const composerAssistantTopValue = useComposerAssistantPosition({
        composerContainerRef,
        composerContentRef,
        composerMetaRef,
    });

    const assistantResultChildRef = useRef<HTMLDivElement>(null);
    const assistantResultRef = useRef<HTMLDivElement>(null);

    const { showArrow, handleScrollToBottom, checkScrollButtonDisplay } = useComposerAssistantScrollButton({
        assistantResultChildRef,
        assistantResultRef,
    });

    const { error, closeAssistant, isGeneratingResult, generateResult, openedAssistants, setAssistantStatus } =
        useAssistant(assistantID);

    const isAssistantExpanded = useMemo(() => {
        return getHasAssistantStatus(openedAssistants, assistantID, OpenedAssistantStatus.EXPANDED);
    }, [assistantID, openedAssistants]);

    const resetRequestRef = useRef<() => void>(noop);
    const handleResetRequest = () => {
        if (resetRequestRef.current) {
            resetRequestRef.current();
        }
    };

    // Selected text in the composer or assistant result that the user might want to refine
    const {
        selectedText,
        setSelectedText,
        displayRefinePopover,
        handleMouseDown,
        handleCloseRefinePopover,
        handleSelectionChange,
    } = useComposerAssistantSelectedText({ assistantResultRef, inputSelectedText, onResetRequest: handleResetRequest });

    const hasAssistantError = useMemo(() => {
        return !!error;
    }, [error]);

    // This function defines what happens when the user commits the proposed generation with the button "Use this".
    const replaceMessageBody = async () => {
        /**
         * There are 3 different usages of the generated text:
         * 1- Insert text at the beginning of the composer, when there is no selected text in the editor
         * 2- Replace text in the composer where the current selection is
         * 3- Replace the full message body (signature and blockquote excluded)
         */
        if (replacementStyle === 'generateFullMessage') {
            onUseGeneratedText(result);
            sendUseAnswerAssistantReport();
        }

        if (replacementStyle === 'refineSelectedText') {
            onUseRefinedText(result);
            sendUseAnswerAssistantReport();
        }

        if (replacementStyle === 'refineFullMessage') {
            setContentBeforeBlockquote(result);
            sendUseAnswerAssistantReport();
        }

        // TODO: To remove before merge
        if (replacementStyle === undefined) {
            throw new Error('replacementStyle is undefined');
        }

        setReplacementStyle(undefined);

        closeAssistant(assistantID);
    };

    const handleSetResult = (text: string) => {
        setResult(text);
        checkScrollButtonDisplay();
    };

    const handleGenerateResult = (fulltext: string, prompt?: string): void => {
        handleSetResult(fulltext);
        setSubmittedPrompt(prompt ?? '');
    };

    const handleRefineEditorContent = async (partialAction: PartialRefineAction) => {
        if (selectedText) {
            /** There are 2 types of refine
             * 1- Refine text that is selected in the editor
             *      => We have a selected text in the editor
             *          && there is no result generated (otherwise, we are trying to refine a generated text, and we fall in the 2nd case)
             * 2- Refine some part of the text that is selected in the generated by the assistant, that the user wants to change before using it.
             */
            if (inputSelectedText && !result) {
                /** In the first case, when we have an input selected text (text coming from the editor),
                 * we can add the entire generated text inside the assistant result.
                 * To generate a result, we are sending to the llm manager:
                 * - The refine prompt
                 * - The full email in plaintext
                 * - The start and end index of the selection within the full email
                 */
                const plain = removeLineBreaks(getContentBeforeBlockquote());
                const idxStart = plain.indexOf(removeLineBreaks(selectedText));
                const idxEnd = idxStart + removeLineBreaks(selectedText).length;

                const action: RefineAction = {
                    ...partialAction,
                    fullEmail: plain,
                    idxStart,
                    idxEnd,
                };
                await generateResult({
                    action,
                    callback: (res) => handleGenerateResult(res),
                });
            } else {
                /** In the second case, when we want to refine some part of the generated text before importing it,
                 * we don't want to replace the full assistant result while generating, only the part that needs to be refined.
                 * In that case, we will get the text before the selection and the text after the selection so that we can replace
                 * the old text with the new generated text.
                 * To generate a result, we are sending to the llm manager:
                 * - The refine prompt
                 * - The previous generated text
                 * - The start and end index of the selection within the previous generated text
                 */
                const idxStart = result.indexOf(selectedText);
                const idxEnd = idxStart + selectedText.length;
                const beforeSelection = result.slice(0, idxStart);
                const afterSelection = result.slice(idxEnd, result.length);

                const handleInsertRefineInResult = (textToReplace: string) => {
                    const newResult = `${beforeSelection}${textToReplace}${afterSelection}`;
                    handleSetResult(newResult);
                };

                const action = {
                    ...partialAction,
                    fullEmail: result,
                    idxStart,
                    idxEnd,
                };
                await generateResult({
                    action,
                    callback: handleInsertRefineInResult,
                });
            }
        }
    };

    // TODO: Check if move in composerAssistantInput and debounce
    const getCanUseRefineActions = !!selectedText || !!removeLineBreaks(getContentBeforeBlockquote()) || !!result;

    const expandAssistant = () => {
        setAssistantStatus(assistantID, OpenedAssistantStatus.EXPANDED);
    };

    const handleClickRefine = () => {
        if (!isAssistantExpanded) {
            expandAssistant();
        }
    };

    const handleCancel = () => {
        setReplacementStyle(undefined);
        sendNotUseAnswerAssistantReport();
        closeAssistant(assistantID);
    };

    // translator: full sentence is: This is intended as a writing aid. Check suggested text for accuracy. <Learn more>
    const learnMoreResult = (
        <Href
            href={getKnowledgeBaseUrl('/proton-scribe-writing-assistant')}
            className="inline-block color-weak"
            key="composer-assistant-learn-more-result"
        >{c('Link').t`Learn more`}</Href>
    );

    return (
        <div
            className={clsx([
                'composer-assistant-container absolute top-custom',
                isAssistantExpanded && 'composer-assistant-container--expanded',
            ])}
            style={{ '--top-custom': `${composerAssistantTopValue}px` }}
            onMouseDown={handleMouseDown}
        >
            <div className="composer-assistant rounded-lg flex-nowrap flex flex-column my-2 relative">
                {displayRefinePopover && (
                    <div
                        className="absolute composer-assistant-refine-popover rounded-lg border border-weak bg-norm pt-1 pb-1 pl-4 pr-2 flex flex-nowrap shadow-raised items-start"
                        id="composer-assistant-refine-popover"
                    >
                        <Icon
                            name="text-quote"
                            className="shrink-0 mr-2 mt-1"
                            alt={c('Info').t`You selected some content:`}
                        />
                        <div className="flex-1 overflow-auto composer-assistant-refine-content mt-1">
                            {selectedText}
                        </div>
                        <Tooltip title={c('Action').t`Close AI refine suggestion`}>
                            <Button icon shape="ghost" size="small" onClick={handleCloseRefinePopover}>
                                <Icon name="cross" alt={c('Action').t`Close AI refine suggestion`} />
                            </Button>
                        </Tooltip>
                    </div>
                )}

                <div className="relative shrink-0 flex flex-row flex-nowrap flex-column md:flex-row items-start my-0 w-full">
                    <ComposerAssistantInput
                        assistantID={assistantID}
                        assistantResult={result}
                        canUseRefineActions={getCanUseRefineActions}
                        expanded={isAssistantExpanded}
                        getContentBeforeBlockquote={getContentBeforeBlockquote}
                        hasSelection={selectedText ? selectedText.length > 0 : false}
                        isAssistantInitialSetup={isAssistantInitialSetup}
                        resetRequestRef={resetRequestRef}
                        setReplacementStyle={setReplacementStyle}
                        onClickRefine={handleClickRefine}
                        onContentChange={() => expandAssistant()}
                        onGenerateResult={handleGenerateResult}
                        onRefine={handleRefineEditorContent}
                        onResetSelection={() => setSelectedText('')}
                        setInnerModal={setInnerModal}
                    />
                </div>
                <div className="flex-1 flex flex-nowrap flex-column">
                    {result && !hasAssistantError && (
                        <div className="flex-1 overflow-auto mt-0 mb-4 text-pre-line">
                            <Scroll
                                customContainerRef={assistantResultRef}
                                customChildRef={assistantResultChildRef}
                                onKeyUp={handleSelectionChange}
                                onScroll={checkScrollButtonDisplay}
                            >
                                <div
                                    className={clsx([isGeneratingResult && 'pointer-events-none'])}
                                    aria-busy={isGeneratingResult ? true : undefined}
                                >
                                    {result}

                                    {showArrow && (
                                        <Tooltip title={c('Action').t`Scroll to bottom`}>
                                            <Button
                                                onClick={handleScrollToBottom}
                                                shape="outline"
                                                icon
                                                className="shadow-raised absolute bottom-0 right-0 mr-1 mb-2"
                                            >
                                                <Icon name="arrow-down" alt={c('Action').t`Scroll to bottom`} />
                                            </Button>
                                        </Tooltip>
                                    )}
                                </div>
                            </Scroll>
                        </div>
                    )}
                    {isAssistantExpanded && (
                        <div className="shrink-0 mt-auto">
                            <Button onClick={handleCancel} shape="outline" className="mr-2">
                                {c('Action').t`Cancel`}
                            </Button>
                            <Button
                                onClick={replaceMessageBody}
                                color="norm"
                                shape="solid"
                                className="mr-2"
                                disabled={!result || isGeneratingResult}
                            >
                                {c('Action').t`Use this`}
                            </Button>
                            <AssitantFeedbackModal
                                disabled={!result || isGeneratingResult}
                                result={result}
                                prompt={submittedPrompt}
                            />
                            <p className="color-weak mt-2 mb-0 text-sm pr-4 flex-1">{
                                // translator: full sentence is: This is intended as a writing aid. Check suggested text for accuracy. <Learn more>
                                c('Info')
                                    .jt`This is intended as a writing aid. Check suggested text for accuracy. ${learnMoreResult}`
                            }</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ComposerAssistant;
