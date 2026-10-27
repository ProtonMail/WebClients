import type { ClientToolExecutor } from '@proton/lumo-api-client/core/client-tools';
import type { ScheduleRun } from '@proton/lumo-api-client/core/desktop-schedules';
import type { DesktopConnector, ScheduleExecutionInput } from '@proton/lumo-api-client/core/desktop-tools';
import busy from '@proton/shared/lib/busy/busy';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import { executeConversationTurn } from '../../components/Conversation/helper';
import { DEFAULT_MODEL_TIER, DEFAULT_RESPONSE_MODE } from '../../providers/modelTierConstants';
import { generationRegistry } from '../generation/generationRegistry';
import { getRemainingLimits, resolveAvailableModelTier } from '../usageLimitsStore';
import type { ScheduleStorage } from './ScheduleStorage';
import { restrictScheduleTools } from './restrictedTools';
import type { ScheduleContext, ScheduleExecutionResult, ScheduleExecutionTarget, ScheduleTask } from './types';

export type ScheduleGenerationOptions = {
    externalTools: boolean;
    imageTools: boolean;
    artifactsView: boolean;
    artifactSlides: boolean;
    memory: boolean;
    visualizationInstructions: boolean;
    hasLumoPlus: boolean;
    isMaxAvailable: boolean;
    apertusModelAvailable: boolean;
    previewModelAvailable: boolean;
};

/** Runs a claimed occurrence through the same conversation preparation and streaming path as chat. */
export function createScheduleConversationRunner({
    storage,
    api,
    getOptions,
    createTools,
    getConnectors,
}: {
    storage: ScheduleStorage;
    api: Api;
    getOptions: () => ScheduleGenerationOptions;
    createTools: (input: ScheduleExecutionInput) => ClientToolExecutor;
    getConnectors: () => Promise<DesktopConnector[]>;
}) {
    return async (
        target: ScheduleExecutionTarget,
        task: ScheduleTask,
        context: ScheduleContext,
        run: ScheduleRun
    ): Promise<ScheduleExecutionResult> => {
        const guard = () => {
            storage.guard();
            if (context.signal.aborted) throw new DOMException('Scheduled execution stopped', 'AbortError');
        };
        guard();
        const options = getOptions();
        const state = storage.store.getState();
        const settings = state.lumoUserSettings;
        const selectedModel = task.modelTier ?? settings.preferredModelTier ?? DEFAULT_MODEL_TIER;
        const modelTier =
            selectedModel === 'auto'
                ? 'auto'
                : resolveAvailableModelTier(selectedModel, getRemainingLimits(), {
                      isMaxAvailable: options.isMaxAvailable,
                      isApertusEnabled: options.apertusModelAvailable,
                      isPreviewEnabled: options.previewModelAvailable,
                  });
        const tools = restrictScheduleTools(
            createTools({
                runId: run.runId,
                connectorIds: task.connectorIds,
                autoApprove: task.autoApprove === true,
            }),
            task.connectorIds,
            getConnectors,
            guard
        );
        const controller = generationRegistry.start(target.conversationId);
        const stop = () => controller.abort();
        context.signal.addEventListener('abort', stop, { once: true });
        const releaseBusy = busy.register();
        let outcome: ScheduleExecutionResult['outcome'] = 'interrupted';
        try {
            const guardedApi: Api = async <T>(request: object): Promise<T> => {
                guard();
                const response = await api<T>(request);
                guard();
                return response;
            };
            const result = await storage.store.dispatch(
                executeConversationTurn({
                    applicationContext: { api: guardedApi, signal: controller.signal, userId: context.accountId },
                    newMessageData: { content: task.prompt, attachments: [] },
                    conversationContext: {
                        conversationId: target.conversationId,
                        spaceId: task.id,
                        allConversationAttachments: [],
                        messageChain: [],
                        contextFilters: [],
                    },
                    uiContext: {
                        enableExternalTools: options.externalTools && (settings.automaticWebSearch ?? true),
                        enableImageTools: options.imageTools,
                        enableReasoning:
                            task.enableReasoning ??
                            (settings.preferredResponseMode ?? DEFAULT_RESPONSE_MODE) === 'thinking',
                        modelTier,
                        generateTitle: false,
                        enableSmoothing: false,
                    },
                    settingsContext: {
                        personalization: settings.personalization,
                        isMemoryFeatureEnabled: options.memory,
                        isArtifactsViewFeatureEnabled: options.artifactsView,
                        isArtifactSlidesFeatureEnabled: options.artifactSlides,
                        isVisualizationInstructionsFeatureEnabled: options.visualizationInstructions,
                        hasLumoPlus: options.hasLumoPlus,
                    },
                    executionContext: {
                        background: true,
                        clientToolExecutor: tools,
                        messages: { user: target.prompt, assistant: target.assistant },
                    },
                })
            );
            guard();
            outcome = result?.status === 'succeeded' ? 'succeeded' : 'failed';
        } catch (error) {
            guard();
            console.error('Scheduled conversation execution failed', error);
        } finally {
            releaseBusy();
            context.signal.removeEventListener('abort', stop);
            generationRegistry.finish(target.conversationId);
        }
        guard();
        const messageIds = Object.values(storage.store.getState().messages)
            .filter((message) => message.conversationId === target.conversationId && message.id !== target.prompt.id)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            .map((message) => message.id);
        return { outcome, messageIds };
    };
}
