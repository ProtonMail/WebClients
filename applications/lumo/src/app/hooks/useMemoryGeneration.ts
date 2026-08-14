import { useCallback, useMemo, useRef, useState } from 'react';

import useApi from '@proton/components/hooks/useApi';
import { quickChat } from '@proton/lumo-api-client';

import { useLumoPlan } from '../hooks/useLumoPlan';
import { useLumoSelector } from '../redux/hooks';
import type { Memory } from '../redux/slices/lumoUserSettings';
import {
    MEMORY_GENERATION_MAX_SAMPLES,
    buildMemoryBootstrapPrompt,
    buildMemoryOptimizePrompt,
    canGenerateMemoriesFromChats,
    canOptimizeMemories,
    getMemoryGenerationCutoff,
    getMemoryGenerationScanBoundary,
    memoriesFromContents,
    parseMemoryGenerationResponse,
    parseMemoryOptimizeResponse,
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
    const memories = useLumoSelector((state) => state.lumoUserSettings.memories);
    const lastProcessedMessageAt = useLumoSelector(
        (state) => state.lumoUserSettings.memoryLastProcessedMessageAt
    );
    const [isBootstrapping, setIsBootstrapping] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const optimizeAbortRef = useRef<AbortController | null>(null);

    const memoryGenerationCutoff = useMemo(
        () => getMemoryGenerationCutoff(lastProcessedMessageAt, memories ?? []),
        [lastProcessedMessageAt, memories]
    );
    const samplingOptions = useMemo(
        () => ({ hasLumoPlus, after: memoryGenerationCutoff }),
        [hasLumoPlus, memoryGenerationCutoff]
    );
    const promptSamples = useMemo(
        () => sampleUserPromptsForMemoryGeneration(messages, conversations, spaces, samplingOptions),
        [messages, conversations, spaces, samplingOptions]
    );
    const processedThrough = useMemo(
        () => getMemoryGenerationScanBoundary(messages, conversations, spaces, samplingOptions),
        [messages, conversations, spaces, samplingOptions]
    );

    const canGenerateFromChats = canGenerateMemoriesFromChats(promptSamples.length);

    const generateFromChats = useCallback(
        async (
            existingMemories: Memory[] = []
        ): Promise<{ generated: Memory[]; processedThrough: string }> => {
            if (!canGenerateFromChats) {
                throw new Error('Not enough chat history to generate memories');
            }
            if (!processedThrough) {
                throw new Error('No memory generation scan boundary');
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
                const parsed = parseMemoryGenerationResponse(response, existingMemories);
                if (parsed.status === 'invalid') {
                    throw new Error('Invalid memory generation response');
                }
                return {
                    generated: memoriesFromContents(parsed.memories, 'generated'),
                    processedThrough,
                };
            } finally {
                if (abortRef.current === controller) {
                    abortRef.current = null;
                }
                setIsBootstrapping(false);
            }
        },
        [api, canGenerateFromChats, processedThrough, promptSamples]
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
