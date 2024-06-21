import { useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useApi, useNotifications } from '@proton/components/hooks';
import {
    AssistantRunningAction,
    AssistantRunningActionResolver,
    AssistantStatus,
    GenerateAssistantResult,
    PromptRejectedError,
    UNLOAD_ASSISTANT_TIMEOUT,
    buildMLCConfig,
    getAssistantStatus,
    getGenerationType,
    queryAssistantModels,
} from '@proton/llm/lib';
import { GpuLlmManager } from '@proton/llm/lib/actions';
import type useAssistantCommons from '@proton/llm/lib/hooks/useAssistantCommons';
import type useOpenedAssistants from '@proton/llm/lib/hooks/useOpenedAssistants';
import {
    AssistantConfig,
    DownloadProgressInfo,
    GenerationCallbackDetails,
    LlmManager,
    LlmModel,
} from '@proton/llm/lib/types';
import useAssistantTelemetry, { ASSISTANT_TYPE, ERROR_TYPE } from '@proton/llm/lib/useAssistantTelemetry';
import { domIsBusy } from '@proton/shared/lib/busy';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

interface Props {
    commonState: ReturnType<typeof useAssistantCommons>;
    openedAssistantsState: ReturnType<typeof useOpenedAssistants>;
    active: boolean;
}

export const useAssistantLocal = ({ commonState, openedAssistantsState, active }: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();

    const llmManager = useRef<LlmManager | null>(null);
    const llmModel = useRef<LlmModel | null>(null);

    const assistantConfigRef = useRef<AssistantConfig>();
    /** In order to be able to wait for config to be set */
    const assistantConfigPromiseRef = useRef<Promise<void>>();

    const [isModelDownloaded, setIsModelDownloaded] = useState(false);
    const [isModelDownloading, setIsModelDownloading] = useState(false);
    const [downloadReceivedBytes, setDownloadReceivedBytes] = useState(0);
    const [downloadModelSize, setDownloadModelSize] = useState(0);
    const [downloadPaused, setDownloadPaused] = useState(false);
    // ref to know if the user downloaded the model in this session
    const userDownloadedModel = useRef(false);

    const [isModelLoadedOnGPU, setIsModelLoadedOnGPU] = useState(false);
    const [isModelLoadingOnGPU, setIsModelLoadingOnGPU] = useState(false);

    const generatedTokensNumber = useRef(0);
    const initPromise = useRef<Promise<void>>();

    const runningActionsRef = useRef<AssistantRunningAction[]>([]);
    const [runningActionResolvers, setRunningActionResolvers] = useState<AssistantRunningActionResolver[]>([]);

    const assistantStatus = useRef<AssistantStatus>(AssistantStatus.NOT_LOADED);

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

    useEffect(() => {
        assistantStatus.current = getAssistantStatus({
            isModelDownloading,
            isModelDownloaded,
            isModelLoadingOnGPU,
            isModelLoadedOnGPU,
        });
    }, [isModelDownloading, isModelDownloaded, isModelLoadingOnGPU, isModelLoadedOnGPU]);

    const {
        sendRequestAssistantReport,
        sendUnloadModelAssistantReport,
        sendDownloadAssistantReport,
        sendAssistantErrorReport,
        sendLoadModelAssistantReport,
    } = useAssistantTelemetry();

    const cleanRunningActionPromises = (assistantID: string) => {
        setRunningActionResolvers((runningActionResolvers) =>
            runningActionResolvers.filter((resolver) => {
                if (resolver.assistantID === assistantID) {
                    resolver.resolver();
                }
                return resolver.assistantID !== assistantID;
            })
        );
    };

    const getRunningActionFromAssistantID = (assistantID: string) => {
        return runningActionsRef.current.find((runningAction) => runningAction.assistantID === assistantID);
    };

    const cleanAssistantRunningAction = (assistantID: string) => {
        runningActionsRef.current = runningActionsRef.current.filter(
            (runningAction) => runningAction.assistantID !== assistantID
        );
    };

    const cancelAssistantRunningAction = (assistantID: string) => {
        const assistantRunningAction = getRunningActionFromAssistantID(assistantID);
        if (assistantRunningAction) {
            assistantRunningAction.runningAction.cancel();
            cleanAssistantRunningAction(assistantID);
        }
    };

    const cancelRunningAction = (assistantID: string) => {
        try {
            cleanRunningActionPromises(assistantID);
            cancelAssistantRunningAction(assistantID);
        } catch (e: any) {
            traceInitiativeError('assistant', e);
            const errorMessage = c('Error').t`Due to an error, text generation couldn’t be canceled`;
            addSpecificError({ assistantID, errorMessage, errorType: ERROR_TYPE.GENERATION_CANCEL_FAIL });
            sendAssistantErrorReport({
                assistantType: ASSISTANT_TYPE.LOCAL,
                errorType: ERROR_TYPE.GENERATION_CANCEL_FAIL,
            });
        }
    };

    const handleGetAssistantModels = () => {
        assistantConfigPromiseRef.current = new Promise((resolve, reject) => {
            void queryAssistantModels(api)
                .then((models) => {
                    const config = buildMLCConfig(models);
                    if (config) {
                        assistantConfigRef.current = config;
                    }
                    resolve();
                })
                .catch(reject);
        });
    };

    useEffect(() => {
        if (active && !llmManager.current && canShowAssistant && hasCompatibleHardware && hasCompatibleBrowser) {
            llmManager.current = new GpuLlmManager();

            // Get assistant models API side
            handleGetAssistantModels();
        }
    }, [active, canShowAssistant, hasCompatibleHardware, hasCompatibleBrowser]);

    const downloadCallback = (info: DownloadProgressInfo) => {
        userDownloadedModel.current = true;
        setDownloadModelSize(info.estimatedTotalBytes);
        setDownloadReceivedBytes(info.receivedBytes);
    };

    const downloadModel = async () => {
        try {
            if (!llmManager.current || !assistantConfigRef.current) {
                return; // throw an error?
            }
            // Clean global errors when downloading the model
            cleanGlobalErrors();

            const startDownloadingTime = performance.now();
            setIsModelDownloading(true);
            const completed = await llmManager.current.startDownload(downloadCallback, assistantConfigRef.current);
            setIsModelDownloading(false);
            setIsModelDownloaded(completed);
            if (completed) {
                // fixme: this can report partial download time if we were resuming a previous download session
                const endDownloadingTime = performance.now();
                const downloadingTime = endDownloadingTime - startDownloadingTime;
                sendDownloadAssistantReport(downloadingTime);
                return true;
            }
            return false;
        } catch (e: any) {
            traceInitiativeError('assistant', e);
            console.error(e);
            const errorMessage = c('Error').t`Problem downloading the writing assistant. Please try again.`;
            addGlobalError(errorMessage, ERROR_TYPE.DOWNLOAD_FAIL);
            setIsModelDownloading(false);
            sendAssistantErrorReport({
                assistantType: ASSISTANT_TYPE.LOCAL,
                errorType: ERROR_TYPE.DOWNLOAD_FAIL,
            });
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

            setIsModelLoadingOnGPU(true);
            const model = await llmManager.current.loadOnGpu(assistantConfigRef.current);
            llmModel.current = model;
            setIsModelLoadingOnGPU(false);
            setIsModelLoadedOnGPU(true);
            const endLoadingTime = performance.now();
            const loadingTime = endLoadingTime - startLoadingTime;

            sendLoadModelAssistantReport(loadingTime);
        } catch (e: any) {
            traceInitiativeError('assistant', e);
            console.error(e);
            const errorMessage = c('Error').t`Problem loading the writing assistant to your device. Please try again.`;
            addGlobalError(errorMessage, ERROR_TYPE.LOADGPU_FAIL);
            setIsModelLoadingOnGPU(false);
            setIsModelLoadedOnGPU(false);
            sendAssistantErrorReport({
                assistantType: ASSISTANT_TYPE.LOCAL,
                errorType: ERROR_TYPE.LOADGPU_FAIL,
            });
            throw new Error(errorMessage);
        }
    };

    const unloadModelOnGPU = async () => {
        try {
            if (llmModel.current) {
                await llmModel.current?.unload();
                setIsModelLoadedOnGPU(false);

                sendUnloadModelAssistantReport();
            }
        } catch (e: any) {
            traceInitiativeError('assistant', e);
            console.error(e);
            const errorMessage = c('Error').t`Problem unloading data not needed when the writing assistant is inactive`;
            sendAssistantErrorReport({
                assistantType: ASSISTANT_TYPE.LOCAL,
                errorType: ERROR_TYPE.UNLOAD_FAIL,
            });
            addGlobalError(errorMessage, ERROR_TYPE.UNLOAD_FAIL);
        }
    };

    const initAssistant = useCallback(() => {
        // Reset download pause state
        setDownloadPaused(false);

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
            const isModelDownloaded = assistantStatus.current >= AssistantStatus.DOWNLOADED;
            const isModelDownloading = assistantStatus.current === AssistantStatus.DOWNLOADING;
            const isModelLoadedOnGPU = assistantStatus.current >= AssistantStatus.READY;
            const isModelLoadingOnGPU = assistantStatus.current === AssistantStatus.LOADING_GPU;
            // Use try catch in case one of the steps fails, so that we don't run the next step
            try {
                let completedDownload;

                // Ensure config is set before starting init
                if (assistantConfigPromiseRef.current) {
                    await assistantConfigPromiseRef.current;
                }

                if (!isModelDownloaded && !isModelDownloading) {
                    completedDownload = await downloadModel();
                }
                if (completedDownload && !isModelLoadedOnGPU && !isModelLoadingOnGPU) {
                    await loadModelOnGPU();
                }

                // Show a notification only when the user had to download the model
                if (completedDownload && userDownloadedModel.current) {
                    createNotification({
                        text: c('Notification').t`The writing assistant is ready to use`,
                    });
                    userDownloadedModel.current = false;
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
            setDownloadPaused(true);
        }
    };

    const resumeDownloadModel = () => {
        void initAssistant();
        setDownloadPaused(false);
    };

    const generateResult = async ({ action, callback, assistantID }: GenerateAssistantResult) => {
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
            const resolver = () => {
                res();
                isResolved = true;
            };
            setRunningActionResolvers([...runningActionResolvers, { resolver, assistantID }]);

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

                        if (!isHarmful) {
                            callback(fulltext);
                        } else {
                            promptRejectedOnce = true;
                            runningActionsRef.current
                                ?.find((a) => a.assistantID === assistantID)
                                ?.runningAction?.cancel();
                        }
                    };

                    const generationStart = performance.now();

                    if (assistantSubscriptionStatus.trialStatus === 'trial-not-started') {
                        await assistantSubscriptionStatus.start();
                    }

                    const runningAction = await llmModel.current.performAction(action, generationCallback);
                    runningActionsRef.current.push({ runningAction, assistantID });
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
                        ingestionTime,
                        generationTime,
                        tokensGenerated: generatedTokensNumber.current,
                    });
                    generatedTokensNumber.current = 0;
                }
            } catch (e: any) {
                if (e.name === 'PromptRejectedError') {
                    const errorMessage = c('Error')
                        .t`The writing assistant cannot proceed with your request. Please try a different prompt.`;
                    sendAssistantErrorReport({
                        assistantType: ASSISTANT_TYPE.LOCAL,
                        errorType: ERROR_TYPE.GENERATION_HARMFUL,
                    });
                    addSpecificError({ assistantID, errorMessage, errorType: ERROR_TYPE.GENERATION_HARMFUL });
                } else {
                    const errorMessage = c('Error').t`Please try generating the text again`;
                    sendAssistantErrorReport({
                        assistantType: ASSISTANT_TYPE.LOCAL,
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
            cleanAssistantRunningAction(assistantID);
            cleanRunningActionPromises(assistantID);
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
        if (runningActionResolvers) {
            runningActionsRef.current = [];
            runningActionResolvers.forEach((resolver) => resolver.resolver());
        }

        // Reset all states
        setIsModelDownloaded(false);
        setIsModelDownloading(false);
        setIsModelLoadedOnGPU(false);
        setIsModelLoadingOnGPU(false);
        setDownloadPaused(false);
        setDownloadModelSize(0);
        setDownloadReceivedBytes(0);
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
    }, [isModelLoadedOnGPU, runningActionResolvers]);

    return {
        isModelDownloaded,
        isModelDownloading,
        downloadReceivedBytes,
        downloadModelSize,
        downloadPaused,
        isModelLoadedOnGPU,
        isModelLoadingOnGPU,
        canShowAssistant,
        hasCompatibleHardware,
        hasCompatibleBrowser,
        canUseAssistant,
        openedAssistants,
        errors,
        openAssistant,
        setAssistantStatus,
        closeAssistant: closeAssistant(cancelRunningAction),
        cancelDownloadModel,
        resumeDownloadModel,
        unloadModelOnGPU,
        initAssistant,
        generateResult,
        cancelRunningAction,
        runningActionResolvers,
        assistantConfig: assistantConfigRef.current,
        resetAssistantState,
    };
};
