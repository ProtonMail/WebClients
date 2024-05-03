import { getAssistantModels } from '@proton/llm/lib/api';
import { ASSISTANT_STATUS } from '@proton/llm/lib/constants';
import { checkGpu } from '@proton/llm/lib/hardware';
import { AssistantModel } from '@proton/llm/lib/types';
import { isChromiumBased, isFirefox, isMobile } from '@proton/shared/lib/helpers/browser';
import { Api, User } from '@proton/shared/lib/interfaces';
import { isPaid } from '@proton/shared/lib/user/helpers';

export const getAssistantHasCompatibleBrowser = () => {
    const isOnMobile = isMobile();
    const isUsingCompatibleBrowser = isChromiumBased() || isFirefox();
    return !isOnMobile && isUsingCompatibleBrowser;
};

export const getAssistantHasCompatibleHardware = async () => {
    const compatibility = await checkGpu();
    return compatibility === 'ok';
};

export const getCanShowAssistant = (assistantFeatureAvailable?: boolean) => {
    return !!assistantFeatureAvailable;
};

export const getCanUseAssistant = (user: User) => {
    // TODO improve this condition later
    return isPaid(user);
};

export const getAssistantStatus = ({
    isModelDownloading,
    isModelDownloaded,
    isModelLoadingOnGPU,
    isModelLoadedOnGPU,
}: {
    isModelDownloading: boolean;
    isModelDownloaded: boolean;
    isModelLoadingOnGPU: boolean;
    isModelLoadedOnGPU: boolean;
}): ASSISTANT_STATUS => {
    if (isModelDownloading) {
        return ASSISTANT_STATUS.DOWNLOADING;
    }
    if (isModelLoadingOnGPU) {
        return ASSISTANT_STATUS.LOADING_GPU;
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

export const queryAssistantModels = async (api: Api) => {
    const models = await api(getAssistantModels());
    return models.Models;
};

export const isIncompleteModelURL = (url: string) => {
    try {
        new URL(url);
        return false;
    } catch {
        return true;
    }
};

export const getModelURL = (url: string) => {
    // URL we get from the API can have different formats
    // 1- https://somedomain.com
    // 2- /somePath/ndarray-cache.json
    // In the second case, we are trying to reach an internal url. We can add the window origin to it.

    const isIncompleteURL = isIncompleteModelURL(url);
    if (isIncompleteURL) {
        return new URL(url, window.location.origin);
    }
    return url;
};

export const buildMLCConfig = (models: AssistantModel[]) => {
    // Get the model with the priority close to 0
    const model = models.reduce((acc, model) => {
        return acc.Priority < model.Priority ? acc : model;
    });

    if (model) {
        const modelURL = getModelURL(model.ModelURL).toString();
        // TODO need to do more for localhost, we want to access to http://localhost:8080/assets/ml-models/v0_2_30/Mistral-7B-Instruct-v0.2-q4f16_1-sw4k_cs1k-webgpu.wasm
        const modelLibURL = getModelURL(model.ModelLibURL).toString();

        return {
            model_list: [
                {
                    model_url: modelURL,
                    model_id: model.ModelID,
                    model_lib_url: modelLibURL,
                    vram_required_MB: model.VRAMRequiredMB,
                    low_resource_required: model.LowResourceRequired,
                    required_features: model.RequiredFeatures,
                },
            ],
            use_web_worker: true,
        };
    }
};
