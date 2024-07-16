import { KeyboardEvent, MouseEvent, MutableRefObject, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton';
import {
    ComposerAssistantTrialEndedUpsellModal,
    Dropdown,
    DropdownButton,
    DropdownMenuButton,
    ErrorZone,
    Icon,
    InputFieldTwo,
    Progress,
    Tooltip,
    useModalState,
    useModalStateObject,
    usePopperAnchor,
} from '@proton/components/components';
import TextArea from '@proton/components/components/v2/input/TextArea';
import useAssistantTelemetry, { ERROR_TYPE } from '@proton/components/containers/llm/useAssistantTelemetry';
import { useAssistantSubscriptionStatus, useUserSettings } from '@proton/components/hooks';
import {
    Action,
    ActionType,
    PartialRefineAction,
    RefineActionType,
    RefineLocation,
    isPredefinedRefineActionType,
    isRefineActionType,
} from '@proton/llm/lib/types';
import { useAssistant } from '@proton/llm/lib/useAssistant';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { AI_ASSISTANT_ACCESS, Recipient } from '@proton/shared/lib/interfaces';
import generatingLoader from '@proton/styles/assets/img/illustrations/dot-loader.svg';
import clsx from '@proton/utils/clsx';

import { removeLineBreaks } from 'proton-mail/helpers/string';
import { ComposerInnerModalStates } from 'proton-mail/hooks/composer/useComposerInnerModals';

import { ReplacementStyle } from './ComposerAssistant';
import AssistantUnsafeErrorFeedbackModal from './modals/AssistantUnsafeErrorFeedbackModal';
import ResumeDownloadingModal from './modals/ResumeDownloadingModal';
import { useComposerAssistantProvider } from './provider/ComposerAssistantProvider';
import ComposerAssistantInitialSetupSpotlight, {
    ComposerAssistantInitialSetupSpotlightRef,
} from './spotlights/ComposerAssistantInitialSetupSpotlight';

interface Props {
    onGenerateResult: (fulltext: string, prompt: string) => void;
    assistantID: string;
    onContentChange: () => void;
    onRefine: (partialAction: PartialRefineAction) => Promise<void>;
    hasSelection: boolean;
    expanded: boolean;
    canUseRefineActions: boolean;
    assistantResult?: string;
    onClickRefine: () => void;
    onResetSelection: () => void;
    resetRequestRef: MutableRefObject<() => void>;
    getContentBeforeBlockquote: () => string;
    setReplacementStyle: (action: ReplacementStyle) => void;
    setInnerModal: (innerModal: ComposerInnerModalStates) => void;
    recipients: Recipient[];
    sender: Recipient | undefined;
    preventAutofocus?: boolean;
    onInputClicked: () => void;
}

const ComposerAssistantInput = ({
    onGenerateResult,
    assistantID,
    onContentChange,
    onRefine,
    hasSelection,
    expanded,
    canUseRefineActions,
    assistantResult,
    onClickRefine,
    onResetSelection,
    resetRequestRef,
    getContentBeforeBlockquote,
    setReplacementStyle,
    setInnerModal,
    recipients,
    sender,
    preventAutofocus = false,
    onInputClicked,
}: Props) => {
    // Request that the user is writing in the input
    const [assistantRequest, setAssistantRequest] = useState<string>('');
    const [inputOnFocus, setInputOnFocus] = useState(false);

    const inputRef = useRef<HTMLTextAreaElement>(null);

    const { assistantRefManager: assistantInputRefManager } = useComposerAssistantProvider();

    /**
     * In some conditions, we want to show the refine buttons:
     * - When the assistant is opened the first time, even though we focus the input by default (init state value)
     * - When the user just generated a text, and might want to improve the result.
     *   In that case we still have a prompt, but we want the user to see the refine buttons too
     *
     * To resolve those issues, we are forcing the display in certain cases.
     * However, when the user will type some text, we want to reset the state
     */
    const [shouldShowRefineButtons, setShouldShowRefineButtons] = useState(assistantRequest === '');
    const [{ AIAssistantFlags }] = useUserSettings();
    const [isRefiningText, setIsRefiningText] = useState(false);

    resetRequestRef.current = () => setAssistantRequest('');

    const composerAssistantInitialSetupSpotlightRef = useRef<ComposerAssistantInitialSetupSpotlightRef>(null);
    useEffect(() => {
        assistantInputRefManager.composerSpotlight.set(assistantID, composerAssistantInitialSetupSpotlightRef);
    }, []);

    const spotlightAnchorRef = useRef<HTMLDivElement>(null);
    const upsellModal = useModalStateObject();
    const falsePositiveFeedback = useModalStateObject();

    const [resumeDownloadProps, setResumeDownloadModalOpen] = useModalState();

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const { sendPauseDownloadAssistantReport } = useAssistantTelemetry();

    const {
        isModelDownloading,
        isModelLoadingOnGPU,
        downloadReceivedBytes,
        downloadModelSize,
        downloadPaused,
        generateResult,
        cancelRunningAction,
        isGeneratingResult,
        cancelDownloadModel,
        resumeDownloadModel,
        isModelDownloaded,
        error,
        closeAssistant,
    } = useAssistant(assistantID);

    const hasDownloadError = useMemo(() => {
        return !!error && !isModelDownloaded;
    }, [isModelDownloaded, error]);

    const { trialStatus, start: startTrial } = useAssistantSubscriptionStatus();

    function getEmailContentsForRefinement() {
        const composerContent = removeLineBreaks(getContentBeforeBlockquote());
        if (expanded && assistantResult) {
            return assistantResult;
        } else if (composerContent) {
            return composerContent;
        }
    }

    function buildAction(actionType: ActionType): Action | undefined {
        if (actionType === 'writeFullEmail') {
            return {
                type: 'writeFullEmail',
                prompt: assistantRequest,
                recipient: recipients?.[0]?.Name,
                sender: sender?.Name,
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
    }

    async function refineWithSelection(actionType: RefineActionType) {
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

        await onRefine(partialAction); // refine location (idxStart/idxEnd) is set later
    }

    function detectReplacementStyle(actionType: ActionType, hasGeneratedText: boolean): ReplacementStyle | undefined {
        const isRefine = isRefineActionType(actionType);
        // @formatter:off
        // prettier-ignore
        return (
            ( hasSelection && !assistantResult              ) ? 'refineSelectedText' :
            (!hasSelection && !hasGeneratedText &&  isRefine) ? 'refineFullMessage' :
            (!hasSelection && !assistantResult  && !isRefine) ? 'generateFullMessage' :
            undefined
        )
        // @formatter:on
    }

    const startGeneratingResult = async (actionType?: ActionType) => {
        // If user hasn't set the assistant yet, invite him to do so
        if (AIAssistantFlags === AI_ASSISTANT_ACCESS.UNSET) {
            setInnerModal(ComposerInnerModalStates.AssistantSettings);
            return;
        }

        // Warn the user that we need the download to be completed before generating a result
        if (downloadPaused) {
            setResumeDownloadModalOpen(true);
            return;
        }

        // Stop if trial ended
        if (trialStatus === 'trial-ended') {
            upsellModal.openModal(true);
            return;
        }

        // Unselect text (may take effect later, due to useState?)
        onResetSelection();

        // If actionType is undefined, it means we're being called with a user request
        // (user has typed stuff the AI input field), but caller doesn't know if this
        // has to be applied to full message generation or refinement of a specific part.
        const hasGeneratedText = Boolean(expanded && assistantResult);
        if (!actionType) {
            actionType = hasSelection ? 'customRefine' : 'writeFullEmail';
        }

        // Figure out which replacement style must be used to insert the new content
        const replacementStyle = detectReplacementStyle(actionType, hasGeneratedText);
        if (replacementStyle) {
            setReplacementStyle(replacementStyle);
        }

        const isRefineAction = isRefineActionType(actionType);

        if (isRefineAction) {
            setIsRefiningText(true);
        }

        // In case some text is selected, this is a refine action and
        // we let the composer input figure out idxStart / idxEnd
        if (hasSelection && isRefineAction) {
            await refineWithSelection(actionType as RefineActionType);
            setIsRefiningText(false);
            setShouldShowRefineButtons(true);
            return;
        }

        // Empty the user request field after they typed Enter
        if (isRefineActionType(actionType)) {
            setAssistantRequest('');
        }

        // No text is selected. It can be either full email generation, or a refine action.
        // Prepare the action and fire the LLM with it.
        const action = buildAction(actionType);
        if (action) {
            let trialStarted = false;
            await generateResult({
                action,
                callback: (res) => {
                    if (!trialStarted && trialStatus === 'trial-not-started') {
                        trialStarted = true;
                        void startTrial();
                    }
                    onGenerateResult(res, assistantRequest);
                },
            });
        }

        setIsRefiningText(false);
        setShouldShowRefineButtons(true);
    };

    const handleGenerateSubmit = async () => {
        await startGeneratingResult(undefined);
    };

    const handleKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
        composerAssistantInitialSetupSpotlightRef.current?.hideSpotlight();

        if (shouldShowRefineButtons) {
            setShouldShowRefineButtons(false);
        }

        // Block the submit action when
        // - A generation is going on in the current input
        // - There is no prompt in the input
        if (event.key === 'Enter' && !event.shiftKey && !isGeneratingResult && assistantRequest !== '') {
            event.preventDefault();
            await handleGenerateSubmit();
        }
    };

    const hasAssistantError = !!error;

    // Info for progress bar
    const progress = useMemo(() => {
        const showFullBar = isModelDownloaded || (downloadModelSize === 0 && downloadReceivedBytes === 0);
        const progress = showFullBar ? 100 : (downloadReceivedBytes / downloadModelSize) * 100;
        return Math.round(progress);
    }, [downloadReceivedBytes, downloadModelSize, isModelDownloaded]);

    const progressDisplay = useMemo(() => {
        const downloaded = humanSize({ bytes: downloadReceivedBytes, unit: 'GB', withoutUnit: true });
        const modelSize = humanSize({ bytes: downloadModelSize, unit: 'GB', withoutUnit: true });
        return (
            <span className="text-tabular-nums">
                {downloaded} / {modelSize}
            </span>
        );
    }, [downloadReceivedBytes, downloadModelSize]);

    const { showDownloadState, showInitializationState } = useMemo(() => {
        // Show downloading state when downloading (progress is increasing)
        const showDownloadState =
            (isModelDownloading || downloadPaused) &&
            downloadReceivedBytes > 0 &&
            progress < downloadModelSize &&
            !hasAssistantError;
        /* Show initializing state when:
         * - Model is loading on GPU
         * - When model is already downloaded, we still need to launch the download function.
         *      During that phase we also want to show the init state.
         */
        const showInitializationState =
            isModelLoadingOnGPU || (isModelDownloading && !showDownloadState && !hasAssistantError);

        return { showDownloadState, showInitializationState };
    }, [isModelDownloading, isModelLoadingOnGPU, downloadReceivedBytes, downloadModelSize, error, downloadPaused]);

    const handlePauseDownload = () => {
        sendPauseDownloadAssistantReport();
        cancelDownloadModel?.();
    };

    const handleResumeDownload = () => {
        resumeDownloadModel?.();
    };

    const handleClickOnInput = (e: MouseEvent) => {
        // To avoid infinite click caused by the spotlight in ComposerAssistant
        e.stopPropagation();

        onInputClicked();

        // If user hasn't set the assistant yet, invite him to do so
        if (AIAssistantFlags === AI_ASSISTANT_ACCESS.UNSET) {
            setInnerModal(ComposerInnerModalStates.AssistantSettings);
            return;
        }

        // Reset the input content when the user wants to refine text and clicks on the input, so that he can add a new prompt
        if (hasSelection) {
            setAssistantRequest('');
        }
    };

    const getLeftIcon = () => {
        if (isGeneratingResult) {
            return <img src={generatingLoader} alt="" width={16} className="mt-1" />;
        }
        if (hasSelection) {
            return (
                <Icon
                    name="text-quote-filled"
                    className="composer-assistant-special-color mt-0.5"
                    size={4}
                    alt={c('Info').t`You selected some content:`}
                />
            );
        }
        return <Icon name="pen-sparks" size={4} className="composer-assistant-special-color mt-0.5" />;
    };

    /** Show refine actions when
     *  - Not generating a result
     *  - Not downloading the model (or pausing it)
     *  - Not loading the model on the GPU
     *  - Some text is selected or present in the editor or generated text present in the assistant (canUseRefineActions)
     *  - The assistant has no error
     */
    const canShowRefineButtons =
        !isGeneratingResult &&
        !isModelDownloading &&
        !isModelLoadingOnGPU &&
        !downloadPaused &&
        canUseRefineActions &&
        !hasDownloadError &&
        !error;

    useEffect(() => {
        assistantInputRefManager.input.set(assistantID, inputRef);

        return () => {
            assistantInputRefManager.input.delete(assistantID);
        };
    }, []);

    const getRightButton = () => {
        if (isGeneratingResult) {
            if (inputOnFocus) {
                setInputOnFocus(false);
            }

            return (
                <Tooltip title={c('Action').t`Stop generating result`}>
                    <Button
                        icon
                        shape="ghost"
                        size="small"
                        pill
                        disabled={!isGeneratingResult}
                        onClick={cancelRunningAction}
                        className="mb-auto padding-custom"
                        style={{ padding: '0.0625rem' }} // 1px to get 28px button
                    >
                        <Icon name="stop" size={6} alt={c('Action').t`Stop generating result`} />
                    </Button>
                </Tooltip>
            );
        }

        /** real condition is
         * AI assistant expanded AND
         * (no selection OR (selection AND focus in prompt field) => focus in prompt field
         * Also, if we are forcing the refine buttons display, don't show the submit button
         */
        if (expanded && (inputOnFocus || assistantRequest) && !shouldShowRefineButtons) {
            return (
                <Tooltip title={c('Info').t`Generate text`}>
                    <Button
                        icon
                        shape="ghost"
                        color="weak"
                        size="small"
                        disabled={isGeneratingResult || assistantRequest === ''}
                        onClick={handleGenerateSubmit}
                        className="mb-auto"
                    >
                        <Icon
                            name="arrow-left-and-up"
                            className="rotateZ-270 composer-assistant-special-color"
                            alt={c('Action').t`Generate text`}
                        />
                    </Button>
                </Tooltip>
            );
        }

        if (canShowRefineButtons) {
            const handleClick = () => {
                toggle();
            };

            const proofreadButton = (
                <Tooltip title={hasSelection ? c('Info').t`Proofread selection` : c('Info').t`Proofread text`}>
                    <Button
                        onClick={() => {
                            onClickRefine();
                            void startGeneratingResult('proofread');
                        }}
                        shape="outline"
                        className="mr-1 mb-auto composer-assistant-refine-button"
                        size="small"
                    >
                        <Icon name="magnifier-check" className="composer-assistant-special-color mr-1" />
                        {c('Action').t`Proofread`}
                    </Button>
                </Tooltip>
            );

            const expandButton = (
                <Tooltip title={hasSelection ? c('Info').t`Expand selection` : c('Info').t`Expand text`}>
                    <Button
                        onClick={() => {
                            onClickRefine();
                            void startGeneratingResult('expand');
                        }}
                        shape="outline"
                        className="mr-1 mb-auto composer-assistant-refine-button"
                        size="small"
                    >
                        <Icon name="arrows-from-center-horizontal" className="composer-assistant-special-color mr-1" />
                        {c('Action').t`Expand`}
                    </Button>
                </Tooltip>
            );

            return (
                <span className="overflow-hidden flex flex-nowrap">
                    {/* Show an expand button when acting on a generated text (it should already be correct)*/}
                    {assistantResult ? expandButton : proofreadButton}
                    <Tooltip title={hasSelection ? c('Info').t`Shorten selection` : c('Info').t`Shorten text`}>
                        <Button
                            onClick={() => {
                                onClickRefine();
                                void startGeneratingResult('shorten');
                            }}
                            shape="outline"
                            className="mr-1 mb-auto composer-assistant-refine-button"
                            size="small"
                        >
                            <Icon name="arrow-to-center-horizontal" className="composer-assistant-special-color mr-1" />
                            {c('Action').t`Shorten`}
                        </Button>
                    </Tooltip>
                    <Tooltip title={c('Info').t`More refine actions`}>
                        <DropdownButton
                            as={Button}
                            type="button"
                            ref={anchorRef}
                            isOpen={isOpen}
                            onClick={handleClick}
                            className="mb-auto"
                            size="small"
                            shape="outline"
                            icon
                        >
                            <Icon name="three-dots-horizontal" alt={c('Action').t`More refine actions`} />
                        </DropdownButton>
                    </Tooltip>
                    <Dropdown autoClose autoCloseOutside isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                        {!assistantResult && (
                            <DropdownMenuButton
                                className="text-left flex flex-nowrap items-center"
                                onClick={() => {
                                    onClickRefine();
                                    void startGeneratingResult('expand');
                                }}
                            >
                                {c('Action').t`Expand`}
                            </DropdownMenuButton>
                        )}
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap items-center"
                            onClick={() => {
                                onClickRefine();
                                void startGeneratingResult('formal');
                            }}
                        >
                            {c('Action').t`Formalize`}
                        </DropdownMenuButton>
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap items-center"
                            onClick={() => {
                                onClickRefine();
                                void startGeneratingResult('friendly');
                            }}
                        >
                            {c('Action').t`Make it friendly`}
                        </DropdownMenuButton>
                    </Dropdown>
                </span>
            );
        }
    };

    const rightButton = getRightButton();

    const placeholderRandom = useMemo(() => {
        if (isGeneratingResult) {
            if (isRefiningText) {
                return c('Placeholder').t`Refining your text...`;
            }
            return c('Placeholder').t`Generating...`;
        }

        const placeholderPrompts = [
            c('Placeholder').t`Try “Invite Jane to my party”`,
            c('Placeholder').t`Try “Announce upcoming events in a newsletter”`,
            c('Placeholder').t`Try “Write a cover letter for an internship”`,
            c('Placeholder').t`Try “Cancel my gym membership”`,
            c('Placeholder').t`Try “Write a follow-up email to a client”`,
            c('Placeholder').t`Try “Thank my coworker for help on a project”`,
        ];

        return placeholderPrompts[Math.floor(Math.random() * placeholderPrompts.length)];
    }, [assistantID, isGeneratingResult, isRefiningText]);

    return (
        <ComposerAssistantInitialSetupSpotlight
            ref={composerAssistantInitialSetupSpotlightRef}
            anchorRef={spotlightAnchorRef}
        >
            <div className="w-full flex flex-column flex-nowrap" ref={spotlightAnchorRef}>
                <div className="flex flex-nowrap flex-row w-full mb-2">
                    <span className="shrink-0 mt-1 mr-2 flex items-start">{getLeftIcon()}</span>
                    <label className="sr-only">{c('Label').t`Type a prompt to generate an output`}</label>
                    <InputFieldTwo
                        ref={inputRef}
                        as={TextArea}
                        autoFocus={!hasSelection && !preventAutofocus}
                        value={assistantRequest}
                        onClick={handleClickOnInput}
                        placeholder={hasSelection ? c('Placeholder').t`Describe what to change` : placeholderRandom}
                        onValue={(value: string) => {
                            onContentChange?.();
                            setAssistantRequest(value);
                        }}
                        onKeyDown={handleKeyDown}
                        disabled={isGeneratingResult || hasDownloadError}
                        data-testid="composer:genie"
                        autoGrow
                        unstyled
                        dense
                        className="rounded-none composer-assistant-input pt-1 pb-0 resize-none"
                        aria-describedby="composer-assistant-refine-popover composer-assistant-hint"
                        onFocus={() => setInputOnFocus(true)}
                        onBlur={() => setInputOnFocus(false)}
                    />
                    <span className="shrink-0 flex composer-assistant-right-icons-container relative flex-row flex-nowrap overflow-hidden">
                        {rightButton}
                    </span>
                </div>
                <Progress
                    value={hasAssistantError ? 100 : progress}
                    className={clsx([
                        'w-full composer-assistant-progress',
                        hasAssistantError && 'composer-assistant-progress--error',
                    ])}
                />
                <span
                    className="text-sm color-hint composer-assistant-hint flex flex-nowrap items-center"
                    id="composer-assistant-hint"
                >
                    {hasAssistantError && (
                        <ErrorZone className="w-full">
                            <span className="mr-1">{error.error}</span>
                            {error?.errorType === ERROR_TYPE.GENERATION_HARMFUL && (
                                <InlineLinkButton
                                    className="color-inherit inline-block"
                                    onClick={() => falsePositiveFeedback.openModal(true)}
                                >
                                    {c('Action').t`Report an issue`}
                                </InlineLinkButton>
                            )}
                            {error?.errorType === ERROR_TYPE.CACHING_FAILED && (
                                <Href
                                    href={getKnowledgeBaseUrl('/proton-scribe-writing-assistant#system-requirements')}
                                    className="color-inherit inline-block"
                                    key="composer-assistant-learn-more-result-caching"
                                >{c('Link').t`Learn more`}</Href>
                            )}
                        </ErrorZone>
                    )}
                    {showDownloadState && (
                        <>
                            {downloadPaused ? (
                                <>
                                    <span aria-live="polite" aria-atomic="true">{c('Info')
                                        .jt`Downloading paused: ${progressDisplay} GB`}</span>
                                    <Button
                                        size="small"
                                        color="norm"
                                        shape="underline"
                                        className="ml-2 inline-flex items-center"
                                        onClick={handleResumeDownload}
                                    >
                                        {c('Action').t`Resume downloading`}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <span aria-live="polite" aria-atomic="true">{c('Info')
                                        .jt`Downloading the writing assistant: ${progressDisplay} GB`}</span>
                                    <Tooltip title={c('Action').t`Stop downloading the writing assistant`}>
                                        <Button
                                            icon
                                            pill
                                            size="small"
                                            shape="ghost"
                                            className="ml-1 inline-flex items-center"
                                            onClick={handlePauseDownload}
                                        >
                                            <Icon
                                                name="pause-filled"
                                                alt={c('Action').t`Stop downloading the writing assistant`}
                                            />
                                        </Button>
                                    </Tooltip>
                                </>
                            )}
                        </>
                    )}
                    {showInitializationState && <span>{c('Info').t`Initializing…`}</span>}
                </span>
                <ResumeDownloadingModal onResumeDownload={handleResumeDownload} {...resumeDownloadProps} />
                {upsellModal.render && (
                    <ComposerAssistantTrialEndedUpsellModal
                        modalProps={{
                            ...upsellModal.modalProps,
                        }}
                        handleCloseAssistant={() => closeAssistant(assistantID, true)}
                    />
                )}
                {falsePositiveFeedback.render && (
                    <AssistantUnsafeErrorFeedbackModal
                        prompt={assistantRequest}
                        {...falsePositiveFeedback.modalProps}
                    />
                )}
            </div>
        </ComposerAssistantInitialSetupSpotlight>
    );
};

export default ComposerAssistantInput;
