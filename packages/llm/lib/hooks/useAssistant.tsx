import { createContext, useContext, useMemo } from 'react';

import type { AssistantError } from '@proton/llm/lib/hooks/useAssistantErrors';
import { AssistantErrorTypes } from '@proton/llm/lib/hooks/useAssistantErrors';
import type { ASSISTANT_TYPE, ERROR_TYPE } from '@proton/shared/lib/assistant';

import type { Action, AssistantConfig, GenerationCallback, OpenedAssistant, OpenedAssistantStatus } from '../types';

export interface GenerateAssistantResult {
    assistantID: string;
    action: Action;
    callback: GenerationCallback;
    hasSelection: boolean;
}

export type AssistantRunningActions = Record<string, () => void>;

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
export interface AssistantContextType {
    /**
     * All assistant instances opened in the context
     */
    openedAssistants: OpenedAssistant[];
    /**
     * Add assistant instance to the context
     * `manual` has to be set to true when the user is manually opening the assistant.
     * This will set the sticky value in the localstorage
     */
    openAssistant: (assistantID: string, manual?: boolean) => void;
    /**
     * Remove assistant instance from the context
     * `manual` has to be set to true when the user is manually closing the assistant.
     * This will set the sticky value in the localstorage
     */
    closeAssistant: (assistantID: string, manual?: boolean) => void;
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
     * We are checking if user has all files in cache
     */
    isCheckingCache: boolean;
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
    /** TODO: Temporary fix - initAssistant copy
     * Needed to call `initAssistant` on composer assistant inner modal submit
     * In this case assistant context is still set to server mode so initAssistant was undefined.
     * In order to call initAssistant with no side effects i made a duplicate
     */
    handleSettingChange?: () => void;
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
    runningActions: AssistantRunningActions;
    /**
     * Config of the model used by the assistant
     */
    assistantConfig?: AssistantConfig;
    resetAssistantState: () => void;
    getIsStickyAssistant: (assistantID: string, canShowAssistant: boolean, canRunAssistant: boolean) => boolean;
    handleCheckHardwareCompatibility: () => Promise<{ hasCompatibleBrowser: boolean; hasCompatibleHardware: boolean }>;
    cleanSpecificErrors: (assistantID: string) => void;
    addSpecificError: ({
        assistantID,
        assistantType,
        errorType,
    }: {
        assistantID: string;
        assistantType: ASSISTANT_TYPE;
        errorType: ERROR_TYPE;
    }) => void;
    /**
     * Feature flag that allows to use the logic to keep HTML formatting
     */
    canKeepFormatting: boolean;
}

export const AssistantContext = createContext<AssistantContextType | null>(null);

export const useAssistant = (assistantID?: string) => {
    const assistantContext = useContext(AssistantContext);

    if (!assistantContext) {
        throw new Error('Assistant provider not initialized');
    }

    const {
        cancelDownloadModel,
        cancelRunningAction,
        canShowAssistant,
        canUseAssistant,
        closeAssistant,
        downloadModelSize,
        downloadPaused,
        downloadReceivedBytes,
        errors,
        generateResult,
        handleSettingChange,
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
        getIsStickyAssistant,
        handleCheckHardwareCompatibility,
        cleanSpecificErrors,
        addSpecificError,
        canKeepFormatting,
    } = assistantContext;

    const isGeneratingResult = !assistantID ? false : !!runningActions[assistantID];

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

    const handleGenerateResult = async ({
        action,
        callback,
        hasSelection,
    }: Omit<GenerateAssistantResult, 'assistantID'>) => {
        if (assistantID) {
            return generateResult({ action, callback, assistantID, hasSelection });
        }
    };

    const handleCleanSpecifcErrors = () => {
        if (assistantID) {
            cleanSpecificErrors(assistantID);
        }
    };

    return {
        assistantConfig: assistantContext.assistantConfig,
        cancelDownloadModel,
        cancelRunningAction: handleCancelRunningAction,
        canShowAssistant,
        canUseAssistant,
        closeAssistant,
        downloadModelSize,
        downloadPaused,
        downloadReceivedBytes,
        error,
        generateResult: handleGenerateResult,
        handleSettingChange,
        hasCompatibleBrowser,
        hasCompatibleHardware,
        initAssistant,
        isCheckingCache,
        isGeneratingResult,
        isModelDownloaded,
        isModelDownloading,
        isModelLoadedOnGPU,
        isModelLoadingOnGPU,
        openAssistant,
        openedAssistants,
        resetAssistantState,
        resumeDownloadModel,
        setAssistantStatus,
        getIsStickyAssistant,
        handleCheckHardwareCompatibility,
        cleanSpecificErrors: handleCleanSpecifcErrors,
        addSpecificError,
        canKeepFormatting,
    };
};
