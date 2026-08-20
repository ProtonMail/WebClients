import { quickChat } from '@proton/lumo-api-client';
import type { Api } from '@proton/shared/lib/interfaces';

import { ENABLE_U2L_ENCRYPTION } from '../llm/config';
import { selectMasterKey } from '../redux/selectors';
import {
    appendGeneratedMemoriesThunk,
    updateLumoUserSettings,
    updateLumoUserSettingsWithAutoSave,
} from '../redux/slices/lumoUserSettings';
import type { LumoDispatch, LumoState } from '../redux/store';
import {
    MEMORY_AUTO_SAVE_PROMPT_THRESHOLD,
    buildMemoryBootstrapPrompt,
    canGenerateMemoriesFromChats,
    getMemoryGenerationCutoff,
    getMemoryGenerationScanBoundary,
    memoriesFromContents,
    normalizeMemories,
    parseMemoryGenerationResponse,
    sampleUserPromptsForMemoryGeneration,
} from '../util/memoryHelpers';
import { safeLogger } from '../util/safeLogger';

let autoSaveInFlight = false;

type AutoSaveContext = {
    api: Api;
    dispatch: LumoDispatch;
    getState: () => LumoState;
    hasLumoPlus?: boolean;
};

/**
 * Increments the general-chat prompt counter and, every {@link MEMORY_AUTO_SAVE_PROMPT_THRESHOLD}
 * prompts, appends new chat-derived memories in the background. The final merge runs against the
 * *latest* state via {@link appendGeneratedMemoriesThunk}, so memories the user adds or edits
 * during the long-running LLM call are not clobbered.
 */
export const maybeAutoSaveMemoriesFromChats = ({ api, dispatch, getState, hasLumoPlus = false }: AutoSaveContext) => {
    const state = getState();
    const settings = state.lumoUserSettings;

    if (!settings.isMemoryAutoSaveEnabled || !settings.isMemoryEnabled) {
        return;
    }

    if (!selectMasterKey(state)) {
        return;
    }

    const nextCount = (settings.memoryPromptsSinceAutoSave ?? 0) + 1;
    dispatch(updateLumoUserSettings({ memoryPromptsSinceAutoSave: nextCount }));

    if (nextCount < MEMORY_AUTO_SAVE_PROMPT_THRESHOLD || autoSaveInFlight) {
        return;
    }

    autoSaveInFlight = true;

    void (async () => {
        try {
            const existingAtRequestTime = normalizeMemories(settings.memories);
            const after = getMemoryGenerationCutoff(
                settings.memoryLastProcessedMessageAt,
                existingAtRequestTime
            );
            const samplingOptions = {
                hasLumoPlus,
                after,
            };
            const samples = sampleUserPromptsForMemoryGeneration(
                state.messages,
                state.conversations,
                state.spaces,
                samplingOptions
            );
            if (!canGenerateMemoriesFromChats(samples.length)) {
                dispatch(updateLumoUserSettings({ memoryPromptsSinceAutoSave: 0 }));
                return;
            }
            const processedThrough = getMemoryGenerationScanBoundary(
                state.messages,
                state.conversations,
                state.spaces,
                samplingOptions
            );
            if (!processedThrough) {
                throw new Error('No memory generation scan boundary');
            }

            const response = await quickChat(api, buildMemoryBootstrapPrompt(samples, existingAtRequestTime), {
                enableWebSearch: false,
                config: { enableU2LEncryption: ENABLE_U2L_ENCRYPTION },
            });

            const parsed = parseMemoryGenerationResponse(response, existingAtRequestTime);
            if (parsed.status === 'invalid') {
                throw new Error('Invalid memory generation response');
            }
            if (parsed.memories.length === 0) {
                dispatch(updateLumoUserSettingsWithAutoSave({ memoryPromptsSinceAutoSave: 0 }));
                return;
            }

            const generated = memoriesFromContents(parsed.memories, 'generated');
            dispatch(appendGeneratedMemoriesThunk(generated, processedThrough));
        } catch (error) {
            safeLogger.error('[memoryAutoSave] Background update failed', error);
        } finally {
            autoSaveInFlight = false;
        }
    })();
};
