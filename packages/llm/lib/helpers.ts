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

export const checkHarmful = (inputText: string) => {
    /* The LLM starts generation of a text with a "yes" or "no" token that answers the question
     * "Harmful? (yes/no):". Therefore the LLM is telling us the prompt is harmful iff the text begins with "yes".
     */
    return /^\s*yes/i.test(inputText);
};

export const cleanAssistantEmailGeneration = (inputText: string) => {
    /* The LLM generates text that contains extraneous data, such as:
     *
     *   - a token to tell if the prompt was harmful (yes/no)
     *   - a subject (we drop it)
     *   - a prefix "Body:" (we drop it)
     *   - a signature "[Your Name]" (we drop it)
     *
     * This method preprocesses the LLM generated text and return only the extracted email content without
     * the extraneous text.
     */

    function isLast(i: number, lines: any[]) {
        return i + 1 === lines.length;
    }

    let text = inputText.trim();

    // The LLM begins with an answer to the question: "Harmful? (yes/no):"
    // If the prompt is harmful, we do not let the text pass through.
    if (text.toLowerCase().startsWith('yes')) {
        return '[Rejected]';
    }

    // Split lines
    let lines = text.split('\n');
    lines = lines.map((line) => line.trim());

    // The LLM should have replied "no" to the harmful prompt.
    // We drop this answer since it's not part of the actual email we want to generate.
    lines = lines.filter((line, i) => i > 0 || line !== 'no');

    // Drop the subject.
    // The LLM often wants to generates a subject line before the email content. We're not using it at
    // the moment, so we just get rid of this line altogether.
    lines = lines.filter((line) => !line.startsWith('Subject:'));
    // Do not show a partially generated line, like "Subj"
    lines = lines.filter((line, i) => !isLast(i, lines) || !'Subject:'.startsWith(line));

    // Drop the signature.
    // It's very difficult to ask the LLM to **not sign**, but dropping [Your Name] seems to work better, so
    // in the instructions, we ask explicitly the LLM to sign with "[Your Name]" so we can look for it
    // and remove it.
    lines = lines.filter((line) => !line.startsWith('[Your Name]'));
    // Do not show a partially generated line, like "[", "[Your", "[Your Name"
    lines = lines.filter((line, i) => !isLast(i, lines) || !'[Your Name]'.startsWith(line));

    // Drop the "Body:" prefix, but keep the rest of the line.
    // Do not show a partially generated line, like "Bo"
    lines = lines.filter((line, i) => !isLast(i, lines) || !'Body:'.startsWith(line));
    lines = lines.map((line) => line.replace(/^Body:\s*/, ''));

    // Drop spaces at the beginning of lines (not sure why it happens, but it does).
    lines = lines.map((line) => line.replace(/^ +/, ''));

    // Join back the lines into a string. If some lines have been removed, we collapse the newlines to 2 max.
    const outputText = lines
        .join('\n')
        .replaceAll(/\n{3,}/g, '\n\n')
        .trim();
    return outputText;
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

export class PromptRejectedError extends Error {
    constructor() {
        super();
        this.name = 'PromptRejectedError';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, PromptRejectedError);
        }
    }
}
