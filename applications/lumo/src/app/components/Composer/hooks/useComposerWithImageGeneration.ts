import { type Dispatch, type SetStateAction, useCallback } from 'react';

import type { HandleSendMessage } from '../../../hooks/useLumoActions';
import type { ImageAspectRatio, ImageGenerationOptions } from '../../../types';
import { ComposerMode } from '../../../types';
import { useImageGenerationMode } from './useImageGenerationMode';
import { useNativeComposerAspectRatioApi } from './useNativeComposerAspectRatioApi';
import { useNativeComposerPromptApi } from './useNativeComposerPromptApi';

interface UseComposerImageGenerationParams {
    composerMode: ComposerMode;
    // The composer's real submit. The native bridge wraps this to inject imageOptions.
    handleSendMessage: HandleSendMessage;
    onAbort: () => void;
}

interface UseComposerImageGenerationResult {
    selectedAspectRatio: ImageAspectRatio;
    handleAspectRatioChange: (ratio: ImageAspectRatio) => void;
    isCreateImageMode: boolean;
    setIsCreateImageMode: Dispatch<SetStateAction<boolean>>;
    // Single source of truth for the outgoing image options, shared by the web submit
    // path and the native send bridge so they can never drift apart.
    buildImageOptions: () => ImageGenerationOptions | undefined;
}

/**
 * Facade over the composer's image-generation concerns: aspect-ratio / create-image
 * state, the native bridge that mirrors and toggles that state, and the native
 * send/abort bridge (which is here because it must inject the selected aspect ratio
 * into prompts sent from the mobile shells). Keeps this wiring out of ComposerComponent.
 */
export const useComposerWithImageGeneration = ({
    composerMode,
    handleSendMessage,
    onAbort,
}: UseComposerImageGenerationParams): UseComposerImageGenerationResult => {
    const { selectedAspectRatio, handleAspectRatioChange, isCreateImageMode, setIsCreateImageMode, getAspectRatio } =
        useImageGenerationMode();

    useNativeComposerAspectRatioApi(
        selectedAspectRatio,
        handleAspectRatioChange,
        isCreateImageMode,
        setIsCreateImageMode
    );

    const isImageGenerationMode = composerMode === ComposerMode.GALLERY || isCreateImageMode;

    const buildImageOptions = useCallback(
        // getAspectRatio is stable (useCallback with no deps), intentionally omitted
        () => (isImageGenerationMode ? { aspectRatio: getAspectRatio() } : undefined),
        [isImageGenerationMode]
    );

    // Native (mobile) send path. The native shells only carry `{ text, webSearchEnabled }`,
    // so we build `imageOptions` here — the same way the web submit does — so a prompt sent
    // from the native composer still carries the selected aspect ratio when in image mode.
    const handleNativeSendPrompt = useCallback<HandleSendMessage>(
        (messageContent, webSearchEnabled) => handleSendMessage(messageContent, webSearchEnabled, buildImageOptions()),
        [handleSendMessage, buildImageOptions]
    );

    useNativeComposerPromptApi(handleNativeSendPrompt, onAbort);

    return { selectedAspectRatio, handleAspectRatioChange, isCreateImageMode, setIsCreateImageMode, buildImageOptions };
};
