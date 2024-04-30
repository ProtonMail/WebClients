import { KeyboardEvent, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Input } from '@proton/atoms/Input';
import { CircularProgress, Icon, Tooltip } from '@proton/components/components';
import { useAssistant } from '@proton/llm/lib/useAssistant';

interface Props {
    onGenerateResult: (token: string, fulltext: string) => void;
}

const ComposerAssistantInput = ({ onGenerateResult }: Props) => {
    const [assistantRequest, setAssistantRequest] = useState<string>('');

    const {
        isModelDownloading,
        isModelLoadingOnGPU,
        downloadModelProgress,
        isGeneratingResult,
        generateResult,
        cancelRunningAction,
    } = useAssistant();

    const startGeneratingResult = async () => {
        await generateResult({ inputText: assistantRequest, callback: onGenerateResult });
    };

    const handleGenieKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
        // If a generation is going on in the current input, block the user from performing another generation
        if (event.key === 'Enter' && !isGeneratingResult) {
            await startGeneratingResult();
        }
    };

    // TODO replace icons
    const getLeftIcon = () => {
        // We have no way to differentiate the download step from the loading GPU state at this point
        // So if we have a progress, we're downloading so we can show the progress bar, otherwise show a spinner
        // (TODO) UPDATE: now, can differentiate download and load, so maybe this can be changed?
        const progress = downloadModelProgress * 100;
        const showDownloadProgress = isModelDownloading && progress > 0 && progress < 100;

        if (showDownloadProgress) {
            const progressDisplay = Math.round(progress);
            return (
                <Tooltip title={c('loc_nightly_assistant').t`Downloading model: ${progressDisplay}%`}>
                    <div>
                        <CircularProgress size={20} progress={progressDisplay}></CircularProgress>
                        <span className="sr-only" aria-live="assertive" aria-atomic="true">{c('loc_nightly_assistant')
                            .t`Downloading model: ${progressDisplay}%`}</span>
                    </div>
                </Tooltip>
            );
        } else if (isGeneratingResult || isModelLoadingOnGPU || isModelDownloading) {
            return <CircleLoader className="composer-assistant-spinner" />;
        }
        return <Icon name="pen" size={5} />;
    };

    const getRightButton = () => {
        // if (isModelDownloading) {
        // TODO enable once we have a way to cancel download
        /*return (
                <Button shape="ghost" onClick={cancelDownloadModel}>
                    {c('Action').t`Cancel`}
                </Button>
            );*/
        // } else
        if (isGeneratingResult) {
            return (
                <Button
                    icon
                    shape="solid"
                    color="norm"
                    pill
                    size="small"
                    disabled={!isGeneratingResult}
                    onClick={cancelRunningAction}
                >
                    <Icon name="pause" alt={c('loc_nightly_assistant').t`Stop generating result`} />
                </Button>
            );
        }

        return (
            <Button
                icon
                shape="solid"
                color="norm"
                pill
                size="small"
                disabled={isGeneratingResult}
                onClick={startGeneratingResult}
            >
                <Icon name="arrow-up" alt={c('loc_nightly_assistant').t`Generate`} />
            </Button>
        );
    };

    const rightButton = getRightButton();

    return (
        <div className="flex flex-nowrap flex-row w-full">
            <span className="my-auto shrink-0 mr-2 flex">{getLeftIcon()}</span>
            <label className="sr-only">{c('loc_nightly_assistant').t`Type a prompt to generate an output`}</label>
            <Input
                autoFocus
                value={assistantRequest}
                placeholder={c('loc_nightly_assistant').t`Try "Invite Vanessa to my birthday party"`}
                onChange={(e) => setAssistantRequest(e.target?.value || '')}
                onKeyDown={handleGenieKeyDown}
                disabled={isGeneratingResult}
                data-testid="composer:genie"
                unstyled
                className="flex-1 composer-assistant-input"
                inputClassName="pl-0"
            />
            <span className="my-auto shrink-0">{rightButton}</span>
        </div>
    );
};

export default ComposerAssistantInput;
