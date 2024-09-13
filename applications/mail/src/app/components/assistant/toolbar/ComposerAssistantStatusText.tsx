import type { RefObject } from 'react';
import { useEffect, useMemo, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Href } from '@proton/atoms/Href';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton';
import { ErrorZone, Icon, Tooltip, useModalStateObject } from '@proton/components';
import useAssistantTelemetry from '@proton/components/hooks/assistant/useAssistantTelemetry';
import { useAssistant } from '@proton/llm/lib';
import { ERROR_TYPE } from '@proton/shared/lib/assistant';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import AssistantUnsafeErrorFeedbackModal from 'proton-mail/components/assistant/modals/AssistantUnsafeErrorFeedbackModal';
import type { ComposerAssistantInitialSetupSpotlightRef } from 'proton-mail/components/assistant/spotlights/ComposerAssistantInitialSetupSpotlight';
import ComposerAssistantInitialSetupSpotlight from 'proton-mail/components/assistant/spotlights/ComposerAssistantInitialSetupSpotlight';

interface Props {
    assistantID: string;
    prompt: string;
    composerAssistantInitialSetupSpotlightRef: RefObject<ComposerAssistantInitialSetupSpotlightRef>;
}

const ComposerAssistantStatusText = ({ assistantID, prompt, composerAssistantInitialSetupSpotlightRef }: Props) => {
    const falsePositiveFeedback = useModalStateObject();

    const {
        isModelLoadingOnGPU,
        isModelDownloading,
        isCheckingCache,
        downloadPaused,
        downloadReceivedBytes,
        downloadModelSize,
        error,
        resumeDownloadModel,
        cancelDownloadModel,
    } = useAssistant(assistantID);

    const { sendPauseDownloadAssistantReport } = useAssistantTelemetry();

    const handlePauseDownload = () => {
        sendPauseDownloadAssistantReport();
        cancelDownloadModel?.();
    };

    const hasAssistantError = !!error;

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
            downloadReceivedBytes < downloadModelSize &&
            !hasAssistantError;
        /* Show initializing state when:
         * - Model is loading on GPU
         * - When model is already downloaded, we still need to launch the download function.
         *      During that phase we also want to show the init state.
         */
        const showInitializationState =
            isModelLoadingOnGPU || (isModelDownloading && !showDownloadState && !hasAssistantError) || isCheckingCache;

        return { showDownloadState, showInitializationState };
    }, [
        isModelDownloading,
        isModelLoadingOnGPU,
        downloadReceivedBytes,
        downloadModelSize,
        error,
        downloadPaused,
        isCheckingCache,
    ]);

    const spotlightAnchorRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (showDownloadState || showInitializationState) {
            composerAssistantInitialSetupSpotlightRef.current?.showSpotlight();
        }
    }, [showDownloadState, showInitializationState]);

    return (
        <>
            <ComposerAssistantInitialSetupSpotlight
                ref={composerAssistantInitialSetupSpotlightRef}
                anchorRef={spotlightAnchorRef}
            >
                <span
                    className="text-sm color-hint composer-assistant-hint flex flex-nowrap items-center"
                    id="composer-assistant-hint"
                    ref={spotlightAnchorRef}
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
                                        onClick={() => resumeDownloadModel?.()}
                                    >
                                        {c('Action').t`Resume downloading`}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <span aria-live="polite" aria-atomic="true">{c('Info')
                                        .jt`Downloading assistant… ${progressDisplay} GB`}</span>
                                    <Tooltip title={c('Action').t`Stop downloading assistant`}>
                                        <Button
                                            icon
                                            pill
                                            size="small"
                                            shape="ghost"
                                            className="ml-1 inline-flex items-center"
                                            onClick={handlePauseDownload}
                                        >
                                            <Icon name="pause-filled" alt={c('Action').t`Stop downloading assistant`} />
                                        </Button>
                                    </Tooltip>
                                </>
                            )}
                        </>
                    )}
                    {showInitializationState && <span>{c('Info').t`Initializing…`}</span>}
                </span>
            </ComposerAssistantInitialSetupSpotlight>
            {falsePositiveFeedback.render && (
                <AssistantUnsafeErrorFeedbackModal prompt={prompt} {...falsePositiveFeedback.modalProps} />
            )}
        </>
    );
};

export default ComposerAssistantStatusText;
