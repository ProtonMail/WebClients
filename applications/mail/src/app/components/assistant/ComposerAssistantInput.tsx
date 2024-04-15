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
        isWaitingForResult,
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
        if (isModelDownloading) {
            const progressDisplay = Math.round(downloadModelProgress * 100);
            return (
                <Tooltip title={c('loc_nightly_assistant').t`Downloading model: ${progressDisplay}%`}>
                    <div>
                        <CircularProgress size={16} progress={progressDisplay}></CircularProgress>
                        <span className="sr-only" aria-live="assertive" aria-atomic="true">{c('loc_nightly_assistant')
                            .t`Downloading model: ${progressDisplay}%`}</span>
                    </div>
                </Tooltip>
            );
        } else if (isGeneratingResult || isModelLoadingOnGPU) {
            return <CircleLoader />;
        }
        return <Icon name="pen" />;
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
        if (isWaitingForResult) {
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
                placeholder='Try "Invite Vanessa to my birthday party"'
                onChange={(e) => setAssistantRequest(e.target?.value || '')}
                onKeyDown={handleGenieKeyDown}
                disabled={isGeneratingResult}
                data-testid="composer:genie"
                unstyled
                className="flex-1"
                inputClassName="pl-0"
            />
            <span className="my-auto shrink-0">{rightButton}</span>
        </div>
    );
};

export default ComposerAssistantInput;
