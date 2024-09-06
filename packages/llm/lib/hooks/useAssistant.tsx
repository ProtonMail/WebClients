import { createContext, useContext, useMemo } from 'react';

import type { AssistantSubscriptionStatus } from '@proton/components/hooks/assistant/useAssistantSubscriptionStatus';
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

export interface AssistantHooksProps {
    /**
     * Config of the model used by the assistant
     */
    assistantConfig?: AssistantConfig;
    /**
     * Initialise the assistant:
     *  - Starts by downloading the model (if necessary)
     *  - Then loads it on the GPU (if necessary)
     */
    initAssistant?: () => void;
    /**
     * The full model size, when downloading it
     */
    downloadModelSize: number;
    /**
     * The model download progress in bytes, when downloading it
     */
    downloadReceivedBytes: number;
    /**
     * Is the model downloading paused
     */
    downloadPaused: boolean;
    /**
     * Has the user downloaded the model
     */
    isModelDownloaded: boolean;
    /**
     * Is the model being downloaded
     */
    isModelDownloading: boolean;
    /**
     * Manually cancel the model download
     */
    cancelDownloadModel?: () => void;
    /**
     * Manually resume the model download
     */
    resumeDownloadModel?: () => void;
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
     * Manually unload the model from the GPU
     */
    unloadModelOnGPU?: () => Promise<void>;
    /**
     * Generate a result from a prompt
     */
    generateResult: (generateAssistantResult: GenerateAssistantResult) => Promise<void>;
    /**
     * All running actions in the assistant
     */
    runningActions: AssistantRunningActions;
    /**
     * Cancel the current running action (result generation)
     */
    cancelRunningAction: (assistantID: string) => void;
    /**
     * Remove assistant instance from the context
     * `manual` has to be set to true when the user is manually closing the assistant.
     * This will set the sticky value in the localstorage
     */
    closeAssistant: (assistantID: string, manual?: boolean) => void;
    /**
     * Reset all assistant states (download, load on GPU, running actions, etc...)
     */
    resetAssistantState: () => void;
}

export interface AssistantCommonProps {
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
     * Can the user run the assistant (based on the plan and trial state)
     */
    canUseAssistant: boolean;
    /**
     * Can the user run the assistant on his machine
     */
    hasCompatibleHardware: boolean;
    /**
     * Can the user run the assistant in the browser
     */
    hasCompatibleBrowser: boolean;
    /**
     * Runs the hardware compatibility check on demand
     */
    handleCheckHardwareCompatibility: () => Promise<{ hasCompatibleBrowser: boolean; hasCompatibleHardware: boolean }>;
    /**
     * Checks if the assistant can be opened by default in the composer
     */
    getIsStickyAssistant: (assistantID: string, canShowAssistant: boolean, canRunAssistant: boolean) => boolean;
    /**
     * Potential error that occurred while using the assistant
     */
    errors: AssistantError[];
    /**
     * Add an error that is assistant specific
     */
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
     * Remove error that is assistant specific
     */
    cleanSpecificErrors: (assistantID: string) => void;
    /**
     * Add an error that is applied to all assistants
     */
    addGlobalError: (assistantType: ASSISTANT_TYPE, errorType: ERROR_TYPE) => string;
    /**
     * Close errors that are applied to all assistants
     */
    cleanGlobalErrors: () => void;
    /**
     * Feature flag that allows to use the logic to keep HTML formatting
     */
    canKeepFormatting: boolean;
    /**
     * Close the assistant. Warning use the one that is coming from assistant hooks instead, it is also cleaning running actions
     */
    closeAssistant: (
        cancelRunningAction: (assistantId: string) => void
    ) => (assistantID: string, manual?: boolean) => void;
    /**
     * All data related to the assistant subscription and trial state
     */
    assistantSubscriptionStatus: AssistantSubscriptionStatus;
}

export type AssistantContextType = AssistantHooksProps &
    Omit<AssistantCommonProps, 'closeAssistant'> & {
        /**
         * Needed to call `initAssistant` on composer assistant inner modal submit
         * In this case assistant context is still set to server mode so initAssistant was undefined.
         * In order to call initAssistant with no side effects i made a duplicate
         */
        handleSettingChange?: () => void;
    };

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
