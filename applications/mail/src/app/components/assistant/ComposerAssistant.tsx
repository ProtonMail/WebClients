import { MutableRefObject, RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { GetContentMode } from 'roosterjs-editor-types';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import { Scroll } from '@proton/atoms/Scroll';
import { Icon, Tooltip } from '@proton/components/components';
import { ASSISTANT_FEATURE_NAME } from '@proton/llm/lib';
import { useAssistant } from '@proton/llm/lib/useAssistant';
import useAssistantTelemetry from '@proton/llm/lib/useAssistantTelemetry';
import { getBlogURL } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import ComposerAssistantInput from 'proton-mail/components/assistant/ComposerAssistantInput';
import { removeLineBreaks } from 'proton-mail/helpers/string';

import { ExternalEditorActions } from '../composer/editor/EditorWrapper';
import useComposerAssistantPosition from '../../hooks/assistant/useComposerAssistantPosition';

import './ComposerAssistant.scss';

interface Props {
    onUseGeneratedText: (value: string) => void;
    onUpdateShowAssistant?: (value: boolean) => void;
    onCleanGeneration?: (text: string) => string;
    assistantID: string;
    composerContentRef: RefObject<HTMLElement>;
    composerContainerRef: RefObject<HTMLElement>;
    composerMetaRef: RefObject<HTMLElement>;
    isAssistantInitialSetup?: boolean;
    selectedText: string;
    editorRef: MutableRefObject<ExternalEditorActions | undefined>;
    onUseRefinedText: (value: string) => void;
}

const ComposerAssistant = ({
    assistantID,
    composerContainerRef,
    composerContentRef,
    composerMetaRef,
    editorRef,
    isAssistantInitialSetup,
    onCleanGeneration,
    onUpdateShowAssistant,
    onUseGeneratedText,
    onUseRefinedText,
    selectedText: inputSelectedText,
}: Props) => {
    const [result, setResult] = useState('');
    const mouseDownRef = useRef(false);

    const [expanded, setExpanded] = useState(false);
    const [displayRefinePopover, setDisplayRefinePopover] = useState<boolean>(false);

    const { sendUseAnswerAssistantReport } = useAssistantTelemetry();

    const composerAssistantTopValue = useComposerAssistantPosition({
        composerContainerRef,
        composerContentRef,
        composerMetaRef,
    });

    const { error, closeAssistant, isGeneratingResult, generateResult } = useAssistant(assistantID);

    // Selected text in the composer or assistant result that the user might want to refine
    const assistantResultRef = useRef<HTMLDivElement>(null);
    const [selectedText, setSelectedText] = useState(inputSelectedText);

    const hasAssistantError = useMemo(() => {
        return !!error;
    }, [error]);

    const replaceMessageBody = async () => {
        /** There are 2 different usage of the generated text
         * 1- Insert text at the beginning of the composer, when there is no selected text in the editor
         * 2- Replace text in the composer where the current selection is
         */
        if (!inputSelectedText) {
            onUseGeneratedText(result);

            sendUseAnswerAssistantReport();
        } else {
            onUseRefinedText(result);
        }
        onUpdateShowAssistant?.(false);
        closeAssistant(assistantID);
    };

    const handleSelectionChange = () => {
        const selection = document.getSelection();
        if (selection && assistantResultRef.current) {
            // Selection can start before or end after the div containing the result
            // We want to make sure the full selected text is inside the result container
            const selectionInAssistant =
                assistantResultRef.current.contains(selection.anchorNode) &&
                assistantResultRef.current.contains(selection.focusNode);
            if (selectionInAssistant) {
                setSelectedText(selection.toString());
                return;
            }
        }
        setSelectedText('');
    };

    // Listen mouse up at document lvl to handle the case when the user clicks
    // outside the assistant
    useEffect(() => {
        const handleMouseUp = () => {
            if (mouseDownRef.current) {
                mouseDownRef.current = false;
                handleSelectionChange();
            }
        };
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const handleMouseDown = () => {
        mouseDownRef.current = true;
    };

    // Controls the popover display
    useEffect(() => {
        if (selectedText && !displayRefinePopover) {
            setDisplayRefinePopover(true);
        } else if (!selectedText) {
            setDisplayRefinePopover(false);
        }
    }, [selectedText, displayRefinePopover]);

    // Update selected text when selection in editor is changing,
    // and hide the refine popover when the user deselect content in the editor.
    useEffect(() => {
        setSelectedText(inputSelectedText);
        if (inputSelectedText) {
            setDisplayRefinePopover(true);
        }
    }, [inputSelectedText]);

    const handleGenerateResult = (_: string, fulltext: string) => {
        const cleanedText = onCleanGeneration?.(fulltext) || fulltext;
        setResult(cleanedText);
    };

    const handleCloseAssistant = () => {
        onUpdateShowAssistant?.(false);
        closeAssistant(assistantID);
    };

    const handleCloseRefinePopover = () => {
        setSelectedText('');
        setDisplayRefinePopover(false);
    };

    const handleRefineEditorContent = async (prompt: string) => {
        /** There are 2 types of refine
         * 1- Refine text that is selected in the editor
         * 2- Refine some part of the text that is selected in the generated by the assistant, that the user wants to change before using it.
         */
        if (inputSelectedText && editorRef.current) {
            /** In the first case, when we have an input selected text (text coming from the editor),
             * we can add the entire generated text inside the assistant result.
             * To generate a result, we are sending to the llm manager:
             * - The refine prompt
             * - The full email in plaintext
             * - The start and end index of the selection within the full email
             */
            const plain = removeLineBreaks(editorRef.current.getContent(GetContentMode.PlainText));
            const idxStart = plain.indexOf(removeLineBreaks(selectedText));
            const idxEnd = idxStart + removeLineBreaks(selectedText).length;

            await generateResult({
                action: {
                    type: 'refine',
                    prompt,
                    fullEmail: plain,
                    idxStart,
                    idxEnd,
                },
                callback: handleGenerateResult,
            });
        } else if (!inputSelectedText) {
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

            const handleInsertRefineInResult = (_: string, textToReplace: string) => {
                const newResult = `${beforeSelection}${textToReplace}${afterSelection}`;
                setResult(newResult);
            };

            await generateResult({
                action: {
                    type: 'refine',
                    prompt,
                    fullEmail: result,
                    idxStart,
                    idxEnd,
                },
                callback: handleInsertRefineInResult,
            });
        }
    };

    // translator: full sentence is: This is intended as a writing aid. Check suggested text for accuracy. <Learn more>
    const learnMoreResult = (
        <Href
            href={getBlogURL('/todo')}
            className="inline-block color-weak"
            key="composer-assistant-learn-more-result"
        >{c('Link').t`Learn more`}</Href>
    );

    return (
        <div
            className={clsx([
                'composer-assistant-container absolute top-custom',
                expanded && 'composer-assistant-container--expanded',
            ])}
            style={{ '--top-custom': `${composerAssistantTopValue}px` }}
        >
            <div className="composer-assistant rounded-lg flex-nowrap flex flex-column my-2 relative">
                {displayRefinePopover && (
                    <div
                        className="absolute composer-assistant-refine-popover rounded-lg border border-weak bg-norm pt-1 pb-2 pl-4 pr-2 flex flex-nowrap shadow-raised items-start"
                        id="composer-assistant-refine-popover"
                    >
                        <Icon
                            name="text-quote"
                            className="shrink-0 mr-2 mt-1"
                            alt={c('loc_nightly_assistant').t`You selected some content:`}
                        />
                        <div className="flex-1 overflow-auto composer-assistant-refine-content mt-1">
                            {selectedText}
                        </div>
                        <Tooltip title={c('loc_nightly_assistant').t`Close AI refine suggestion`}>
                            <Button icon shape="ghost" size="small" onClick={handleCloseRefinePopover}>
                                <Icon name="cross" alt={c('loc_nightly_assistant').t`Close AI refine suggestion`} />
                            </Button>
                        </Tooltip>
                    </div>
                )}

                <div className="relative shrink-0 flex flex-row flex-nowrap flex-column md:flex-row items-start my-0 w-full">
                    <ComposerAssistantInput
                        onGenerateResult={handleGenerateResult}
                        assistantID={assistantID}
                        onContentChange={() => setExpanded(true)}
                        isAssistantInitialSetup={isAssistantInitialSetup}
                        hasSelection={selectedText.length > 0}
                        onRefine={handleRefineEditorContent}
                    />
                    <div className="absolute top-0 right-0 mt-0">
                        <Tooltip title={c('loc_nightly_assistant').t`Close ${ASSISTANT_FEATURE_NAME}`}>
                            <Button icon shape="ghost" size="small" onClick={handleCloseAssistant}>
                                <Icon
                                    name="cross-big"
                                    alt={c('loc_nightly_assistant').t`Close ${ASSISTANT_FEATURE_NAME}`}
                                />
                            </Button>
                        </Tooltip>
                    </div>
                </div>
                <div className="flex-1 flex flex-nowrap flex-column">
                    {result && !hasAssistantError && (
                        <>
                            <div className="flex-1 overflow-auto mt-0 mb-4 text-pre-wrap">
                                <Scroll
                                    customContainerRef={assistantResultRef}
                                    onKeyUp={handleSelectionChange}
                                    onMouseDown={handleMouseDown}
                                >
                                    {result}
                                </Scroll>
                            </div>
                            <div className="shrink-0">
                                <Button
                                    onClick={replaceMessageBody}
                                    color="norm"
                                    shape="solid"
                                    className={clsx([
                                        isGeneratingResult ? 'visibility-hidden' : 'composer-assistant-button',
                                    ])}
                                    disabled={isGeneratingResult}
                                >
                                    {c('loc_nightly_assistant').t`Use this`}
                                </Button>
                                <p className="color-weak mt-2 mb-0 text-sm pr-4 flex-1">{
                                    // translator: full sentence is: This is intended as a writing aid. Check suggested text for accuracy. <Learn more>
                                    c('loc_nightly_assistant')
                                        .jt`This is intended as a writing aid. Check suggested text for accuracy. ${learnMoreResult}`
                                }</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ComposerAssistant;
