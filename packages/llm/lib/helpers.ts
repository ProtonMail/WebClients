import {isChromiumBased, isFirefox, isMobile} from "@proton/shared/lib/helpers/browser";
import {ASSISTANT_STATUS} from "@proton/llm/lib/constants";

export const getCanRunAssistant = () => {
    const isOnMobile = isMobile();
    const isUsingCompatibleBrowser = isChromiumBased() || isFirefox();
    return !isOnMobile && isUsingCompatibleBrowser;
};

export const getHasAccessToAssistant = (assistantFeatureAvailable?: boolean) => {
    return !!assistantFeatureAvailable;
};

export const getAssistantStatus = ({
                                isModelDownloading,
                                isModelDownloaded,
                                isModelLoadingOnGPU,
                                isModelLoadedOnGPU,
                                isGeneratingResult,
                            }: {
    isModelDownloading: boolean;
    isModelDownloaded: boolean;
    isModelLoadingOnGPU: boolean;
    isModelLoadedOnGPU: boolean;
    isGeneratingResult: boolean;
}): ASSISTANT_STATUS => {
    if (isModelDownloading) {
        return ASSISTANT_STATUS.DOWNLOADING;
    }
    if (isModelLoadingOnGPU) {
        return ASSISTANT_STATUS.LOADING_GPU;
    }
    if (isGeneratingResult) {
        return ASSISTANT_STATUS.GENERATING;
    }
    if (isModelLoadedOnGPU) {
        return ASSISTANT_STATUS.READY;
    }
    if (isModelDownloaded) {
        return ASSISTANT_STATUS.DOWNLOADED;
    }

    return ASSISTANT_STATUS.NOT_LOADED;
};

export const cleanAssistantEmailGeneration = (inputText: string) => {
    /* Assistant often generates content with a subject and a body with the following format
     *
     *      Subject: email subject
     *      Body: some text
     *
     *      some other text
     *
     * We need to clean this in order to display the correct content to the user
     */
    let text = inputText
        .split('\n')
        .filter((line) => !line.startsWith('Subject:'))
        .join('\n')
        .trim();
    if (text.startsWith('Body:')) {
        text = text.substring('Body:'.length).trim();
    }
    return text;
};
