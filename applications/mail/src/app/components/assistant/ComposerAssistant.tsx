import { RefObject, useMemo, useRef, useState } from 'react';

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
import useComposerAssistantSelectedText from 'proton-mail/hooks/assistant/useComposerAssistantSelectedText';

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
    onRefine?: (value: string) => void; // TODO use this later
}

const ComposerAssistant = ({
    onUseGeneratedText,
    onUpdateShowAssistant,
    assistantID,
    onCleanGeneration,
    composerContentRef,
    composerContainerRef,
    composerMetaRef,
    isAssistantInitialSetup,
    selectedText: inputSelectedText,
}: Props) => {
    const [result, setResult] = useState('');
    const [expanded, setExpanded] = useState(false);
    const [displayRefinePopover, setDisplayRefinePopover] = useState<boolean>(false);

    const { sendUseAnswerAssistantReport } = useAssistantTelemetry();

    const composerAssistantTopValue = useComposerAssistantPosition({
        composerContainerRef,
        composerContentRef,
        composerMetaRef,
    });

    const { error, closeAssistant, isGeneratingResult } = useAssistant(assistantID);

    // Selected text in the composer or assistant result that the user might want to refine
    const assistantResultRef = useRef<HTMLDivElement>(null);
    const { selectedText } = useComposerAssistantSelectedText({
        assistantResultRef,
        inputSelectedText,
        canCheckSelection: !!result && !isGeneratingResult,
    });

    const hasAssistantError = useMemo(() => {
        return !!error;
    }, [error]);

    const replaceMessageBody = async () => {
        onUseGeneratedText(result);

        onUpdateShowAssistant?.(false);
        sendUseAnswerAssistantReport();
        closeAssistant(assistantID);
    };

    const handleGenerateResult = (_: string, fulltext: string) => {
        const cleanedText = onCleanGeneration?.(fulltext) || fulltext;
        setResult(cleanedText);
    };

    const handleCloseAssistant = () => {
        onUpdateShowAssistant?.(false);
        closeAssistant(assistantID);
    };

    const handleCloseRefinePopover = () => {
        setDisplayRefinePopover(false);
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
                                <Scroll customContainerRef={assistantResultRef}>{result}</Scroll>
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
