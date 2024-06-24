import { useState } from 'react';

import { c } from 'ttag';

import useAssistantTelemetry, {
    ASSISTANT_TYPE,
    ERROR_TYPE,
} from '@proton/components/containers/llm/useAssistantTelemetry';
import { useApi } from '@proton/components/hooks';
import { utf8ArrayToString } from '@proton/crypto/lib/utils';
import {
    AssistantRunningActionResolver,
    GenerateAssistantResult,
    PromptRejectedError,
    getGenerationType,
    sendAssistantRequest,
} from '@proton/llm/lib';
import { prepareServerAssistantInteraction } from '@proton/llm/lib/actions';
import type useAssistantCommons from '@proton/llm/lib/hooks/useAssistantCommons';
import type useOpenedAssistants from '@proton/llm/lib/hooks/useOpenedAssistants';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';
import throttle from '@proton/utils/throttle';

interface Props {
    commonState: ReturnType<typeof useAssistantCommons>;
    openedAssistantsState: ReturnType<typeof useOpenedAssistants>;
}

export const useAssistantServer = ({ commonState, openedAssistantsState }: Props) => {
    const api = useApi();

    const { openAssistant, setAssistantStatus, closeAssistant, openedAssistants } = openedAssistantsState;
    const {
        canShowAssistant,
        hasCompatibleHardware,
        hasCompatibleBrowser,
        canUseAssistant,
        errors,
        addSpecificError,
        cleanSpecificErrors,
        assistantSubscriptionStatus,
    } = commonState;

    const { sendRequestAssistantReport, sendAssistantErrorReport } = useAssistantTelemetry();

    const [runningActionResolvers, setRunningActionResolvers] = useState<AssistantRunningActionResolver[]>([]);

    const getRunningActionPromiseFromAssistantID = (assistantID: string) => {
        return runningActionResolvers.find((resolver) => resolver.assistantID === assistantID);
    };

    const cleanRunningActionPromises = (assistantID: string) => {
        setRunningActionResolvers((runningActionResolvers) =>
            runningActionResolvers.filter((resolver) => {
                return resolver.assistantID !== assistantID;
            })
        );
    };

    const cancelRunningAction = (assistantID: string) => {
        try {
            const actionResolver = getRunningActionPromiseFromAssistantID(assistantID);
            if (actionResolver) {
                actionResolver.resolver();
            }
            cleanRunningActionPromises(assistantID);
        } catch (e: any) {
            sendAssistantErrorReport({
                assistantType: ASSISTANT_TYPE.SERVER,
                errorType: ERROR_TYPE.GENERATION_CANCEL_FAIL,
            });
        }
    };

    const generateResult = async ({ action, callback, assistantID }: GenerateAssistantResult) => {
        const runningActionInAssistant = getRunningActionPromiseFromAssistantID(assistantID);
        if (runningActionInAssistant) {
            return;
        }

        // Reset generation errors in this assistant
        cleanSpecificErrors(assistantID);

        try {
            const ingestionStart = performance.now();
            const {
                rawLlmPrompt: prompt,
                transformCallback: transform,
                stopStrings,
            } = prepareServerAssistantInteraction(action);

            // Set the running actions directly with a fake resolver so that the UI gets updated directly
            // Then, when we'll have access to the resolver we will set the running actions again
            const runningActions = runningActionResolvers;
            setRunningActionResolvers([...runningActions, { assistantID, resolver: noop }]);

            const response = await api({
                ...sendAssistantRequest({ prompt, stopStrings }),
                output: 'stream',
            });
            const reader = response.getReader();

            const resolver = () => {
                reader.cancel();
            };

            setRunningActionResolvers([...runningActions, { assistantID, resolver }]);

            if (assistantSubscriptionStatus.trialStatus === 'trial-not-started') {
                await assistantSubscriptionStatus.start();
            }

            // Each chunk contains a part of the generated text, but we have to give the full text to update the content in the UI
            let fullServerContent = '';
            let generatedTokens = 0;

            // Make the change in the UI less often so that we don't blast the component with too many re-renders
            const throttledCallback = throttle((callback) => callback(), 100);

            const ingestionEnd = performance.now();
            const ingestionTime = ingestionEnd - ingestionStart;

            const GenerationStart = performance.now();
            // Read the text that we get from the stream
            await reader.read().then(function process({ done, value }: any) {
                if (done) {
                    // close function does not seem to exist
                    reader.cancel();
                    return;
                }

                const array = new Uint8Array(value);
                const serverChunk = utf8ArrayToString(array);

                fullServerContent += serverChunk;
                generatedTokens++;

                const fulltext = fullServerContent
                    .split('\n')
                    .map((s) => {
                        try {
                            return JSON.parse(s).content || '';
                        } catch (e) {
                            return '';
                        }
                    })
                    .join('');

                const transformed = transform(fulltext);
                if (transformed === undefined) {
                    throw new PromptRejectedError();
                }

                throttledCallback(() => callback(transformed));

                return reader.read().then(process);
            });
            const GenerationEnd = performance.now();
            const GenerationTime = GenerationEnd - GenerationStart;
            sendRequestAssistantReport({
                assistantType: ASSISTANT_TYPE.SERVER,
                generationType: getGenerationType(action),
                ingestionTime: ingestionTime,
                generationTime: GenerationTime,
                tokensGenerated: generatedTokens,
            });
        } catch (e: any) {
            if (e.name === 'AbortError') {
                return;
            }
            if (e.name === 'PromptRejectedError') {
                const errorMessage = c('Error')
                    .t`The writing assistant cannot proceed with your request. Please try a different prompt.`;
                sendAssistantErrorReport({
                    assistantType: ASSISTANT_TYPE.SERVER,
                    errorType: ERROR_TYPE.GENERATION_HARMFUL,
                });
                addSpecificError({ assistantID, errorMessage, errorType: ERROR_TYPE.GENERATION_HARMFUL });
            } else if (e?.status === HTTP_ERROR_CODES.TOO_MANY_REQUESTS) {
                const errorMessage = c('Error').t`The system is busy at the moment. Please try again in a few minutes.`;
                sendAssistantErrorReport({
                    assistantType: ASSISTANT_TYPE.SERVER,
                    errorType: ERROR_TYPE.TOO_MANY_REQUESTS,
                });
                addSpecificError({ assistantID, errorMessage, errorType: ERROR_TYPE.TOO_MANY_REQUESTS });
            } else {
                const errorMessage = c('Error').t`Please try generating the text again`;
                sendAssistantErrorReport({
                    assistantType: ASSISTANT_TYPE.SERVER,
                    errorType: ERROR_TYPE.GENERATION_FAIL,
                });
                addSpecificError({ assistantID, errorMessage, errorType: ERROR_TYPE.GENERATION_FAIL });
            }
            traceInitiativeError('assistant', e);
            console.error(e);

            // Reset assistant result when an error occurred while generating
            // Otherwise, on next submit the previous result will be displayed for a few ms
            callback('');
        }

        // Reset the generating state
        cleanRunningActionPromises(assistantID);
    };

    // TODO, remove set values once we removed the "duplicated" context for server and local modes
    return {
        isModelDownloaded: true,
        isModelDownloading: false,
        downloadReceivedBytes: 0,
        downloadModelSize: 0,
        downloadPaused: false,
        isModelLoadedOnGPU: true,
        isModelLoadingOnGPU: false,
        canShowAssistant,
        hasCompatibleHardware,
        hasCompatibleBrowser,
        canUseAssistant,
        openedAssistants,
        errors,
        openAssistant,
        setAssistantStatus,
        closeAssistant: closeAssistant(cancelRunningAction),
        generateResult,
        cancelRunningAction,
        runningActionResolvers,
        resetAssistantState: noop,
    };
};
