import type { Api } from '@proton/shared/lib/interfaces';

import { quickChat } from '../lib/lumo-api-client';
import {
    appendGeneratedMemoriesThunk,
    updateLumoUserSettings,
} from '../redux/slices/lumoUserSettings';
import type { LumoDispatch, LumoState } from '../redux/store';
import { safeLogger } from '../util/safeLogger';
import {
    buildMemoryBootstrapPrompt,
    canGenerateMemoriesFromChats,
    MEMORY_AUTO_SAVE_PROMPT_THRESHOLD,
    memoriesFromContents,
    normalizeMemories,
    parseMemoryStringsResponse,
    sampleUserPromptsForMemoryGeneration,
} from '../util/memoryHelpers';

let autoSaveInFlight = false;

type AutoSaveContext = {
    api: Api;
    dispatch: LumoDispatch;
    getState: () => LumoState;
};

/**
 * Increments the general-chat prompt counter and, every {@link MEMORY_AUTO_SAVE_PROMPT_THRESHOLD}
 * prompts, appends new chat-derived memories in the background. The final merge runs against the
 * *latest* state via {@link appendGeneratedMemoriesThunk}, so memories the user adds or edits
 * during the long-running LLM call are not clobbered.
 */
export const maybeAutoSaveMemoriesFromChats = ({ api, dispatch, getState }: AutoSaveContext) => {
    const state = getState();
    const settings = state.lumoUserSettings;

    if (!settings.isMemoryAutoSaveEnabled || !settings.isMemoryEnabled) {
        return;
    }

    if (!state.credentials?.masterKey) {
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
            const samples = sampleUserPromptsForMemoryGeneration(state.messages, state.conversations, state.spaces);
            if (!canGenerateMemoriesFromChats(samples.length)) {
                dispatch(updateLumoUserSettings({ memoryPromptsSinceAutoSave: 0 }));
                return;
            }

            const existingAtRequestTime = normalizeMemories(settings.memories);
            const response = await quickChat(api, buildMemoryBootstrapPrompt(samples, existingAtRequestTime), {
                enableWebSearch: false,
            });

            const contents = parseMemoryStringsResponse(response);
            if (contents.length === 0) {
                dispatch(updateLumoUserSettings({ memoryPromptsSinceAutoSave: 0 }));
                return;
            }

            const generated = memoriesFromContents(contents, 'generated');
            dispatch(appendGeneratedMemoriesThunk(generated));
        } catch (error) {
            safeLogger.error('[memoryAutoSave] Background update failed', error);
        } finally {
            autoSaveInFlight = false;
        }
    })();
};
