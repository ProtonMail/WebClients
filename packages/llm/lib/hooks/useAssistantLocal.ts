import { useCallback, useEffect, useRef } from 'react';

import { c } from 'ttag';

import { useApi, useNotifications } from '@proton/components/hooks';
import useAssistantTelemetry from '@proton/components/hooks/assistant/useAssistantTelemetry';
import useStateRef from '@proton/hooks/useStateRef';
import type { AssistantContextType, AssistantRunningActions, GenerateAssistantResult } from '@proton/llm/lib';
import {
    CACHING_FAILED,
    FAILED_TO_DOWNLOAD,
    PromptRejectedError,
    UNLOAD_ASSISTANT_TIMEOUT,
    buildMLCConfig,
    getGenerationType,
    queryAssistantModels,
} from '@proton/llm/lib';
import { GpuLlmManager } from '@proton/llm/lib/actions';
import type useAssistantCommons from '@proton/llm/lib/hooks/useAssistantCommons';
import type useOpenedAssistants from '@proton/llm/lib/hooks/useOpenedAssistants';
import type {
    AssistantConfig,
    DownloadProgressInfo,
    GenerationCallbackDetails,
    LlmManager,
    LlmModel,
} from '@proton/llm/lib/types';
import { ASSISTANT_TYPE, ERROR_TYPE, GENERATION_SELECTION_TYPE } from '@proton/shared/lib/assistant';
import { domIsBusy } from '@proton/shared/lib/busy';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

interface Props {
    commonState: ReturnType<typeof useAssistantCommons>;
    openedAssistantsState: ReturnType<typeof useOpenedAssistants>;
    active: boolean;
}

export const useAssistantLocal = ({
    commonState,
    openedAssistantsState,
    active,
}: Props): Omit<
    AssistantContextType,
    | 'getIsStickyAssistant'
    | 'handleCheckHardwareCompatibility'
    | 'cleanSpecificErrors'
    | 'addSpecificError'
    | 'canKeepFormatting'
> => {
    const api = useApi();
    const { createNotification } = useNotifications();

    const llmManager = useRef<LlmManager | null>(null);
    const llmModel = useRef<LlmModel | null>(null);

    const assistantConfigRef = useRef<AssistantConfig>();
    /** In order to be able to wait for config to be set */
    const assistantConfigPromiseRef = useRef<Promise<void>>();

    const [
        {
            downloadModelSize,
            downloadPaused,
            downloadReceivedBytes,
            isCheckingCache,
            isModelDownloaded,
            isModelDownloading,
            isModelLoadedOnGPU,
            isModelLoadingOnGPU,
        },
        setLocalState,
        localStateRef,
    ] = useStateRef({
        isModelDownloaded: false,
        isModelDownloading: false,
        downloadReceivedBytes: 0,
        downloadModelSize: 0,
        downloadPaused: false,
        isModelLoadedOnGPU: false,
        isModelLoadingOnGPU: false,
        // ref to know if the user downloaded the model in this session
        userDownloadedModel: false,
        // Value used to know when we are checking for model files in cache
        isCheckingCache: false,
    });

    const generatedTokensNumber = useRef(0);
    const initPromise = useRef<Promise<void>>();

    const { openedAssistants, openAssistant, setAssistantStatus, closeAssistant } = openedAssistantsState;
    const {
        errors,
        addSpecificError,
        cleanSpecificErrors,
        addGlobalError,
        cleanGlobalErrors,
        hasCompatibleBrowser,
        hasCompatibleHardware,
        canShowAssistant,
        canUseAssistant,
        assistantSubscriptionStatus,
    } = commonState;

    const {
        sendRequestAssistantReport,
        sendUnloadModelAssistantReport,
        sendDownloadAssistantReport,
        sendLoadModelAssistantReport,
    } = useAssistantTelemetry();

    const {
        addRunningAction,
        runningActions,
        getRunningActionFromAssistantID,
        cleanRunningActions,
        resetResolvers,
        runningActionsRef,
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
    } = useRunningActions({ addSpecificError });

    useEffect(() => {
        if (active && !llmManager.current && canShowAssistant && hasCompatibleHardware && hasCompatibleBrowser) {
            llmManager.current = new GpuLlmManager();

            const handleGetAssistantModels = () => {
                assistantConfigPromiseRef.current = new Promise((resolve, reject) => {
                    void queryAssistantModels(api)
                        .then(async (models) => {
                            const config = buildMLCConfig(models);
                            if (config) {
                                assistantConfigRef.current = config;

                                if (llmManager.current) {
                                    // Check if user has all needed files in cache, so that we can set the state and avoid
                                    // going through the download phase when it's not needed during init
                                    setLocalState((localState) => ({
                                        ...localState,
                                        isCheckingCache: true,
                                    }));
                                    await llmManager.current.isDownloaded(config).then((isDownloaded) => {
                                        setLocalState((localState) => ({
                                            ...localState,
                                            isModelDownloading: false,
                                            isModelDownloaded: isDownloaded,
                                            isCheckingCache: false,
                                        }));
                                    });
                                }
                            }
                            // Resolve the config promise ref so that we can proceed with init if needed
                            resolve();
                        })
                        .catch(reject);
                });
            };

            // Get assistant models API side
            handleGetAssistantModels();
        }
    }, [active, canShowAssistant, hasCompatibleHardware, hasCompatibleBrowser]);

    const downloadCallback = (info: DownloadProgressInfo) => {
        setLocalState((localState) => ({
            ...localState,
            downloadModelSize: info.estimatedTotalBytes,
            downloadReceivedBytes: info.receivedBytes,
            userDownloadedModel: true,
        }));
    };

    const downloadModel = async () => {
        try {
            if (!llmManager.current || !assistantConfigRef.current) {
                return; // throw an error?
            }
            // Clean global errors when downloading the model
            cleanGlobalErrors();

            const startDownloadingTime = performance.now();
            setLocalState((localState) => ({
                ...localState,
                isModelDownloading: true,
            }));
            const completed = await llmManager.current.startDownload(downloadCallback, assistantConfigRef.current);
            setLocalState((localState) => ({
                ...localState,
                isModelDownloading: false,
                isModelDownloaded: completed,
            }));
            if (completed) {
                // fixme: this can report partial download time if we were resuming a previous download session
                const endDownloadingTime = performance.now();
                const downloadingTime = endDownloadingTime - startDownloadingTime;
                sendDownloadAssistantReport(downloadingTime);
                return true;
            }
            return false;
        } catch (e: any) {
            let errorMessage;
            if (e.message === CACHING_FAILED) {
                addGlobalError(ASSISTANT_TYPE.LOCAL, ERROR_TYPE.CACHING_FAILED);
            } else {
                const isRequestError = e.message.includes(FAILED_TO_DOWNLOAD);
                addGlobalError(
                    ASSISTANT_TYPE.LOCAL,
                    isRequestError ? ERROR_TYPE.DOWNLOAD_REQUEST_FAIL : ERROR_TYPE.DOWNLOAD_FAIL
                );
            }

            traceInitiativeError('assistant', e);
            console.error(e);
            setLocalState((localState) => ({
                ...localState,
                isModelDownloading: false,
            }));
            throw new Error(errorMessage);
        }
    };

    const loadModelOnGPU = async () => {
        try {
            if (!llmManager.current || !assistantConfigRef.current) {
                return; // throw an error?
            }
            const startLoadingTime = performance.now();
            // Clean global errors when loading the model
            cleanGlobalErrors();

            setLocalState((localState) => ({
                ...localState,
                isModelLoadingOnGPU: true,
            }));
            const model = await llmManager.current.loadOnGpu(assistantConfigRef.current);
            llmModel.current = model;
            setLocalState((localState) => ({
                ...localState,
                isModelLoadingOnGPU: false,
                isModelLoadedOnGPU: true,
            }));
            const endLoadingTime = performance.now();
            const loadingTime = endLoadingTime - startLoadingTime;

            sendLoadModelAssistantReport(loadingTime);
        } catch (e: any) {
            traceInitiativeError('assistant', e);
            console.error(e);
            const errorMessage = addGlobalError(ASSISTANT_TYPE.LOCAL, ERROR_TYPE.LOADGPU_FAIL);
            setLocalState((localState) => ({
                ...localState,
                isModelLoadingOnGPU: false,
                isModelLoadedOnGPU: false,
            }));
            throw new Error(errorMessage);
        }
    };

    const unloadModelOnGPU = async () => {
        try {
            if (llmModel.current) {
                await llmModel.current?.unload();
                setLocalState((localState) => ({
                    ...localState,
                    isModelLoadedOnGPU: false,
                }));

                sendUnloadModelAssistantReport();
            }
        } catch (e: any) {
            traceInitiativeError('assistant', e);
            console.error(e);
            addGlobalError(ASSISTANT_TYPE.LOCAL, ERROR_TYPE.UNLOAD_FAIL);
        }
    };

    const initAssistant = useCallback(() => {
        // Reset download pause state
        setLocalState((localState) => ({
            ...localState,
            downloadPaused: false,
        }));

        // If the assistant is already initializing, then we simply wait for the end of the initialization
        if (initPromise.current) {
            return initPromise.current;
        }

        initPromise.current = (async () => {
            /*
             * To init the assistant
             * 1 - We start by downloading the model if not downloaded yet and model is not downloading at the moment
             * 2 - Then we can load the model on the GPU if not loaded yet and not loading at the moment
             */

            // Use try catch in case one of the steps fails, so that we don't run the next step
            try {
                let completedDownload;

                // Ensure config is set before starting init
                if (assistantConfigPromiseRef.current) {
                    await assistantConfigPromiseRef.current;
                }

                const {
                    isModelDownloaded,
                    isModelDownloading,
                    isModelLoadedOnGPU,
                    isModelLoadingOnGPU,
                    userDownloadedModel,
                } = localStateRef.current;

                if (!isModelDownloaded && !isModelDownloading) {
                    completedDownload = await downloadModel();
                } else if (isModelDownloaded) {
                    completedDownload = true;
                }

                if (completedDownload && !isModelLoadedOnGPU && !isModelLoadingOnGPU) {
                    await loadModelOnGPU();
                }

                // Show a notification only when the user had to download the model
                if (completedDownload && userDownloadedModel) {
                    createNotification({
                        text: c('Notification').t`The writing assistant is ready to use`,
                    });

                    setLocalState((localState) => ({
                        ...localState,
                        userDownloadedModel: false,
                    }));
                }
            } catch {}
        })().finally(() => {
            // Reset init promise after init or when init failed so that we can
            // - Start init again if necessary
            // - Proceed if init completed
            initPromise.current = undefined;
        });
    }, []);

    const cancelDownloadModel = () => {
        if (llmManager.current) {
            llmManager.current.cancelDownload();
            initPromise.current = undefined;
            setLocalState((localState) => ({
                ...localState,
                downloadPaused: true,
            }));
        }
    };

    const resumeDownloadModel = () => {
        void initAssistant();
        setLocalState((localState) => ({
            ...localState,
            downloadPaused: false,
        }));
    };

    const generateResult = async ({ action, callback, assistantID, hasSelection }: GenerateAssistantResult) => {
        // TODO prevent submit if user made too much harmful requests recently

        // Do not start multiple actions in the same assistant
        const runningActionInAssistant = getRunningActionFromAssistantID(assistantID);
        if (runningActionInAssistant) {
            return;
        }

        // Reset generation errors in this assistant
        cleanSpecificErrors(assistantID);

        let isResolved = false;

        // The generation needs to be stopped in two different cases:
        // 1 - The assistant is ready (everything is loaded) and the user stops it.
        //      In that case, we can stop the running action.
        // 2 - The assistant is still loading, but the user submitted a request and cancelled it.
        //      In that case, we don't have the running action yet, so we need to cancel the promise.
        //      That's why the entire function is run into a Promise. We can then store it in a ref and cancel it when needed.
        await new Promise<void>(async (res) => {
            const resolve = () => {
                res();
                isResolved = true;
            };
            addRunningAction(assistantID, resolve);

            const ingestionStart = performance.now();
            try {
                // Start the initialization in case the assistant is not loaded yet.
                // If it is loaded already, then nothing will be done,
                // else we will wait for the init process to be finished before starting the generation
                await initAssistant();
            } catch {
                // If an error occurred during the init, we set an error.
                // In that case, we can stop the generation before going further.
                return;
            }

            const ingestionEnd = performance.now();
            const ingestionTime = ingestionEnd - ingestionStart;

            try {
                // If the promise is resolved, we cancelled it after a user interaction.
                // We don't want to generate a result anymore.
                if (llmModel.current && !isResolved) {
                    let promptRejectedOnce = false;
                    const generationCallback = (fulltext: string, details?: GenerationCallbackDetails) => {
                        if (promptRejectedOnce) {
                            return;
                        }
                        generatedTokensNumber.current++;
                        const isHarmful = details?.harmful;

                        // Used to prevent adding additional tokens that we receive after cancelling a running action
                        const isRunningAction = assistantID in runningActionsRef.current;

                        if (!isHarmful) {
                            if (isRunningAction) {
                                callback(fulltext);
                            }
                        } else {
                            promptRejectedOnce = true;
                            cleanRunningActions(assistantID);
                        }
                    };

                    const generationStart = performance.now();

                    if (assistantSubscriptionStatus.trialStatus === 'trial-not-started') {
                        await assistantSubscriptionStatus.start();
                    }

                    const runningAction = await llmModel.current.performAction(action, generationCallback);

                    addRunningAction(assistantID, () => {
                        // Resolve is needed to end parent promise
                        resolve();
                        // Here we stop the LLM generation
                        runningAction.cancel();
                    });

                    await runningAction.waitForCompletion();

                    // Throw an error if the user made a harmful request
                    if (promptRejectedOnce) {
                        throw new PromptRejectedError();
                    }

                    // Send telemetry report
                    const generationEnd = performance.now();
                    const generationTime = generationEnd - generationStart;
                    sendRequestAssistantReport({
                        assistantType: ASSISTANT_TYPE.LOCAL,
                        generationType: getGenerationType(action),
                        selectionType: hasSelection
                            ? GENERATION_SELECTION_TYPE.HAS_SELECTION
                            : GENERATION_SELECTION_TYPE.NO_SELECTION,
                        ingestionTime,
                        generationTime,
                        tokensGenerated: generatedTokensNumber.current,
                    });
                    generatedTokensNumber.current = 0;
                }
            } catch (e: any) {
                if (e.name === 'PromptRejectedError') {
                    addSpecificError({
                        assistantID,
                        assistantType: ASSISTANT_TYPE.LOCAL,
                        errorType: ERROR_TYPE.GENERATION_HARMFUL,
                    });
                } else {
                    addSpecificError({
                        assistantID,
                        assistantType: ASSISTANT_TYPE.LOCAL,
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
            cleanRunningActions(assistantID);
        });
    };

    const resetAssistantState = () => {
        // Cancel model downloading
        if (initPromise.current) {
            void cancelDownloadModel();
        }
        // Unload model from GPU
        if (isModelLoadedOnGPU) {
            void unloadModelOnGPU();
        }
        // Cancel all running actions
        if (Object.keys(runningActions).length) {
            resetResolvers();
        }

        // Reset all states
        setLocalState((localState) => ({
            ...localState,
            isModelDownloaded: false,
            isModelDownloading: false,
            isModelLoadedOnGPU: false,
            isModelLoadingOnGPU: false,
            downloadPaused: false,
            downloadModelSize: 0,
            downloadReceivedBytes: 0,
        }));
    };

    // Unload the model after some time of non usage
    // If model is loaded on the GPU, check every X minutes if user is busy
    // Reset the timeout completely when user is generating a new result
    useEffect(() => {
        if (!isModelLoadedOnGPU) {
            return;
        }

        const id = setInterval(() => {
            if (domIsBusy()) {
                return;
            }
            if (isElectronApp && document.hasFocus()) {
                return;
            }

            void unloadModelOnGPU();
        }, UNLOAD_ASSISTANT_TIMEOUT);

        return () => {
            clearInterval(id);
        };
    }, [isModelLoadedOnGPU, runningActions]);

    return {
        assistantConfig: assistantConfigRef.current,
        cancelDownloadModel,
        cancelRunningAction: cleanRunningActions,
        canShowAssistant,
        canUseAssistant,
        closeAssistant: closeAssistant(cleanRunningActions),
        downloadModelSize,
        downloadPaused,
        downloadReceivedBytes,
        errors,
        generateResult,
        hasCompatibleBrowser,
        hasCompatibleHardware,
        initAssistant,
        isCheckingCache,
        isModelDownloaded,
        isModelDownloading,
        isModelLoadedOnGPU,
        isModelLoadingOnGPU,
        openAssistant,
        openedAssistants,
        resetAssistantState,
        resumeDownloadModel,
        runningActions,
        setAssistantStatus,
        unloadModelOnGPU,
    };
};

interface UseRunningActionsProps {
    addSpecificError: ReturnType<typeof useAssistantCommons>['addSpecificError'];
}

function useRunningActions({ addSpecificError }: UseRunningActionsProps) {
    const [runningActions, setRunningAction, runningActionsRef] = useStateRef<AssistantRunningActions>({});

    const addRunningAction = (assistantID: string, resolver: () => void) => {
        setRunningAction((runningActions) => ({
            ...runningActions,
            [assistantID]: resolver,
        }));
    };

    const cleanRunningActions = (assistantID: string) => {
        try {
            const runningAction = runningActionsRef.current[assistantID];
            if (runningAction) {
                runningAction();
                setRunningAction((runningAction) => {
                    delete runningAction[assistantID];
                    return { ...runningAction };
                });
            }
        } catch (e: any) {
            traceInitiativeError('assistant', e);
            addSpecificError({
                assistantID,
                assistantType: ASSISTANT_TYPE.LOCAL,
                errorType: ERROR_TYPE.GENERATION_CANCEL_FAIL,
            });
        }
    };

    return {
        addRunningAction,
        cleanRunningActions,
        getRunningActionFromAssistantID: (assistantID: string) => assistantID in runningActions,
        resetResolvers: () => setRunningAction({}),
        runningActions,
        runningActionsRef,
    };
}
