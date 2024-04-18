import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import { Scroll } from '@proton/atoms/Scroll';
import { Icon, Tooltip } from '@proton/components/components';
import ErrorZone from '@proton/components/components/text/ErrorZone';
import { useAssistant } from '@proton/llm/lib/useAssistant';
import useAssistantTelemetry from '@proton/llm/lib/useAssistantTelemetry';
import { getBlogURL } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import ComposerAssistantInput from 'proton-mail/components/assistant/ComposerAssistantInput';

import './ComposerAssistant.scss';

interface Props {
    onUseGeneratedText: (value: string) => void;
    onUpdateShowAssistant?: (value: boolean) => void;
    onCleanGeneration?: (text: string) => string;
    assistantID: string;
}

const ComposerAssistant = ({ onUseGeneratedText, onUpdateShowAssistant, assistantID, onCleanGeneration }: Props) => {
    const [result, setResult] = useState('');

    const { error, closeAssistant, isWaitingForResult } = useAssistant();
    const { sendUseAnswerAssistantReport } = useAssistantTelemetry();

    const hasAssistantError = !!error;

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

    const learnMoreLink = (
        <Href href={getBlogURL('/todo')} className="inline-block color-weak" key="composer-assistant-learn-more">{c(
            'Link'
        ).t`Learn more`}</Href>
    );

    return (
        <div className="composer-assistant-container absolute">
            <div className="composer-assistant rounded-lg flex-nowrap flex flex-column mx-2 my-4 relative">
                <div className="shrink-0 mt-3 pr-2 flex flex-row flex-nowrap flex-column md:flex-row items-stretch md:items-center my-0 pb-2 w-full">
                    <ComposerAssistantInput onGenerateResult={handleGenerateResult} />
                    <Tooltip title={c('loc_nightly_assistant').t`Close AI Assistant`}>
                        <Button
                            className="absolute top-0 right-0 m-0.5"
                            icon
                            shape="ghost"
                            size="small"
                            onClick={handleCloseAssistant}
                        >
                            <Icon name="cross" alt={c('loc_nightly_assistant').t`Close AI Assistant`} />
                        </Button>
                    </Tooltip>
                </div>
                <div className="flex-1 flex flex-nowrap flex-column">
                    {hasAssistantError && <ErrorZone>{error}</ErrorZone>}
                    {result && !hasAssistantError && (
                        <>
                            <div className="flex-1 overflow-auto mt-0 mb-4 text-pre-wrap">
                                <Scroll>{result}</Scroll>
                            </div>
                            <div className="shrink-0 flex flex-nowrap flex-row w-full items-center">
                                <div className="color-weak text-sm pr-4 flex-1">{c('loc_nightly_assistant')
                                    .jt`This is intended as a writing aid. Check suggested text for accuracy. ${learnMoreLink}`}</div>
                                <div className="shrink-0 flex items-center">
                                    {/*TODO show this button later*/}
                                    {/*<Tooltip title={c('loc_nightly_assistant').t`Refine result`}>*/}
                                    {/*    <Button*/}
                                    {/*        icon*/}
                                    {/*        shape="ghost"*/}
                                    {/*        size="small"*/}
                                    {/*        disabled={isWaitingForResult}*/}
                                    {/*        onClick={() => console.log('TODO')}*/}
                                    {/*        className="mr-2"*/}
                                    {/*    >*/}
                                    {/*        <Icon name="arrow-rotate-right" alt={c('loc_nightly_assistant').t`Refine result`} />*/}
                                    {/*    </Button>*/}
                                    {/*</Tooltip>*/}
                                    <Button
                                        onClick={replaceMessageBody}
                                        className={clsx([
                                            isWaitingForResult ? 'visibility-hidden' : 'composer-assistant-button',
                                        ])}
                                        disabled={isWaitingForResult}
                                    >
                                        {c('loc_nightly_assistant').t`Use this`}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ComposerAssistant;
