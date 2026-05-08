import { useApi } from '@proton/components';
import useAssistantTelemetry from '@proton/components/hooks/assistant/useAssistantTelemetry';
import useStateRef from '@proton/hooks/useStateRef';
import type { AssistantHooksProps, AssistantRunningActions, GenerateAssistantResult } from '@proton/llm/lib';
import { ASSISTANT_SERVER_THROTTLE_TIMEOUT, PromptRejectedError, getGenerationType } from '@proton/llm/lib';
import { prepareServerAssistantInteraction } from '@proton/llm/lib/actions';
import type useAssistantCommons from '@proton/llm/lib/hooks/useAssistantCommons';
import { LumoApiClient, Role } from '@proton/lumo-api-client';
import type { Turn } from '@proton/lumo-api-client/core/types';
import { ASSISTANT_TYPE, ERROR_TYPE, GENERATION_SELECTION_TYPE } from '@proton/shared/lib/assistant';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';
import throttle from 'lodash/throttle';

interface Props {
    commonState: ReturnType<typeof useAssistantCommons>;
}

/**
 * The rawLlmPrompt produced by `prepareServerAssistantInteraction` is a completion-style
 * string with `<|system|>`, `<|user|>` and `<|assistant|>` role markers. The Lumo chat API
 * expects structured turns instead. Parsing the markers back into `Turn[]` ensures the model
 * receives the instructions as a proper conversation, which is required for it to follow the
 * expected output format (including markdown formatting such as lists and bold text).
 */
const ROLE_TO_LUMO_ROLE: Record<string, Role> = {
    system: Role.System,
    user: Role.User,
    assistant: Role.Assistant,
};

const PROMPT_ROLE_REGEX = /<\|(system|user|assistant)\|>\n?/g;

/** Reused across server assistant generations; config is fixed for this integration. */
const assistantServerLumoClient = new LumoApiClient({
    enableSmoothing: true,
    enableU2LEncryption: true,
});

const parsePromptToTurns = (prompt: string): Turn[] => {
    const boundaries: { role: Role; markerStart: number; contentStart: number }[] = [];

    for (const match of prompt.matchAll(PROMPT_ROLE_REGEX)) {
        const role = ROLE_TO_LUMO_ROLE[match[1]];
        if (role && match.index !== undefined) {
            boundaries.push({
                role,
                markerStart: match.index,
                contentStart: match.index + match[0].length,
            });
        }
    }

    if (boundaries.length === 0) {
        return [{ role: Role.User, content: prompt }];
    }

    return boundaries.map(({ role, contentStart }, i) => {
        const contentEnd = i + 1 < boundaries.length ? boundaries[i + 1].markerStart : prompt.length;
        return { role, content: prompt.slice(contentStart, contentEnd).replace(/\n+$/, '') };
    });
};

export const useAssistantServer = ({ commonState }: Props): AssistantHooksProps => {
    const api = useApi();
    const { sendRequestAssistantReport, sendAssistantErrorReport } = useAssistantTelemetry();
    const [runningActions, setRunningActions, runningActionsRef] = useStateRef<AssistantRunningActions>({});

    const { addSpecificError, assistantSubscriptionStatus, cleanSpecificErrors, closeAssistant } = commonState;

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
            const { rawLlmPrompt: prompt, transformCallback: transform } = prepareServerAssistantInteraction(action);

            // Set the running actions directly with a fake resolver so that the UI gets updated directly
            // Then, when we'll have access to the resolver we will set the running actions again
            setRunningActions((runningActions) => {
                runningActions[assistantID] = noop;
                return { ...runningActions };
            });

            const controller = new AbortController();
            const resolver = () => controller.abort();

            // If the running action has already been cancelled (the user clicked on generate and cancel instantly),
            // the generation will stop and start again. We set the resolver as noop above so that the UI reflects
            // the start of the generation; if the cleanup has already happened, abort here before sending anything.
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

            let fullServerContent = '';
            let generatedTokens = 0;
            // Make the change in the UI less often so that we don't blast the component with too many re-renders
            const throttledCallback = throttle((callback) => callback(), ASSISTANT_SERVER_THROTTLE_TIMEOUT);

            const generationStart = performance.now();

            await assistantServerLumoClient.callAssistant(api, parsePromptToTurns(prompt), {
                signal: controller.signal,
                enableReasoning: false,
                chunkCallback: async (msg) => {
                    if (msg.type === 'token_data' && msg.target === 'message') {
                        fullServerContent += msg.content;
                        generatedTokens++;

                        const transformed = transform(fullServerContent);
                        if (transformed === undefined) {
                            throw new PromptRejectedError();
                        }

                        if (assistantID in runningActionsRef.current) {
                            throttledCallback(() => callback(transformed));
                        }
                    }
                },
                finishCallback: async (status) => {
                    if (status === 'failed') {
                        return;
                    }
                    // Call callback one last time to ensure we have the full content
                    const transformed = transform(fullServerContent);
                    if (transformed !== undefined) {
                        callback(transformed);
                    }
                },
            });

            sendRequestAssistantReport({
                assistantType: ASSISTANT_TYPE.SERVER,
                generationType: getGenerationType(action),
                selectionType: hasSelection
                    ? GENERATION_SELECTION_TYPE.HAS_SELECTION
                    : GENERATION_SELECTION_TYPE.NO_SELECTION,
                ingestionTime: generationStart - ingestionStart,
                generationTime: performance.now() - generationStart,
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

    return {
        // Fake values that we need for the local mode
        downloadModelSize: 0,
        downloadPaused: false,
        downloadReceivedBytes: 0,
        isCheckingCache: false,
        isModelDownloaded: true,
        isModelDownloading: false,
        isModelLoadedOnGPU: true,
        isModelLoadingOnGPU: false,

        // Generate related
        generateResult,
        runningActions,
        cancelRunningAction,

        closeAssistant: closeAssistant(cancelRunningAction),

        resetAssistantState: noop,
    };
};
