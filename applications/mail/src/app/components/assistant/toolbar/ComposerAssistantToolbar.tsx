import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Vr } from '@proton/atoms/Vr';
import { Icon, Tooltip } from '@proton/components/components';
import { useActiveBreakpoint } from '@proton/components/hooks';
import { ASSISTANT_SERVER_THROTTLE_TIMEOUT, useAssistant } from '@proton/llm/lib';
import type { ActionType } from '@proton/llm/lib/types';
import { wait } from '@proton/shared/lib/helpers/promise';
import generatingLoader from '@proton/styles/assets/img/illustrations/dot-loader.svg';

import { useComposerAssistantProvider } from 'proton-mail/components/assistant/provider/ComposerAssistantProvider';
import type { ComposerAssistantInitialSetupSpotlightRef } from 'proton-mail/components/assistant/spotlights/ComposerAssistantInitialSetupSpotlight';
import type { GenerateResultProps } from 'proton-mail/hooks/assistant/useComposerAssistantGenerate';

import ComposerAssistantCustomInput from './ComposerAssistantCustomInput';
import ComposerAssistantQuickAction from './ComposerAssistantQuickAction';
import ComposerAssistantQuickActionsDropdown from './ComposerAssistantQuickActionsDropdown';
import ComposerAssistantStatusText from './ComposerAssistantStatusText';

interface Props {
    assistantID: string;
    isAssistantExpanded?: boolean;
    selectedText?: string;
    prompt: string;
    setPrompt: (value: string) => void;
    onExpandAssistant: () => void;
    onGenerate: (props: GenerateResultProps) => Promise<void>;
    canUseRefineButtons: boolean;
    onCancelGeneration: () => void;
}

const ComposerAssistantToolbar = ({
    assistantID,
    isAssistantExpanded,
    selectedText,
    prompt,
    setPrompt,
    onExpandAssistant,
    onGenerate,
    canUseRefineButtons,
    onCancelGeneration,
}: Props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { assistantRefManager } = useComposerAssistantProvider();

    const composerAssistantInitialSetupSpotlightRef = useRef<ComposerAssistantInitialSetupSpotlightRef>(null);

    const { viewportWidth } = useActiveBreakpoint();

    const { isGeneratingResult, cancelRunningAction, isModelDownloading, isModelDownloaded } =
        useAssistant(assistantID);

    const handleGenerate = async (actionType?: ActionType) => {
        onExpandAssistant();
        void onGenerate({
            actionType,
            assistantRequest: prompt,
            setAssistantRequest: setPrompt,
        });
        // We want to have focus inside assistant when popover is closed (so that user can close assistant using Esc)
        containerRef.current?.focus();
    };

    // Set this ref around the toolbar so that any click on the toolbar (that is outside the assistant generation)
    // is not resetting the user selected text
    useEffect(() => {
        assistantRefManager.container.set(assistantID, containerRef);

        return () => {
            assistantRefManager.container.delete(assistantID);
        };
    }, []);

    const handleCancelGeneration = async () => {
        cancelRunningAction();
        // Wait for the last callback to be called before reverting the content
        await wait(ASSISTANT_SERVER_THROTTLE_TIMEOUT + 20);
        onCancelGeneration();
    };

    /*
     * When the assistant is expanded and downloading, we want to show the toolbar in a disabled state
     * We are already in a "isGenerating" state, so we need to show the toolbar instead of the generating button
     */
    const isExpandedAndDownloading = isAssistantExpanded && (isModelDownloading || !isModelDownloaded);
    const showGenerationState = isGeneratingResult && !isExpandedAndDownloading && isModelDownloaded;
    const disableActions = isExpandedAndDownloading;

    return (
        <div
            ref={containerRef}
            tabIndex={-1}
            className="outline-none--at-all mb-2"
            aria-labelledby={`heading-${assistantID}`}
        >
            <h1 id={`heading-${assistantID}`} className="sr-only">{c('Info').t`Scribe panel`}</h1>
            <div>
                {showGenerationState ? (
                    <div className="inline-flex flex-row flex-nowrap items-center">
                        <img src={generatingLoader} alt="" width={16} className="shrink-0" />
                        <p className="flex-1 my-0 mx-2 text-sm">{c('Placeholder').t`Generating`}</p>
                        <Tooltip originalPlacement="bottom" title={c('Action').t`Stop generating result`}>
                            <Button
                                shape="ghost"
                                size="small"
                                icon
                                className="shrink-0"
                                onClick={handleCancelGeneration}
                            >
                                <Icon name="cross" alt={c('Action').t`Stop generating result`} />
                            </Button>
                        </Tooltip>
                    </div>
                ) : (
                    <div className="flex flex-row flex-nowrap items-center">
                        <ComposerAssistantCustomInput
                            selectedText={selectedText}
                            isAssistantExpanded={isAssistantExpanded}
                            prompt={prompt}
                            setPrompt={setPrompt}
                            onSubmit={() => handleGenerate(undefined)}
                            disabled={disableActions}
                            onCloseSpotlight={() => composerAssistantInitialSetupSpotlightRef.current?.hideSpotlight()}
                        />
                        <Vr className="h-custom" style={{ '--h-custom': '2em' }} />
                        {!isAssistantExpanded && !viewportWidth.xsmall && (
                            <>
                                <ComposerAssistantQuickAction
                                    tooltipText={
                                        selectedText ? c('Info').t`Proofread selection` : c('Info').t`Proofread text`
                                    }
                                    text={c('Action').t`Proofread`}
                                    icon="magnifier-check"
                                    onClickRefineAction={() => handleGenerate('proofread')}
                                    disabled={!canUseRefineButtons || disableActions}
                                />
                                <Vr className="h-custom" style={{ '--h-custom': '2em' }} />
                            </>
                        )}
                        {!viewportWidth['<=small'] && (
                            <>
                                <ComposerAssistantQuickAction
                                    tooltipText={
                                        selectedText ? c('Info').t`Expand selection` : c('Info').t`Expand text`
                                    }
                                    text={c('Action').t`Expand`}
                                    icon="arrows-from-center-horizontal"
                                    onClickRefineAction={() => handleGenerate('expand')}
                                    disabled={!canUseRefineButtons || disableActions}
                                />
                                <Vr className="h-custom" style={{ '--h-custom': '2em' }} />
                                <ComposerAssistantQuickAction
                                    tooltipText={
                                        selectedText ? c('Info').t`Shorten selection` : c('Info').t`Shorten text`
                                    }
                                    text={c('Action').t`Shorten`}
                                    icon="arrow-to-center-horizontal"
                                    onClickRefineAction={() => handleGenerate('shorten')}
                                    disabled={!canUseRefineButtons || disableActions}
                                />
                                <Vr className="h-custom" style={{ '--h-custom': '2em' }} />
                            </>
                        )}

                        <ComposerAssistantQuickActionsDropdown
                            onClickRefineAction={handleGenerate}
                            disableActions={!canUseRefineButtons || disableActions}
                        />
                    </div>
                )}
            </div>

            <ComposerAssistantStatusText
                assistantID={assistantID}
                prompt={prompt}
                composerAssistantInitialSetupSpotlightRef={composerAssistantInitialSetupSpotlightRef}
            />
        </div>
    );
};

export default ComposerAssistantToolbar;
