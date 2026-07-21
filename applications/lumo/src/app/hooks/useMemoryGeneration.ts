import { useCallback, useMemo, useRef, useState } from 'react';

import useApi from '@proton/components/hooks/useApi';

import { quickChat } from '../lib/lumo-api-client';
import { useLumoPlan } from '../hooks/useLumoPlan';
import { useLumoSelector } from '../redux/hooks';
import type { Memory } from '../redux/slices/lumoUserSettings';
import {
    buildMemoryBootstrapPrompt,
    buildMemoryOptimizePrompt,
    canGenerateMemoriesFromChats,
    canOptimizeMemories,
    MEMORY_GENERATION_MAX_SAMPLES,
    memoriesFromContents,
    parseMemoryOptimizeResponse,
    parseMemoryStringsResponse,
    rebuildMemoriesFromOptimizedContents,
    sampleUserPromptsForMemoryGeneration,
} from '../util/memoryHelpers';

const MIN_SAMPLES_REQUIRED = 2;

export function useMemoryGeneration() {
    const api = useApi();
    const { hasLumoPlus } = useLumoPlan();
    const messages = useLumoSelector((state) => state.messages);
    const conversations = useLumoSelector((state) => state.conversations);
    const spaces = useLumoSelector((state) => state.spaces);
    const [isBootstrapping, setIsBootstrapping] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const optimizeAbortRef = useRef<AbortController | null>(null);

    const promptSamples = useMemo(
        () => sampleUserPromptsForMemoryGeneration(messages, conversations, spaces, { hasLumoPlus }),
        [messages, conversations, spaces, hasLumoPlus]
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
                return memoriesFromContents(parseMemoryStringsResponse(response, existingMemories), 'generated');
            } finally {
                if (abortRef.current === controller) {
                    abortRef.current = null;
                }
                setIsBootstrapping(false);
            }
        },
        [api, canGenerateFromChats, promptSamples]
    );

    const optimizeMemories = useCallback(
        async (existingMemories: Memory[]): Promise<Memory[]> => {
            if (!canOptimizeMemories(existingMemories.length)) {
                throw new Error('Not enough memories to optimize');
            }

            optimizeAbortRef.current?.abort();
            const controller = new AbortController();
            optimizeAbortRef.current = controller;
            setIsOptimizing(true);

            try {
                const response = await quickChat(api, buildMemoryOptimizePrompt(existingMemories), {
                    enableWebSearch: false,
                    signal: controller.signal,
                });
                const contents = parseMemoryOptimizeResponse(response);
                if (contents.length === 0) {
                    throw new Error('No optimized memories returned');
                }
                return rebuildMemoriesFromOptimizedContents(contents, existingMemories);
            } finally {
                if (optimizeAbortRef.current === controller) {
                    optimizeAbortRef.current = null;
                }
                setIsOptimizing(false);
            }
        },
        [api]
    );

    const cancelGeneration = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        optimizeAbortRef.current?.abort();
        optimizeAbortRef.current = null;
        setIsBootstrapping(false);
        setIsOptimizing(false);
    }, []);

    return {
        generateFromChats,
        optimizeMemories,
        cancelGeneration,
        isBootstrapping,
        isOptimizing,
        isGenerating: isBootstrapping || isOptimizing,
        canGenerateFromChats,
        canOptimizeMemories,
        promptSampleCount: promptSamples.length,
        maxPromptSamples: MEMORY_GENERATION_MAX_SAMPLES,
        minSamplesRequired: MIN_SAMPLES_REQUIRED,
    };
}
