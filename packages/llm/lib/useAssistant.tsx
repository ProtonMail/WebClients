import { ReactNode, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { FeatureFlag, useFlag } from '@proton/components/containers';
import { domIsBusy } from '@proton/shared/lib/busy';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import { GenerationCallback, LlmManager, LlmModel, RunningAction } from './types';
import { GpuLlmManager } from './gpu';
import {UNLOAD_ASSISTANT_TIMEOUT, RETRY_GENERATE_TIMEOUT, ASSISTANT_STATUS} from './constants'
import {getAssistantStatus, getCanRunAssistant, getHasAccessToAssistant} from './helpers'
import {c} from "ttag";

export interface GenerateAssistantResult {
    inputText: string;
    callback: GenerationCallback;
}

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
     * TODO Temporary for alpha, is the assistant opened
     */
    openedAssistants: string[];
    /**
     * TODO Temporary for alpha, set is assistant opened
     */
    openAssistant: (value: string) => void;
    /**
     * TODO Temporary for alpha, set is assistant opened
     */
    closeAssistant: (value: string) => void;
    /**
     * Can the user use the assistant (depending on the computer and browser)
     */
    canRunAssistant: boolean;
    /**
     * Can the user use the assistant (depending on the feature flag and eligibility)
     */
    hasAccessToAssistant: boolean;
    /**
     * Has the user downloaded the model
     */
    isModelDownloaded: boolean;
    /**
     * Is the model being downloaded
     */
    isModelDownloading: boolean;
    /**
     * The model download progress, when downloading it
     */
    downloadModelProgress: number;
    /**
     * Is the model being loaded on the GPU at the moment
     */
    isModelLoadedOnGPU: boolean;
    /**
     * Is the model being loaded on the GPU
     */
    isModelLoadingOnGPU: boolean;
    /**
     * Is the assistant currently generating a result
     */
    isGeneratingResult: boolean;
    /**
     * Is the user waiting for an assistant result
     * This is a combination of downloading the model, loading it on th GPU and generating a result
     */
    isWaitingForResult: boolean;
    /**
     * Potential error that occurred while using the assistant
     */
    error: string;
    /**
     * Manually cancel the model download
     */
    cancelDownloadModel: () => void;
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
    generateResult: ({ inputText, callback }: GenerateAssistantResult) => Promise<void>;
    /**
     * Cancel the current running action (result generation)
     */
    cancelRunningAction: () => void;
} | null>(null);

export const useAssistant = () => {
    const assistantContext = useContext(AssistantContext);

    if (!assistantContext) {
        throw new Error('Assistant provider not initialized');
    }

    const {
        canRunAssistant,
        hasAccessToAssistant,
        isModelDownloaded,
        isModelDownloading,
        downloadModelProgress,
        isModelLoadedOnGPU,
        isModelLoadingOnGPU,
        isGeneratingResult,
        isWaitingForResult,
        openedAssistants,
        error,
        openAssistant,
        closeAssistant,
        cancelDownloadModel,
        unloadModelOnGPU,
        initAssistant,
        generateResult,
        cancelRunningAction,
    } = assistantContext;

    return {
        canRunAssistant,
        hasAccessToAssistant,
        isModelDownloaded,
        isModelDownloading,
        downloadModelProgress,
        isModelLoadedOnGPU,
        isModelLoadingOnGPU,
        isGeneratingResult,
        isWaitingForResult,
        openedAssistants,
        error,
        openAssistant,
        closeAssistant,
        cancelDownloadModel,
        unloadModelOnGPU,
        initAssistant,
        generateResult,
        cancelRunningAction,
    };
};

export const AssistantProvider = ({
    children,
    assistantFeature,
}: {
    children: ReactNode;
    assistantFeature: FeatureFlag;
}) => {
    // TODO enable this later, tmp fix during dev to always have the feature enabled
    const tmp = useFlag(assistantFeature);
    const assistantFeatureEnabled = tmp || true;

    const llmManager = useRef<LlmManager | null>(null);
    const llmModel = useRef<LlmModel | null>(null);

    const runningActionRef = useRef<RunningAction | null>(null);

    const [openedAssistants, setOpenedAssistants] = useState<string[]>([]);

    const [isModelDownloaded, setIsModelDownloaded] = useState(false);
    const [isModelDownloading, setIsModelDownloading] = useState(false);
    const [downloadModelProgress, setDownloadModelProgress] = useState(0);

    const [isModelLoadedOnGPU, setIsModelLoadedOnGPU] = useState(false);
    const [isModelLoadingOnGPU, setIsModelLoadingOnGPU] = useState(false);

    const [isGeneratingResult, setIsGeneratingResult] = useState(false);

    const [error, setError] = useState('');

    const isWaitingForResult = useMemo(() => {
        return isGeneratingResult || isModelLoadingOnGPU || isModelDownloading;
    }, [isModelDownloading, isModelLoadingOnGPU, isGeneratingResult]);

    const assistantStatus = useRef<ASSISTANT_STATUS>(ASSISTANT_STATUS.NOT_LOADED);

    useEffect(() => {
        assistantStatus.current = getAssistantStatus({
            isModelDownloading,
            isModelDownloaded,
            isModelLoadingOnGPU,
            isModelLoadedOnGPU,
            isGeneratingResult,
        });
    }, [isModelDownloading, isModelDownloaded, isModelLoadingOnGPU, isModelLoadedOnGPU, isGeneratingResult]);

    const openAssistant = (id: string) => {
        setOpenedAssistants([...openedAssistants, id]);
    };

    const closeAssistant = (id: string) => {
        const filteredAssistants = openedAssistants.filter((assistant) => assistant !== id);
        setOpenedAssistants(filteredAssistants);
    };

    // Is the user machine/browser able to run the assistant
    const canRunAssistant = useMemo(() => getCanRunAssistant(), []);

    // Does the user have access to the assistant (plan and feature flag)
    const hasAccessToAssistant = useMemo(
        () => getHasAccessToAssistant(assistantFeatureEnabled),
        [assistantFeatureEnabled]
    );

    useEffect(() => {
        if (!llmManager.current && canRunAssistant && hasAccessToAssistant) {
            llmManager.current = new GpuLlmManager();
        }
    }, [canRunAssistant, hasAccessToAssistant]);

    const downloadCallback = (downloadProgress: number, downloadComplete: boolean) => {
        setDownloadModelProgress(downloadProgress);
        if (downloadComplete) {
            setIsModelDownloading(false);
            setIsModelDownloaded(true);
        }
    };

    const downloadModel = async () => {
        try {
            if (!llmManager.current) {
                return; // throw an error?
            }
            setIsModelDownloading(true);
            await llmManager.current.startDownload(downloadCallback);
        } catch (e: any) {
            traceInitiativeError('assistant', e);
            const errorMessage = c('loc_nightly_assistant').t`Something went wrong while downloading the model`;
            setError(errorMessage);
            setIsModelDownloading(false);
            throw new Error(errorMessage);
        }
    };

    const cancelDownloadModel = () => {
        // TODO not possible for now, to implement later
        // llmManager.current.cancelDownload();
    };

    const loadModelOnGPU = async () => {
        try {
            if (!llmManager.current) {
                return; // throw an error?
            }
            setIsModelLoadingOnGPU(true);
            const model = await llmManager.current.loadOnGpu();
            llmModel.current = model;
            setIsModelLoadingOnGPU(false);
            setIsModelLoadedOnGPU(true);
        } catch (e: any) {
            traceInitiativeError('assistant', e);
            const errorMessage = c('loc_nightly_assistant').t`Something went wrong while loading the model on the GPU`;
            setError(errorMessage);
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
            }
        } catch (e: any) {
            traceInitiativeError('assistant', e);
            setError(c('loc_nightly_assistant').t`Something went wrong while unloading the model from the GPU`);
        }
    };

    const initAssistant = async () => {
        console.log('init start');
        /*
         * To init the assistant
         * 1 - We start by downloading the model if not downloaded yet and model is not downloading at the moment
         * 2 - Then we can load the model on the GPU if not loaded yet and not loading at the moment
         */
        try {
            if (!isModelDownloaded && !isModelDownloading) {
                console.log('downloading');
                await downloadModel();
                console.log('downloaded');
            }
            if (!isModelLoadedOnGPU && !isModelLoadingOnGPU) {
                console.log('loading on gpu');
                await loadModelOnGPU();
                console.log('loaded on gpu');
            }
        } catch {}

        console.log('init end');
    };

    // TODO pass promptType
    const generateResult = async ({ inputText, callback }: GenerateAssistantResult) => {
        console.log('--- Generate res start ---', { assistantStatus });
        // If the assistant is being loaded at the moment, wait for the loading to be completed before generating
        const isAssistantInitializing =
            assistantStatus.current === ASSISTANT_STATUS.DOWNLOADING ||
            assistantStatus.current === ASSISTANT_STATUS.DOWNLOADED ||
            assistantStatus.current === ASSISTANT_STATUS.LOADING_GPU;
        if (isAssistantInitializing) {
            console.log('--- Generate res LOADING ---');
            setTimeout(() => generateResult({ inputText, callback }), RETRY_GENERATE_TIMEOUT);
            return;
        }
        // Init the assistant in case it's not loaded (if it has been unloaded after inactivity for example)
        if (assistantStatus.current === ASSISTANT_STATUS.NOT_LOADED) {
            console.log('--- Generate res NEED TO LOAD ---');
            await initAssistant();
        }

        try {
            const assistantStatusReady =
                assistantStatus.current === ASSISTANT_STATUS.READY ||
                assistantStatus.current === ASSISTANT_STATUS.GENERATING;
            if (assistantStatusReady && llmModel.current) {
                setIsGeneratingResult(true);
                console.log('start gen');
                const runningAction = await llmModel.current.performAction(
                    {
                        type: 'writeFullEmail',
                        prompt: inputText,
                    },
                    callback
                );
                runningActionRef.current = runningAction;
                await runningAction.waitForCompletion();
                runningActionRef.current = null;
                console.log('end gen');
                setIsGeneratingResult(false);
            }
        } catch (e: any) {
            traceInitiativeError('assistant', e);
            setError(c('loc_nightly_assistant').t`Something went wrong while generating a result`);
            setIsGeneratingResult(false);
        }
        console.log('--- Generate res end ---');
    };

    const cancelRunningAction = () => {
        try {
            runningActionRef.current?.cancel();
            setIsGeneratingResult(false);
            runningActionRef.current = null;
        } catch (e: any) {
            traceInitiativeError('assistant', e);
            setError(c('loc_nightly_assistant').t`Something went wrong while cancelling the generation`);
        }
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
    }, [isModelLoadedOnGPU, isGeneratingResult]);

    return (
        <AssistantContext.Provider
            value={{
                isModelDownloaded,
                isModelDownloading,
                downloadModelProgress,
                isModelLoadedOnGPU,
                isModelLoadingOnGPU,
                isGeneratingResult,
                isWaitingForResult,
                canRunAssistant,
                hasAccessToAssistant,
                openedAssistants,
                error,
                openAssistant,
                closeAssistant,
                cancelDownloadModel,
                unloadModelOnGPU,
                initAssistant,
                generateResult,
                cancelRunningAction,
            }}
        >
            {children}
        </AssistantContext.Provider>
    );
};
