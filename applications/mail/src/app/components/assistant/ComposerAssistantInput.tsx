import { KeyboardEvent, MouseEvent, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, InputFieldTwo, Progress, Tooltip, useModalState } from '@proton/components/components';
import ErrorZone from '@proton/components/components/text/ErrorZone';
import TextArea from '@proton/components/components/v2/input/TextArea';
import { ASSISTANT_FEATURE_NAME } from '@proton/llm/lib';
import { useAssistant } from '@proton/llm/lib/useAssistant';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import generatingLoader from '@proton/styles/assets/img/illustrations/dot-loader.svg';
import clsx from '@proton/utils/clsx';

import ResumeDownloadingModal from './modals/ResumeDownloadingModal';
import ComposerAssistantInitialSetupSpotlight from './spotlights/ComposerAssistantInitialSetupSpotlight';

interface Props {
    onGenerateResult: (fulltext: string) => void;
    assistantID: string;
    onContentChange: () => void;
    isAssistantInitialSetup?: boolean;
    onRefine: (prompt: string) => Promise<void>;
    hasSelection: boolean;
}

const ComposerAssistantInput = ({
    onGenerateResult,
    assistantID,
    onContentChange,
    onRefine,
    isAssistantInitialSetup,
    hasSelection,
}: Props) => {
    // Request that the user is writing in the input
    const [assistantRequest, setAssistantRequest] = useState<string>('');

    // Show a spotlight the first time the user is viewing the assistant (when clicking on the input)
    const [showSetupSpotlight, setShowSetupSpotlight] = useState(false);
    const spotlightAnchorRef = useRef<HTMLDivElement>(null);

    const [resumeDownloadProps, setResumeDownloadModalOpen] = useModalState();

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
        initAssistant,
    } = useAssistant(assistantID);

    const refineResult = async () => {
        await onRefine(assistantRequest);
    };

    const startGeneratingResult = async () => {
        // Warn the user that we need the download to be completed before generating a result
        if (downloadPaused) {
            setResumeDownloadModalOpen(true);
        } else {
            if (hasSelection) {
                // Refine some part of the editor content
                await refineResult();
            } else {
                // Generate result from a prompt
                await generateResult({
                    action: {
                        type: 'writeFullEmail',
                        prompt: assistantRequest,
                    },
                    callback: onGenerateResult,
                });
            }
        }
    };

    const handleGenieKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
        // Block the submit action when
        // - A generation is going on in the current input
        // - There is no prompt in the input
        if (event.key === 'Enter' && !event.shiftKey && !isGeneratingResult && assistantRequest !== '') {
            await startGeneratingResult();
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
        cancelDownloadModel();
    };

    const handleResumeDownload = () => {
        resumeDownloadModel();
    };

    const handleClickOnInput = (e: MouseEvent) => {
        e.stopPropagation(); // TODO REMOVE?
        // The first time the user is opening the composer, the assistant will be opened by default to show the feature
        // Then when the user clicks on the input, we will show a spotlight and start the model init (download + load on GPU)
        if (isAssistantInitialSetup) {
            initAssistant();
            setShowSetupSpotlight(true);
        }

        // Reset the input content when the user wants to refine text and clicks on the input, so that he can add a new prompt
        if (hasSelection) {
            setAssistantRequest('');
        }
    };

    const getLeftIcon = () => {
        if (isGeneratingResult) {
            return <img src={generatingLoader} alt="" width={20} />;
        }
        return <Icon name="pen-sparks" size={5} className="composer-assistant-special-color" />;
    };

    const getRightButton = () => {
        if (isGeneratingResult) {
            return (
                <Tooltip title={c('loc_nightly_assistant').t`Stop generating result`}>
                    <Button
                        icon
                        shape="ghost"
                        size="small"
                        disabled={!isGeneratingResult}
                        onClick={cancelRunningAction}
                        className="mb-auto"
                    >
                        <Icon name="stop" alt={c('loc_nightly_assistant').t`Stop generating result`} />
                    </Button>
                </Tooltip>
            );
        }

        return (
            <Button
                icon
                shape="ghost"
                color="weak"
                size="small"
                disabled={isGeneratingResult || assistantRequest === ''}
                onClick={startGeneratingResult}
                className="mb-auto"
            >
                <Icon
                    name="arrow-left-and-up"
                    className="rotateZ-270 composer-assistant-special-color"
                    alt={c('loc_nightly_assistant').t`Generate`}
                />
            </Button>
        );
    };

    const rightButton = getRightButton();

    return (
        <ComposerAssistantInitialSetupSpotlight isInitialSetup={showSetupSpotlight} anchorRef={spotlightAnchorRef}>
            <div className="w-full flex flex-column flex-nowrap">
                <div className="flex flex-nowrap flex-row w-full mb-2">
                    <span className="shrink-0 mt-1 mr-2 flex">{getLeftIcon()}</span>
                    <label className="sr-only">{c('loc_nightly_assistant')
                        .t`Type a prompt to generate an output`}</label>
                    <InputFieldTwo
                        as={TextArea}
                        autoFocus
                        value={assistantRequest}
                        onClick={handleClickOnInput}
                        placeholder={c('loc_nightly_assistant').t`Try "Invite Vanessa to my birthday party"`}
                        onValue={(value: string) => {
                            onContentChange?.();
                            setAssistantRequest(value);
                        }}
                        onKeyDown={handleGenieKeyDown}
                        disabled={isGeneratingResult}
                        data-testid="composer:genie"
                        autoGrow
                        unstyled
                        dense
                        className="rounded-none composer-assistant-input pt-1 pb-0 resize-none"
                        aria-describedby="composer-assistant-refine-popover composer-assistant-hint"
                    />
                    <span className="shrink-0 pr-8 flex">{rightButton}</span>
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
                    {hasAssistantError && <ErrorZone>{error}</ErrorZone>}
                    {showDownloadState && (
                        <>
                            <span aria-live="polite" aria-atomic="true">{c('loc_nightly_assistant')
                                .jt`Downloading ${ASSISTANT_FEATURE_NAME}: ${progressDisplay} GB`}</span>
                            {downloadPaused ? (
                                <Button
                                    size="small"
                                    color="norm"
                                    shape="underline"
                                    className="ml-2 inline-flex items-center"
                                    onClick={handleResumeDownload}
                                >
                                    {c('loc_nightly_assistant').t`Resume downloading`}
                                </Button>
                            ) : (
                                <Tooltip
                                    title={c('loc_nightly_assistant').t`Stop downloading ${ASSISTANT_FEATURE_NAME}`}
                                >
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
                                            alt={c('loc_nightly_assistant')
                                                .t`Stop downloading ${ASSISTANT_FEATURE_NAME}`}
                                        />
                                    </Button>
                                </Tooltip>
                            )}
                        </>
                    )}
                    {showInitializationState && <span>{c('loc_nightly_assistant').t`Initializing…`}</span>}
                </span>
                <ResumeDownloadingModal onResumeDownload={handleResumeDownload} {...resumeDownloadProps} />
            </div>
        </ComposerAssistantInitialSetupSpotlight>
    );
};

export default ComposerAssistantInput;
