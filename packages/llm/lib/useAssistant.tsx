import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { FeatureFlag, useFlag } from '@proton/components/containers';
import { useApi, useNotifications, useUser } from '@proton/components/hooks';
import useAssistantTelemetry from '@proton/llm/lib/useAssistantTelemetry';
import { domIsBusy } from '@proton/shared/lib/busy';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import { ASSISTANT_FEATURE_NAME, ASSISTANT_STATUS, UNLOAD_ASSISTANT_TIMEOUT } from './constants';
import { GpuLlmManager } from './gpu';
import {
    buildMLCConfig,
    getAssistantHasCompatibleBrowser,
    getAssistantHasCompatibleHardware,
    getAssistantStatus,
    getCanShowAssistant,
    getCanUseAssistant,
    queryAssistantModels,
} from './helpers';
import {
    AssistantConfig,
    DownloadProgressInfo,
    GenerationCallback,
    LlmManager,
    LlmModel,
    RunningAction,
} from './types';

export interface GenerateAssistantResult {
    assistantID: string;
    inputText: string;
    callback: GenerationCallback;
}

export interface AssistantRunningActionResolver {
    assistantID: string;
    resolver: () => void;
}

export interface AssistantRunningAction {
    assistantID: string;
    runningAction: RunningAction;
}

export enum AssistantErrorTypes {
    globalError,
    specificError,
}

export interface AssistantGlobalError {
    type: AssistantErrorTypes.globalError;
}

export interface AssistantSpecificError {
    type: AssistantErrorTypes.specificError;
    assistantID: string;
}

export type AssistantError = (AssistantGlobalError | AssistantSpecificError) & {
    error: string;
};

/**
 * Warning: this is a POC, so several parts of this code have been implemented using "shortcuts"
 * The first phase is to go in alpha, but the code will need to be improved before the beta.
 *
 * The generation is limited to one composer, so we assume only one generation will happen at the time.
 * Later, we will need to introduce a queue, identify the generation with the component that started it,
 * improve error state, etc...
 *
 * We also need a proper FF mechanism. It would be possible to have two features using the assistant on the same app.
 * In that case, we will have to start initializing the model, but depending on where the assistant is used, the hasAccessToAssistant
 * might be false.
 */
export const AssistantContext = createContext<{
    /**
     * All assistant instances opened in the context
     */
    openedAssistants: string[];
    /**
     * Add assistant instance to the context
     */
    openAssistant: (assistantID: string) => void;
    /**
     * Remove assistant instance from the context
     */
    closeAssistant: (assistantID: string) => void;
    /**
     * Can the user see the assistant in the UI (based on feature flag)
     */
    canShowAssistant: boolean;
    /**
     * Can the user run the assistant on his machine
     */
    hasCompatibleHardware: boolean;
    /**
     * Can the user run the assistant in the browser
     */
    hasCompatibleBrowser: boolean;
    /**
     * Can the user run the assistant (based on the plan and trial state)
     */
    canUseAssistant: boolean;
    /**
     * Has the user downloaded the model
     */
    isModelDownloaded: boolean;
    /**
     * Is the model being downloaded
     */
    isModelDownloading: boolean;
    /**
     * The model download progress in bytes, when downloading it
     */
    downloadReceivedBytes: number;
    /**
     * The full model size, when downloading it
     */
    downloadModelSize: number;
    /**
     * Is the model downloading paused
     */
    downloadPaused: boolean;
    /**
     * Is the model being loaded on the GPU at the moment
     */
    isModelLoadedOnGPU: boolean;
    /**
     * Is the model being loaded on the GPU
     */
    isModelLoadingOnGPU: boolean;
    /**
     * Potential error that occurred while using the assistant
     */
    errors: AssistantError[];
    /**
     * Manually cancel the model download
     */
    cancelDownloadModel: () => void;
    /**
     * Manually resume the model download
     */
    resumeDownloadModel: () => void;
    /**
     * Manually unload the model from the GPU
     */
    unloadModelOnGPU: () => Promise<void>;
    /**
     * Initialise the assistant:
     *  - Starts by downloading the model (if necessary)
     *  - Then loads it on the GPU (if necessary)
     */
    initAssistant: () => void;
    /**
     * Generate a result from a prompt
     */
    generateResult: (generateAssistantResult: GenerateAssistantResult) => Promise<void>;
    /**
     * Cancel the current running action (result generation)
     */
    cancelRunningAction: (assistantID: string) => void;
    /**
     * All running actions in the assistant
     */
    runningActionResolvers: AssistantRunningActionResolver[];
} | null>(null);

export const useAssistant = (assistantID?: string) => {
    const assistantContext = useContext(AssistantContext);

    if (!assistantContext) {
        throw new Error('Assistant provider not initialized');
    }

    const {
        canShowAssistant,
        hasCompatibleHardware,
        hasCompatibleBrowser,
        canUseAssistant,
        isModelDownloaded,
        isModelDownloading,
        downloadReceivedBytes,
        downloadModelSize,
        downloadPaused,
        isModelLoadedOnGPU,
        isModelLoadingOnGPU,
        openedAssistants,
        errors,
        openAssistant,
        closeAssistant,
        cancelDownloadModel,
        resumeDownloadModel,
        unloadModelOnGPU,
        initAssistant,
        generateResult,
        cancelRunningAction,
        runningActionResolvers,
    } = assistantContext;

    const isGeneratingResult = useMemo(() => {
        const runningActionsInAssistant = runningActionResolvers.filter(
            (resolver) => resolver.assistantID === assistantID
        );
        return runningActionsInAssistant.length > 0;
    }, [assistantID, runningActionResolvers]);

    const error = useMemo(() => {
        const specificError = errors.find((error) => {
            if (error.type === AssistantErrorTypes.specificError) {
                return error.assistantID === assistantID;
            }
            return false;
        });
        const globalError = errors.find((error) => {
            return error.type === AssistantErrorTypes.globalError;
        });

        return specificError?.error || globalError?.error;
    }, [assistantID, errors]);

    const handleCancelRunningAction = () => {
        if (assistantID) {
            cancelRunningAction(assistantID);
        }
    };

    const handleGenerateResult = async ({
        inputText,
        callback,
    }: {
        inputText: string;
        callback: (token: string, fullText: string) => void;
    }) => {
        if (assistantID) {
            return generateResult({ inputText, callback, assistantID });
        }
    };

    return {
        canShowAssistant,
        hasCompatibleHardware,
        hasCompatibleBrowser,
        canUseAssistant,
        isModelDownloaded,
        isModelDownloading,
        downloadReceivedBytes,
        downloadModelSize,
        downloadPaused,
        isModelLoadedOnGPU,
        isModelLoadingOnGPU,
        isGeneratingResult,
        openedAssistants,
        error,
        openAssistant,
        closeAssistant,
        cancelDownloadModel,
        resumeDownloadModel,
        unloadModelOnGPU,
        initAssistant,
        generateResult: handleGenerateResult,
        cancelRunningAction: handleCancelRunningAction,
    };
};

export const AssistantProvider = ({
    children,
    assistantFeature,
}: {
    children: ReactNode;
    assistantFeature: FeatureFlag;
}) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const assistantFeatureEnabled = useFlag(assistantFeature);

    const llmManager = useRef<LlmManager | null>(null);
    const llmModel = useRef<LlmModel | null>(null);

    const assistantConfigRef = useRef<AssistantConfig>();

    const [openedAssistants, setOpenedAssistants] = useState<string[]>([]);

    const [isModelDownloaded, setIsModelDownloaded] = useState(false);
    const [isModelDownloading, setIsModelDownloading] = useState(false);
    const [downloadReceivedBytes, setDownloadReceivedBytes] = useState(0);
    const [downloadModelSize, setDownloadModelSize] = useState(0);
    const [downloadPaused, setDownloadPaused] = useState(false);
    // ref to know if the user downloaded the model in this session
    const userDownloadedModel = useRef(false);

    const [isModelLoadedOnGPU, setIsModelLoadedOnGPU] = useState(false);
    const [isModelLoadingOnGPU, setIsModelLoadingOnGPU] = useState(false);

    const [errors, setErrors] = useState<AssistantError[]>([]);

    const generatedTokensNumber = useRef(0);
    const initPromise = useRef<Promise<void>>();

    const runningActionsRef = useRef<AssistantRunningAction[]>([]);
    const [runningActionResolvers, setRunningActionResolvers] = useState<AssistantRunningActionResolver[]>([]);

    const assistantStatus = useRef<ASSISTANT_STATUS>(ASSISTANT_STATUS.NOT_LOADED);

    useEffect(() => {
        assistantStatus.current = getAssistantStatus({
            isModelDownloading,
            isModelDownloaded,
            isModelLoadingOnGPU,
            isModelLoadedOnGPU,
        });
    }, [isModelDownloading, isModelDownloaded, isModelLoadingOnGPU, isModelLoadedOnGPU]);

    const { sendRequestAssistantReport, sendUnloadModelAssistantReport, sendDownloadAssistantReport } =
        useAssistantTelemetry();

    const cleanRunningActionPromises = (assistantID: string) => {
        setRunningActionResolvers(() =>
            runningActionResolvers.filter((resolver) => resolver.assistantID !== assistantID)
        );
    };

    const resolveRunningActionPromise = (assistantID: string) => {
        const generationResolver = runningActionResolvers.find((resolver) => resolver.assistantID === assistantID);
        if (generationResolver) {
            generationResolver?.resolver();
            cleanRunningActionPromises(assistantID);
        }
    };

    const getRunningActionFromAssistantID = (assistantID: string) => {
        return runningActionsRef.current.find((runningAction) => runningAction.assistantID === assistantID);
    };

    const cleanAssistantRunningAction = (assistantID: string) => {
        runningActionsRef.current = runningActionsRef.current.filter(
            (runningAction) => runningAction.assistantID !== assistantID
        );
    };

    const addSpecificError = ({ assistantID, errorMessage }: { assistantID: string; errorMessage: string }) => {
        const newError: AssistantError = {
            type: AssistantErrorTypes.specificError,
            assistantID,
            error: errorMessage,
        };

        setErrors([...errors, newError]);
    };

    const addGlobalError = (errorMessage: string) => {
        const newError: AssistantError = {
            type: AssistantErrorTypes.globalError,
            error: errorMessage,
        };

        setErrors([...errors, newError]);
    };

    const cleanSpecificErrors = (assistantID: string) => {
        const filteredErrors = errors.filter((error) => {
            if (error.type === AssistantErrorTypes.specificError) {
                return error.assistantID !== assistantID;
            }
            return error;
        });

        setErrors(filteredErrors);
    };

    const cleanGlobalErrors = () => {
        const filteredErrors = errors.filter((error) => {
            return error.type !== AssistantErrorTypes.globalError;
        });

        setErrors(filteredErrors);
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
            resolveRunningActionPromise(assistantID);
            cancelAssistantRunningAction(assistantID);
        } catch (e: any) {
            traceInitiativeError('assistant', e);
            const errorMessage = c('loc_nightly_assistant').t`Something went wrong while cancelling the generation`;
            addSpecificError({ assistantID, errorMessage });
        }
    };

    const openAssistant = (assistantID: string) => {
        setOpenedAssistants([...openedAssistants, assistantID]);
    };

    const closeAssistant = (assistantID: string) => {
        const filteredAssistants = openedAssistants.filter((assistant) => assistant !== assistantID);
        setOpenedAssistants(filteredAssistants);
        cancelRunningAction(assistantID);
        cleanSpecificErrors(assistantID);
    };

    const [user, isLoadingUser] = useUser();

    // Show the feature in the UI only when the feature flag is ON
    const canShowAssistant = useMemo(() => {
        return getCanShowAssistant(assistantFeatureEnabled);
    }, [assistantFeatureEnabled]);

    // When hardware is not compatible, show an error in the UI
    const [hasCompatibleHardware, setHasCompatibleHardware] = useState(false);

    // When the browser is not compatible, suggest the user to run it on a compatible browser
    const hasCompatibleBrowser = useMemo(() => {
        return getAssistantHasCompatibleBrowser(); // TODO refactor
    }, []);

    // The assistant can be run if the user is paying the feature or is in trial
    const canUseAssistant = useMemo(() => {
        return isLoadingUser ? false : getCanUseAssistant(user);
    }, [user, isLoadingUser]);

    const handleGetAssistantModels = () => {
        void queryAssistantModels(api).then((models) => {
            const config = buildMLCConfig(models);
            if (config) {
                assistantConfigRef.current = config;
            }
        });
    };

    const handleCheckHardwareCompatibility = async () => {
        const isCompatible = await getAssistantHasCompatibleHardware();
        setHasCompatibleHardware(isCompatible);
    };

    useEffect(() => {
        void handleCheckHardwareCompatibility();
    }, []);

    useEffect(() => {
        if (
            !llmManager.current &&
            canShowAssistant &&
            canUseAssistant &&
            hasCompatibleHardware &&
            hasCompatibleBrowser
        ) {
            llmManager.current = new GpuLlmManager();

            // Get assistant models API side
            handleGetAssistantModels();
        }
    }, [canShowAssistant, canUseAssistant, hasCompatibleHardware, hasCompatibleBrowser]);

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
            const errorMessage = c('loc_nightly_assistant').t`Something went wrong while downloading the model`;
            addGlobalError(errorMessage);
            setIsModelDownloading(false);
            throw new Error(errorMessage);
        }
    };

    const loadModelOnGPU = async () => {
        try {
            if (!llmManager.current || !assistantConfigRef.current) {
                return; // throw an error?
            }
            // Clean global errors when loading the model
            cleanGlobalErrors();

            setIsModelLoadingOnGPU(true);
            const model = await llmManager.current.loadOnGpu(assistantConfigRef.current);
            llmModel.current = model;
            setIsModelLoadingOnGPU(false);
            setIsModelLoadedOnGPU(true);
        } catch (e: any) {
            traceInitiativeError('assistant', e);
            console.error(e);
            const errorMessage = c('loc_nightly_assistant').t`Something went wrong while loading the model on the GPU`;
            addGlobalError(errorMessage);
            setIsModelLoadingOnGPU(false);
            setIsModelLoadedOnGPU(false);
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
            const errorMessage = c('loc_nightly_assistant')
                .t`Something went wrong while unloading the model from the GPU`;
            addGlobalError(errorMessage);
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
            const isModelDownloaded = assistantStatus.current >= ASSISTANT_STATUS.DOWNLOADED;
            const isModelDownloading = assistantStatus.current === ASSISTANT_STATUS.DOWNLOADING;
            const isModelLoadedOnGPU = assistantStatus.current >= ASSISTANT_STATUS.READY;
            const isModelLoadingOnGPU = assistantStatus.current === ASSISTANT_STATUS.LOADING_GPU;
            // Use try catch in case one of the steps fails, so that we don't run the next step
            try {
                let completedDownload;
                if (!isModelDownloaded && !isModelDownloading) {
                    completedDownload = await downloadModel();
                }
                if (completedDownload && !isModelLoadedOnGPU && !isModelLoadingOnGPU) {
                    await loadModelOnGPU();
                }

                // Show a notification only when the user had to download the model
                if (completedDownload && userDownloadedModel.current) {
                    createNotification({
                        text: c('loc_nightly_assistant').t`${ASSISTANT_FEATURE_NAME} is ready to use`,
                    });
                    userDownloadedModel.current = false;
                }
            } catch {}
            initPromise.current = undefined;
        })();
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

    // TODO pass promptType
    const generateResult = async ({ inputText, callback, assistantID }: GenerateAssistantResult) => {
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
                    const generationCallback = (token: string, fulltext: string) => {
                        generatedTokensNumber.current++;
                        callback(token, fulltext);
                    };

                    const generationStart = performance.now();
                    const runningAction = await llmModel.current.performAction(
                        {
                            type: 'writeFullEmail',
                            prompt: inputText,
                        },
                        generationCallback
                    );
                    runningActionsRef.current.push({ runningAction, assistantID });
                    await runningAction.waitForCompletion();

                    // Send telemetry report
                    const generationEnd = performance.now();
                    const generationTime = generationEnd - generationStart;
                    sendRequestAssistantReport({
                        ingestionTime,
                        generationTime,
                        tokensGenerated: generatedTokensNumber.current,
                    });
                    generatedTokensNumber.current = 0;
                }
            } catch (e: any) {
                traceInitiativeError('assistant', e);
                console.error(e);
                const errorMessage = c('loc_nightly_assistant').t`Something went wrong while generating a result`;
                addSpecificError({ assistantID, errorMessage });
            }

            // Reset the generating state
            cleanAssistantRunningAction(assistantID);
            cleanRunningActionPromises(assistantID);
        });
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

    return (
        <AssistantContext.Provider
            value={{
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
                closeAssistant,
                cancelDownloadModel,
                resumeDownloadModel,
                unloadModelOnGPU,
                initAssistant,
                generateResult,
                cancelRunningAction,
                runningActionResolvers,
            }}
        >
            {children}
        </AssistantContext.Provider>
    );
};
