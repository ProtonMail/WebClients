import { isURLProtonInternal } from '@proton/components/helpers/url';
import { getAssistantModels } from '@proton/llm/lib/api';
import {
    ASSISTANT_CONTEXT_SIZE_LIMIT,
    GENERAL_STOP_STRINGS,
    STOP_STRINGS_WRITE_FULL_EMAIL,
    assistantAuthorizedApps,
} from '@proton/llm/lib/constants';
import type { TransformCallback } from '@proton/llm/lib/formatPrompt';
import { formatPromptCustomRefine } from '@proton/llm/lib/formatPrompt';
import type {
    Action,
    AssistantModel,
    CustomRefineAction,
    IframeToParentMessage,
    OpenedAssistant,
    OpenedAssistantStatus,
    ParentToIframeMessage,
} from '@proton/llm/lib/types';
import { isRefineActionType } from '@proton/llm/lib/types';
import { AssistantEvent } from '@proton/llm/lib/types';
import { GENERATION_TYPE, checkHardwareForAssistant } from '@proton/shared/lib/assistant';
import { isChromiumBased, isFirefox, isMobile } from '@proton/shared/lib/helpers/browser';
import { getApiSubdomainUrl } from '@proton/shared/lib/helpers/url';
import type { Api } from '@proton/shared/lib/interfaces';
import window from '@proton/shared/lib/window';

export const getAssistantHasCompatibleBrowser = () => {
    const isOnMobile = isMobile();
    const isUsingCompatibleBrowser = isChromiumBased() || isFirefox();
    return !isOnMobile && isUsingCompatibleBrowser;
};

export const getAssistantHasCompatibleHardware = async () => {
    const compatibility = await checkHardwareForAssistant();
    return compatibility;
};

export const getGenerationType = (action: Action) => {
    switch (action.type) {
        case 'writeFullEmail':
            return GENERATION_TYPE.WRITE_FULL_EMAIL;
        case 'customRefine':
            return GENERATION_TYPE.CUSTOM_REFINE;
        case 'proofread':
            return GENERATION_TYPE.PROOFREAD;
        case 'shorten':
            return GENERATION_TYPE.SHORTEN;
        case 'formal':
            return GENERATION_TYPE.FORMALIZE;
        case 'friendly':
            return GENERATION_TYPE.FRIENDLY;
        case 'expand':
            return GENERATION_TYPE.EXPAND;
        default:
            return GENERATION_TYPE.WRITE_FULL_EMAIL;
    }
};

export const getIsAssistantOpened = (openedAssistants: OpenedAssistant[], assistantID: string) => {
    return !!openedAssistants.find((assistant) => assistant.id === assistantID);
};

export const getHasAssistantStatus = (
    openedAssistants: OpenedAssistant[],
    assistantID: string,
    status: OpenedAssistantStatus
) => {
    return openedAssistants.find((assistant) => assistant.id === assistantID)?.status === status;
};

export const checkHarmful = (inputText: string) => {
    /* The LLM starts generation of a text with a "yes" or "no" token that answers the question
     * "Harmful? (yes/no):". Therefore the LLM is telling us the prompt is harmful iff the text begins with "yes".
     */
    return /^\s*yes/i.test(inputText);
};

export function removeStopStrings(text: string, customStopStrings?: string[]) {
    customStopStrings ||= [];
    const stopStrings = [...GENERAL_STOP_STRINGS, ...customStopStrings];
    const leftMostStopIdx: number | undefined = stopStrings
        .map((s) => text.indexOf(s))
        .filter((idx) => idx >= 0)
        .reduce((minIdx, idx) => (minIdx === undefined ? idx : Math.min(minIdx, idx)), undefined as number | undefined);
    if (leftMostStopIdx !== undefined) {
        text = text.slice(0, leftMostStopIdx);
    }
    return text;
}

export function convertToDoubleNewlines(input: string): string {
    const lines = input.split('\n');

    let paragraphs: string[][] = [];
    let paragraph: string[] = [];
    let inList = false; // we're currently in a list
    let listJustBegan = false; // marks that the next line will be a list

    for (let originalLine of lines) {
        const linePreserveStartSpace = originalLine.trimEnd();
        const line = originalLine.trim();
        if (!line) {
            paragraphs.push(paragraph);
            paragraph = [];
            continue;
        }
        const isListLine = /^(\d+[\.\)]|\-|\*|\•|[a-zA-Z][\.\)]) /.test(line);
        inList = isListLine || listJustBegan;
        if (!inList) {
            paragraphs.push(paragraph);
            paragraph = [];
        }
        paragraph.push(inList ? linePreserveStartSpace : line);
        listJustBegan = line.endsWith(':');
    }
    if (paragraph) {
        paragraphs.push(paragraph);
    }

    return paragraphs
        .map((lines) => lines.join('\n'))
        .join('\n\n')
        .replace(/\n{3,}/g, '\n\n');
}

export function removePartialEndsWith(s: string, target: string): string {
    const n = target.length;
    if (n === 0) {
        return s;
    }
    for (let i = 1; i < n - 1; i++) {
        const subtarget = target.slice(0, i);
        if (s.endsWith(subtarget)) {
            s = s.slice(0, s.length - subtarget.length);
            break;
        }
    }
    return s;
}

export const makeTransformWriteFullEmail = (senderName?: string): TransformCallback => {
    return (inputText: string): string | undefined => {
        /* The LLM generates text that contains extraneous data, such as:
         *
         *   - a token to tell if the prompt was harmful (yes/no)
         *   - a subject (we drop it)
         *   - a prefix "Body:" (we drop it)
         *   - a signature "[Your Name]" (we replace it with the sender name)
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
            return undefined;
        }

        // Remove stop strings and anything that come after.
        text = removeStopStrings(text, STOP_STRINGS_WRITE_FULL_EMAIL);

        // Split lines
        let lines = text.split('\n');
        lines = lines.map((line) => line.trim());

        // The LLM first line should be the reply to the harmful prompt ("no" or "No")
        // We drop this answer since it's not part of the actual email we want to generate.
        lines = lines.filter((_line, i) => i !== 0);

        // Drop the subject.
        // The LLM often wants to generate a subject line before the email content. We're not using it at
        // the moment, so we just get rid of this line altogether.
        lines = lines.filter((line) => !line.startsWith('Subject'));
        // Do not show a partially generated line, like "Subj"
        lines = lines.filter((line, i) => !isLast(i, lines) || !'Subject'.startsWith(line));

        // Drop the "Body:" prefix, but keep the rest of the line.
        // Do not show a partially generated line, like "Bo"
        lines = lines.filter((line, i) => !isLast(i, lines) || !'Body:'.startsWith(line));
        lines = lines.map((line) => line.replace(/^Body:\s*/, ''));

        // Drop spaces at the beginning of lines (not sure why it happens, but it does).
        lines = lines.map((line) => line.replace(/^ +/, ''));

        // Join back the lines into a string. We set newlines to 2 between paragraphs.
        let outputText = lines.join('\n').trim();
        outputText = convertToDoubleNewlines(outputText);
        outputText = outputText.trim();

        // Replace in-line instances of "[Your Name]" with the sender name.
        senderName = senderName?.trim();
        if (senderName) {
            outputText = outputText.replaceAll('[Your Name]', senderName);
            // Hide a partial string like "[Your".
            outputText = removePartialEndsWith(outputText, '[Your Name]');
        }

        return outputText;
    };
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

        var modelLibURL = getModelURL(model.ModelLibURL).toString();
        if (window.origin.includes('localhost')) {
            // The line below forces web-llm to grab the wasm from the cache (where we carefully placed it)
            // instead of fetching it itself. See:
            //   https://github.com/mlc-ai/web-llm/blob/bd2409c37af793bc7bc51e49ccec40553976d136/src/engine.ts#L145
            modelLibURL = modelLibURL.replace('localhost', 'LOCALHOST');
        }

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
    return isValidURL && event.data && Object.values(AssistantEvent).includes(event.data.type);
};

// Function used to post messages to the assistant iframe
export const postMessageParentToIframe = (message: ParentToIframeMessage) => {
    const iframe = document.querySelector('[id^=assistant-iframe]') as HTMLIFrameElement | null;
    const assistantURL = getAssistantIframeURL();
    iframe?.contentWindow?.postMessage(message, assistantURL);
};

// Function used to post messages to the assistant iframe parent app
export const postMessageIframeToParent = (
    message: IframeToParentMessage,
    parentURL: string,
    arrayBuffers?: ArrayBuffer[]
) => {
    window.parent?.postMessage(message, parentURL, arrayBuffers || undefined);
};

/* Model is not working well with more than ~10k chars. To avoid having users facing too many issues when sending
 * a prompt that is too big, we want to limit the prompt that we send to the model to 10k chars.
 * What we send to the model, the "full prompt" contains:
 * 1- The full message body, if any, when trying to refine a message
 * 2- The user prompt, if any
 * 3- The "system" instructions (where we say you're an assistant generating emails, etc...)
 * 4- In case of a selection refine, we have to trick the model. We are passing again the content that is before the selection,
 *      so that he does not generate it again
 *
 * Because of all of this, we can compute the "full prompt" only when submitting a request.
 */
export const isPromptSizeValid = (action: Action) => {
    if (isRefineActionType(action.type)) {
        const modelPrompt = formatPromptCustomRefine(action as CustomRefineAction);
        return modelPrompt.length < ASSISTANT_CONTEXT_SIZE_LIMIT;
    }
    return true;
};
