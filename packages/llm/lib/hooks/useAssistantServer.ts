import { useApi } from '@proton/components/hooks';
import useAssistantTelemetry from '@proton/components/hooks/assistant/useAssistantTelemetry';
import { utf8ArrayToString } from '@proton/crypto/lib/utils';
import useStateRef from '@proton/hooks/useStateRef';
import type { AssistantContextType, AssistantRunningActions, GenerateAssistantResult } from '@proton/llm/lib';
import {
    ASSISTANT_SERVER_THROTTLE_TIMEOUT,
    PromptRejectedError,
    getGenerationType,
    sendAssistantRequest,
} from '@proton/llm/lib';
import { prepareServerAssistantInteraction } from '@proton/llm/lib/actions';
import type useAssistantCommons from '@proton/llm/lib/hooks/useAssistantCommons';
import type useOpenedAssistants from '@proton/llm/lib/hooks/useOpenedAssistants';
import { ASSISTANT_TYPE, ERROR_TYPE, GENERATION_SELECTION_TYPE } from '@proton/shared/lib/assistant';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';
import throttle from '@proton/utils/throttle';

interface Props {
    commonState: ReturnType<typeof useAssistantCommons>;
    openedAssistantsState: ReturnType<typeof useOpenedAssistants>;
}

export const useAssistantServer = ({
    commonState,
    openedAssistantsState,
}: Props): Omit<
    AssistantContextType,
    'getIsStickyAssistant' | 'handleCheckHardwareCompatibility' | 'cleanSpecificErrors' | 'addSpecificError'
> => {
    const api = useApi();
    const { sendRequestAssistantReport, sendAssistantErrorReport } = useAssistantTelemetry();
    const [runningActions, setRunningActions, runningActionsRef] = useStateRef<AssistantRunningActions>({});

    const { openAssistant, setAssistantStatus, closeAssistant, openedAssistants } = openedAssistantsState;
    const {
        addSpecificError,
        assistantSubscriptionStatus,
        canShowAssistant,
        canUseAssistant,
        cleanSpecificErrors,
        errors,
        hasCompatibleBrowser,
        hasCompatibleHardware,
    } = commonState;

    const cleanRunningActionPromises = (assistantID: string) => {
        setRunningActions((runningActions) => {
            delete runningActions[assistantID];
            return { ...runningActions };
        });
    };

    const cancelRunningAction = (assistantID: string) => {
        try {
            const actionResolver = runningActions[assistantID];
            if (actionResolver) {
                actionResolver();
            }
            cleanRunningActionPromises(assistantID);
        } catch (e: any) {
            sendAssistantErrorReport({
                assistantType: ASSISTANT_TYPE.SERVER,
                errorType: ERROR_TYPE.GENERATION_CANCEL_FAIL,
            });
        }
    };

    const generateResult = async ({ action, callback, assistantID, hasSelection }: GenerateAssistantResult) => {
        if (assistantID in runningActions) {
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
            setRunningActions((runningActions) => {
                runningActions[assistantID] = noop;
                return { ...runningActions };
            });

            const response = await api({
                ...sendAssistantRequest({ prompt, stopStrings }),
                output: 'stream',
                silence: true,
            });
            const reader = response.getReader();

            const resolver = () => {
                reader.cancel();
            };

            // If the running action has already been cancelled (the user clicked on generate and cancel instantly),
            // the generation will stop and start again.
            // We are setting the resolver as noop above so that we can see in the UI that we are starting the generation,
            // before the api request is actually sent, but this will cause the issue.
            // So if we already cleaned the generation at this point, make sure we are stopping it.
            if (runningActionsRef.current[assistantID] === undefined) {
                resolver();
                return;
            }

            setRunningActions((runningActions) => {
                runningActions[assistantID] = resolver;
                return { ...runningActions };
            });

            if (assistantSubscriptionStatus.trialStatus === 'trial-not-started') {
                await assistantSubscriptionStatus.start();
            }

            // Each chunk contains a part of the generated text, but we have to give the full text to update the content in the UI
            let fullServerContent = '';
            let generatedTokens = 0;

            // Make the change in the UI less often so that we don't blast the component with too many re-renders
            const throttledCallback = throttle((callback) => callback(), ASSISTANT_SERVER_THROTTLE_TIMEOUT);

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

                const isRunningAction = assistantID in runningActionsRef.current;
                if (isRunningAction) {
                    throttledCallback(() => callback(transformed));
                }

                return reader.read().then(process);
            });
            const GenerationEnd = performance.now();
            const GenerationTime = GenerationEnd - GenerationStart;
            sendRequestAssistantReport({
                assistantType: ASSISTANT_TYPE.SERVER,
                generationType: getGenerationType(action),
                selectionType: hasSelection
                    ? GENERATION_SELECTION_TYPE.HAS_SELECTION
                    : GENERATION_SELECTION_TYPE.NO_SELECTION,
                ingestionTime: ingestionTime,
                generationTime: GenerationTime,
                tokensGenerated: generatedTokens,
            });
        } catch (e: any) {
            if (e.name === 'AbortError') {
                return;
            }
            if (e.name === 'PromptRejectedError') {
                addSpecificError({
                    assistantID,
                    assistantType: ASSISTANT_TYPE.SERVER,
                    errorType: ERROR_TYPE.GENERATION_HARMFUL,
                });
            } else if (e?.status === HTTP_ERROR_CODES.TOO_MANY_REQUESTS) {
                addSpecificError({
                    assistantID,
                    assistantType: ASSISTANT_TYPE.SERVER,
                    errorType: ERROR_TYPE.TOO_MANY_REQUESTS,
                });
            } else {
                addSpecificError({
                    assistantID,
                    assistantType: ASSISTANT_TYPE.SERVER,
                    errorType: ERROR_TYPE.GENERATION_FAIL,
                });
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
        downloadModelSize: 0,
        downloadPaused: false,
        downloadReceivedBytes: 0,
        isCheckingCache: false,
        isModelDownloaded: true,
        isModelDownloading: false,
        isModelLoadedOnGPU: true,
        isModelLoadingOnGPU: false,
        cancelRunningAction,
        canShowAssistant,
        canUseAssistant,
        closeAssistant: closeAssistant(cancelRunningAction),
        errors,
        generateResult,
        hasCompatibleBrowser,
        hasCompatibleHardware,
        openAssistant,
        openedAssistants,
        resetAssistantState: noop,
        runningActions,
        setAssistantStatus,
    };
};
