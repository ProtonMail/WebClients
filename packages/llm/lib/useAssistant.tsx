import { createContext, useContext, useMemo } from 'react';

import { AssistantError, AssistantErrorTypes } from '@proton/llm/lib/hooks/useAssistantErrors';

import {
    Action,
    AssistantConfig,
    GenerationCallback,
    OpenedAssistant,
    OpenedAssistantStatus,
    RunningAction,
} from './types';

export interface GenerateAssistantResult {
    assistantID: string;
    action: Action;
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
    openedAssistants: OpenedAssistant[];
    /**
     * Add assistant instance to the context
     */
    openAssistant: (assistantID: string) => void;
    /**
     * Remove assistant instance from the context
     */
    closeAssistant: (assistantID: string) => void;
    /**
     * Set the status of an assistant in the context
     */
    setAssistantStatus: (assistantID: string, status: OpenedAssistantStatus) => void;
    /**
     * Can the user see the assistant in the UI if:
     * - Feature flag is on
     * - AIAssistant setting not set to OFF
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
    cancelDownloadModel?: () => void;
    /**
     * Manually resume the model download
     */
    resumeDownloadModel?: () => void;
    /**
     * Manually unload the model from the GPU
     */
    unloadModelOnGPU?: () => Promise<void>;
    /**
     * Initialise the assistant:
     *  - Starts by downloading the model (if necessary)
     *  - Then loads it on the GPU (if necessary)
     */
    initAssistant?: () => void;
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
    /**
     * Config of the model used by the assistant
     */
    assistantConfig?: AssistantConfig;
    resetAssistantState: () => void;
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
        setAssistantStatus,
        cancelDownloadModel,
        resumeDownloadModel,
        unloadModelOnGPU,
        initAssistant,
        generateResult,
        cancelRunningAction,
        runningActionResolvers,
        resetAssistantState,
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

        return specificError || globalError;
    }, [assistantID, errors]);

    const handleCancelRunningAction = () => {
        if (assistantID) {
            cancelRunningAction(assistantID);
        }
    };

    const handleGenerateResult = async ({ action, callback }: Omit<GenerateAssistantResult, 'assistantID'>) => {
        if (assistantID) {
            return generateResult({ action, callback, assistantID });
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
        setAssistantStatus,
        cancelDownloadModel,
        resumeDownloadModel,
        unloadModelOnGPU,
        initAssistant,
        generateResult: handleGenerateResult,
        cancelRunningAction: handleCancelRunningAction,
        assistantConfig: assistantContext.assistantConfig,
        resetAssistantState,
    };
};
