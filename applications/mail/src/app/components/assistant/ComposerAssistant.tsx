import type { RefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import { Scroll } from '@proton/atoms/Scroll';
import {
    ComposerAssistantTrialEndedUpsellModal,
    Icon,
    Tooltip,
    useModalStateObject,
} from '@proton/components/components';
import { useSpotlightOnFeature } from '@proton/components/hooks';
import useAssistantTelemetry from '@proton/components/hooks/assistant/useAssistantTelemetry';
import { FeatureCode } from '@proton/features';
import { getHasAssistantStatus } from '@proton/llm/lib';
import { useAssistant } from '@proton/llm/lib/hooks/useAssistant';
import { OpenedAssistantStatus } from '@proton/llm/lib/types';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Recipient } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import ComposerAssistantInput from 'proton-mail/components/assistant/ComposerAssistantInput';
import ResumeDownloadingModal from 'proton-mail/components/assistant/modals/ResumeDownloadingModal';
import { removeLineBreaks } from 'proton-mail/helpers/string';
import useComposerAssistantGenerate from 'proton-mail/hooks/assistant/useComposerAssistantGenerate';
import useComposerAssistantScrollButton from 'proton-mail/hooks/assistant/useComposerAssistantScrollButton';
import useComposerAssistantSelectedText from 'proton-mail/hooks/assistant/useComposerAssistantSelectedText';
import { ComposerInnerModalStates } from 'proton-mail/hooks/composer/useComposerInnerModals';

import useComposerAssistantPosition from '../../hooks/assistant/useComposerAssistantPosition';
import AssistantFeedbackModal from './modals/AssistantFeedbackModal';
import { useComposerAssistantProvider } from './provider/ComposerAssistantProvider';

import './ComposerAssistant.scss';

interface Props {
    onUseGeneratedText: (value: string) => void;
    assistantID: string;
    composerContentRef: RefObject<HTMLElement>;
    composerContainerRef: RefObject<HTMLElement>;
    composerMetaRef: RefObject<HTMLElement>;
    selectedText: string;
    onUseRefinedText: (value: string) => void;
    getContentBeforeBlockquote: () => string;
    setContentBeforeBlockquote: (content: string) => void;
    setInnerModal: (innerModal: ComposerInnerModalStates) => void;
    recipients: Recipient[];
    sender: Recipient | undefined;
}

export type ReplacementStyle = 'generateFullMessage' | 'refineFullMessage' | 'refineSelectedText' | undefined;

const ComposerAssistant = ({
    assistantID,
    composerContainerRef,
    composerContentRef,
    composerMetaRef,
    onUseGeneratedText,
    onUseRefinedText,
    selectedText: inputSelectedText,
    getContentBeforeBlockquote,
    setContentBeforeBlockquote,
    setInnerModal,
    recipients,
    sender,
}: Props) => {
    const assistantSpotlight = useSpotlightOnFeature(FeatureCode.ComposerAssistantSpotlight);

    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const inputContainerRef = useRef<HTMLDivElement>(null);
    const { assistantRefManager } = useComposerAssistantProvider();

    const { sendNotUseAnswerAssistantReport } = useAssistantTelemetry();

    const composerAssistantTopValue = useComposerAssistantPosition({
        composerContainerRef,
        composerContentRef,
        composerMetaRef,
    });

    const upsellModal = useModalStateObject();
    const resumeDownloadModal = useModalStateObject();

    const assistantResultChildRef = useRef<HTMLDivElement>(null);
    const assistantResultRef = useRef<HTMLDivElement>(null);

    const { showArrow, handleScrollToBottom, checkScrollButtonDisplay } = useComposerAssistantScrollButton({
        assistantResultChildRef,
        assistantResultRef,
    });

    const { error, closeAssistant, isGeneratingResult, openedAssistants, setAssistantStatus, resumeDownloadModel } =
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
    } = useComposerAssistantSelectedText({
        assistantID,
        assistantResultRef,
        inputSelectedText,
        onResetRequest: handleResetRequest,
    });

    const { generationResult, generate, isRefiningText, submittedPrompt, replaceMessageBody, setReplacementStyle } =
        useComposerAssistantGenerate({
            assistantID,
            showAssistantSettingsModal: () => setInnerModal(ComposerInnerModalStates.AssistantSettings),
            showResumeDownloadModal: () => resumeDownloadModal.openModal(true),
            showUpsellModal: () => upsellModal.openModal(true),
            onResetSelection: () => {
                setFeedbackSubmitted(false);
                setSelectedText('');
            },
            hasSelection: selectedText ? selectedText.length > 0 : false,
            expanded: isAssistantExpanded,
            recipients,
            sender,
            getContentBeforeBlockquote,
            checkScrollButtonDisplay,
            selectedText,
            inputSelectedText,
            onUseGeneratedText,
            onUseRefinedText,
            setContentBeforeBlockquote,
        });

    const hasAssistantError = useMemo(() => {
        return !!error;
    }, [error]);

    // TODO: Check if move in composerAssistantInput and debounce
    const getCanUseRefineActions =
        !!selectedText || !!removeLineBreaks(getContentBeforeBlockquote()) || !!generationResult;

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

    useEffect(() => {
        assistantRefManager.container.set(assistantID, inputContainerRef);

        return () => {
            assistantRefManager.container.delete(assistantID);
        };
    }, []);

    const onInputClicked = () => {
        assistantSpotlight.onClose();
    };

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

                <div
                    className="relative shrink-0 flex flex-row flex-nowrap flex-column md:flex-row items-start my-0 w-full"
                    ref={inputContainerRef}
                >
                    <ComposerAssistantInput
                        assistantID={assistantID}
                        assistantResult={generationResult}
                        canUseRefineActions={getCanUseRefineActions}
                        expanded={isAssistantExpanded}
                        hasSelection={selectedText ? selectedText.length > 0 : false}
                        resetRequestRef={resetRequestRef}
                        onClickRefine={handleClickRefine}
                        onContentChange={() => expandAssistant()}
                        isRefiningText={isRefiningText}
                        setInnerModal={setInnerModal}
                        onGenerate={generate}
                        onInputClicked={onInputClicked}
                    />
                </div>
                <div className="flex-1 flex flex-nowrap flex-column">
                    {generationResult && !hasAssistantError && (
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
                                    {generationResult}

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
                                disabled={!generationResult || isGeneratingResult}
                            >
                                {c('Action').t`Use this`}
                            </Button>
                            <AssistantFeedbackModal
                                disabled={!generationResult || isGeneratingResult}
                                result={generationResult}
                                prompt={submittedPrompt}
                                feedbackSubmitted={feedbackSubmitted}
                                setFeedbackSubmitted={setFeedbackSubmitted}
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
            {upsellModal.render && (
                <ComposerAssistantTrialEndedUpsellModal
                    modalProps={{
                        ...upsellModal.modalProps,
                    }}
                    handleCloseAssistant={() => closeAssistant(assistantID, true)}
                />
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
