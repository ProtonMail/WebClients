import { isURLProtonInternal } from '@proton/components/helpers/url';
import { getAssistantModels } from '@proton/llm/lib/api';
import { ASSISTANT_STATUS, assistantAuthorizedApps } from '@proton/llm/lib/constants';
import { checkGpu } from '@proton/llm/lib/hardware';
import { ASSISTANT_ACTION, ASSISTANT_EVENTS, AssistantModel } from '@proton/llm/lib/types';
import { isChromiumBased, isFirefox, isMobile } from '@proton/shared/lib/helpers/browser';
import { getApiSubdomainUrl } from '@proton/shared/lib/helpers/url';
import { Api, User } from '@proton/shared/lib/interfaces';
import { isPaid } from '@proton/shared/lib/user/helpers';
import window from '@proton/shared/lib/window';

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
        /**
         * The api return us the ModelURL which contains the url on which we will download the model => https://huggingface.co/mlc-ai/Mistral-7B-Instruct-v0.2-q4f16_1-MLC/resolve/main/
         * However, in we want to store files in the cache using the current url.
         * So we need to build the model_url in the assistant configuration with the same format https://mail.proton.me/mlc-ai/Mistral-7B-Instruct-v0.2-q4f16_1-MLC/resolve/main/
         */
        const modelURLDownloadURL = getModelURL(model.ModelURL).toString();
        // TODO need to do more for localhost, we want to access to http://localhost:8080/assets/ml-models/v0_2_30/Mistral-7B-Instruct-v0.2-q4f16_1-sw4k_cs1k-webgpu.wasm
        const modelLibURL = getModelURL(model.ModelLibURL).toString();
        // compute the model url with the needed format https://mail.proton.me/mlc-ai/Mistral-7B-Instruct-v0.2-q4f16_1-MLC/resolve/main/
        const modelURL = `${window.origin}${new URL(modelURLDownloadURL).pathname}`;

        return {
            model_list: [
                {
                    model_url: `${window.origin}${new URL(modelURL).pathname}`,
                    model_download_url: modelURLDownloadURL,
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

export const getAssistantIframeURL = () => {
    // If running the assistant iframe in localhost, use this instead:
    // return new URL('https://localhost:5173').toString();

    // Else, forge the url on which the iframe html is available
    return getApiSubdomainUrl('/mail/v4/ai-assistant', window.location.origin).toString();
};

// Function used to validate events coming from the iframe. Are we actually receiving event from the assistant iframe?
const isAuthorizedIframeAssistantURL = (url: string, hostname: string) => {
    try {
        const iframeURLString = getAssistantIframeURL();

        const iframeURL = new URL(iframeURLString);
        const incomingURL = new URL(url);

        return isURLProtonInternal(url, hostname) && incomingURL.hostname === iframeURL.hostname;
    } catch {
        return false;
    }
};

// Function used to validate events coming from iframe parent apps. Are we actually receiving event from authorized apps?
const isAuthorizedAssistantAppURL = (url: string, hostname: string) => {
    try {
        const originURL = new URL(url);

        // Get subdomain of the url => e.g. mail, calendar, drive
        const appFromUrl = originURL.hostname.split('.')[0];

        // In localhost, allow the app to send events to the iframe
        if (originURL.hostname === 'localhost') {
            return true;
        }

        // Else, check that
        // - The app url is internal
        // - The app sending an event is an authorized app
        return isURLProtonInternal(url, hostname) && assistantAuthorizedApps.includes(appFromUrl);
    } catch {
        return false;
    }
};

// Function used to validate events assistant events
export const isAssistantPostMessage = (event: MessageEvent, hostname = window.location.hostname) => {
    const origin = event.origin;

    if (!origin || origin === 'null') {
        return false;
    }

    const isIframeURL = isAuthorizedIframeAssistantURL(origin, hostname);
    const isAssistantAppURL = isAuthorizedAssistantAppURL(origin, hostname);
    const isValidURL = isIframeURL || isAssistantAppURL;

    // Check that the assistant event is a valid event based on
    // - The url of the event origin, is it an authorized url?
    // - Does the event contain a valid `ASSISTANT_EVENTS`
    return isValidURL && event.data && Object.values(ASSISTANT_EVENTS).includes(event.data.type);
};

// Function used to post messages to the assistant iframe
export const postMessageToAssistantIframe = (message: ASSISTANT_ACTION) => {
    const iframe = document.querySelector('[id^=assistant-iframe]') as HTMLIFrameElement | null;
    const assistantURL = getAssistantIframeURL();
    iframe?.contentWindow?.postMessage(message, assistantURL);
};

// Function used to post messages to the assistant iframe parent app
export const postMessageToAssistantParent = (
    message: ASSISTANT_ACTION,
    parentURL: string,
    arrayBuffers?: ArrayBuffer[]
) => {
    if (arrayBuffers) {
        window.parent?.postMessage(message, parentURL, arrayBuffers);
    } else {
        window.parent?.postMessage(message, parentURL);
    }
};
