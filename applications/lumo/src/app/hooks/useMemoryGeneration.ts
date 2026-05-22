import { useCallback, useMemo, useRef, useState } from 'react';

import useApi from '@proton/components/hooks/useApi';

import { quickChat } from '../lib/lumo-api-client';
import { useLumoSelector } from '../redux/hooks';
import type { Memory } from '../redux/slices/lumoUserSettings';
import {
    buildMemoryBootstrapPrompt,
    canGenerateMemoriesFromChats,
    MEMORY_GENERATION_MAX_SAMPLES,
    memoriesFromContents,
    parseMemoryStringsResponse,
    sampleUserPromptsForMemoryGeneration,
} from '../util/memoryHelpers';

const MIN_SAMPLES_REQUIRED = 2;

export function useMemoryGeneration() {
    const api = useApi();
    const messages = useLumoSelector((state) => state.messages);
    const conversations = useLumoSelector((state) => state.conversations);
    const spaces = useLumoSelector((state) => state.spaces);
    const [isBootstrapping, setIsBootstrapping] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const promptSamples = useMemo(
        () => sampleUserPromptsForMemoryGeneration(messages, conversations, spaces),
        [messages, conversations, spaces]
    );

    const canGenerateFromChats = canGenerateMemoriesFromChats(promptSamples.length);

    const generateFromChats = useCallback(
        async (existingMemories: Memory[] = []): Promise<Memory[]> => {
            if (!canGenerateFromChats) {
                throw new Error('Not enough chat history to generate memories');
            }

            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;
            setIsBootstrapping(true);

            try {
                const response = await quickChat(api, buildMemoryBootstrapPrompt(promptSamples, existingMemories), {
                    enableWebSearch: false,
                    signal: controller.signal,
                });
                console.log('response', response);
                return memoriesFromContents(parseMemoryStringsResponse(response), 'generated');
            } finally {
                if (abortRef.current === controller) {
                    abortRef.current = null;
                }
                setIsBootstrapping(false);
            }
        },
        [api, canGenerateFromChats, promptSamples]
    );

    const cancelGeneration = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setIsBootstrapping(false);
    }, []);

    return {
        generateFromChats,
        cancelGeneration,
        isBootstrapping,
        isGenerating: isBootstrapping,
        canGenerateFromChats,
        promptSampleCount: promptSamples.length,
        maxPromptSamples: MEMORY_GENERATION_MAX_SAMPLES,
        minSamplesRequired: MIN_SAMPLES_REQUIRED,
    };
}
