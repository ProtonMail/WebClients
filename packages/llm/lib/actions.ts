import '@mlc-ai/web-llm';
import { ChatOptions, WebWorkerEngine } from '@mlc-ai/web-llm';

import {
    GENERAL_STOP_STRINGS,
    IFRAME_COMMUNICATION_TIMEOUT,
    STOP_STRINGS_REFINE,
    STOP_STRINGS_WRITE_FULL_EMAIL,
} from './constants';
import { AppCaches, CacheId, getCachedFiles, storeInCache } from './downloader';
import {
    convertToDoubleNewlines,
    isAssistantPostMessage,
    postMessageParentToIframe,
    removeStopStrings,
    validateAndCleanupWriteFullEmail,
} from './helpers';
import { BaseRunningAction } from './runningAction';
import type {
    Action,
    AssistantConfig,
    CustomRefineAction,
    DownloadProgressCallback,
    ExpandAction,
    FormalAction,
    FriendlyAction,
    GenerationCallback,
    GenerationCallbackDetails,
    LlmManager,
    LlmModel,
    ProofreadAction,
    RunningAction,
    ShortenAction,
    WriteFullEmailAction,
} from './types';
import { AssistantEvent } from './types';

const INSTRUCTIONS_WRITE_FULL_EMAIL = [
    "You're a harmless email generator. The user asks you to write emails, and you write emails that they can send.",
    "You're given a list of toxic content categories as below:",
    '- illegal',
    '- child abuse: child sexual abuse material or any content that exploits or harms children.',
    '- adult: adult content, adult industries, and dating apps.',
    '- malicious attachments/URLs or malware: including dangerous files, links or virus.',
    '- fraud: fraudulent or deceptive activity.',
    '- impersonation: impersonating others.',
    "- privacy invasion: requesting unnecessary personal information or activity that violates people's privacy.",
    '- political: political campaigning or lobbying.',
    '- phishing instructions: guidance on sharing sensitive information via email or links; ' +
        'promote secure data sharing methods.',
    '- spam: containing unwanted ads, promotional material or trying to sell products.',
    '- bomb threats',
    '- harassment or threats: intimidating, bullying, hateful, harassing, violent or derogatory messages.',
    '- inappropriate/offensive content: containing hate speech, sexual content, or objectionable material.',
    '- unverified content: misinformation, misleading information, unconfirmed claims or fake news.',
    '- false promises: unrealistic offers or guarantees.',
    'Please check if the description provided by the user falls within one of these categories.',
    'If the answer is yes, it\'s toxic and harmful, please answer "Harmful (yes/no): yes" and cease.',
    [
        'If the answer is no, please answer "Harmful (yes/no): no" and then start a complete email message with',
        '"Body:", following the user\'s request.',
        'You do not use emojis.',
        'There should be no subject, directly write the body of the message.',
        'You sign as "[Your Name]".',
        'The email you write is meant to be sent by the user.',
        'Given the user prompt, figure out if the instructions are for you (as an assistant) to write the message' +
            '(e.g. "ask", "invite"...)',
        'or if the user prompt is simply a short version of an email you must write: make the best decision.',
        'Be mindful to direct the message to the recipient as indicated by the user.',
        'Match the style and tone of the email (friendly, formal, tu/vous, etc)',
        'with the type of relationship the user is likely to have with the recipient.',
        'Who is the recipient? Write their name in the opening.',
    ].join(' '),
].join('\n');

const INSTRUCTIONS_WRITE_FULL_EMAIL_USER_POSTFIX = '(write the email in the language of the previous sentence)';

const HARMFUL_CHECK_PREFIX = 'Harmful (yes/no): ';

const INSTRUCTIONS_SHORTEN = [
    "Now, you shorten the part of the email that's in the the input below, in the same language.",
    'Only summarize the part below and do not add anything else.',
].join(' ');

const INSTRUCTIONS_REFINE_SPAN = [
    'The user wants you to modify a part of the text identified by the span tags (class "to-modify").',
    'You write a revised version of this part of the text, in the same language, under a span tag with class "modified".',
    "If the user's request is unethical or harmful, you do not replace the part to modify.",
].join(' ');
const INSTRUCTIONS_REFINE_DIV = [
    'The user wants you to modify a part of the text identified by the div tags (class "to-modify").',
    'You write a revised version of this part of the text, in the same language, under a div tag with class "modified".',
    'Write the rest of the email outside of the div tag.',
    "If the user's request is unethical or harmful, you do not replace the part to modify.",
].join(' ');
const INSTRUCTIONS_REFINE_WHOLE = [
    'The user wants you to modify the email.',
    'You write a revised version of this email, in the same language.',
    "If the user's request is unethical or harmful, you do not replace the part to modify.",
].join(' ');

let INSTRUCTIONS_REFINE_USER_PREFIX_SPAN =
    'In the span that has the class "modified", please do the following changes but keep the language unchanged: ';
let INSTRUCTIONS_REFINE_USER_PREFIX_DIV =
    'In the div that has the class "modified", please do the following changes but keep the language unchanged: ';
let INSTRUCTIONS_REFINE_USER_PREFIX_WHOLE = 'Please do the following changes but keep the language unchanged: ';

const MODEL_VARIANT = 'Mistral-7B-Instruct-v0.2-q4f16_1';

async function delay(time: number) {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(time);
}

function removePartialSubstringAtEnd(s: string, end: string): string {
    const n = end.length;
    for (let i = 1; i < n; i++) {
        const lookup = end.slice(0, i);
        if (s.endsWith(lookup)) {
            return s.slice(0, -lookup.length);
        }
    }
    return s;
}

type Turn = {
    role: string;
    contents?: string;
};

// A function that processes raw LLM output and returns either:
//   - a string: this is the clean result, ok to display to the user.
//   - undefined: the prompt is detected as harmful and the user should be warned.
export type TransformCallback = (rawResponse: string) => string | undefined;

export type ServerAssistantInteraction = {
    rawLlmPrompt: string;
    transformCallback: TransformCallback;
    stopStrings?: string[];
};

const genericCleanup: TransformCallback = (fulltext: string) => {
    let fulltext2 = fulltext;
    fulltext2 = removeStopStrings(fulltext2);
    fulltext2 = fulltext2.replaceAll(/<\/?[a-z][^>]*>/gi, '');
    fulltext2 = convertToDoubleNewlines(fulltext2);
    fulltext2 = fulltext2.trim();
    fulltext2 = removePartialSubstringAtEnd(fulltext2, '</span>');
    return fulltext2.trimEnd();
};

function proofreadActionToCustomRefineAction(action: ProofreadAction): CustomRefineAction {
    return {
        ...action,
        type: 'customRefine',
        prompt: 'Fix any spelling or grammatical errors. Keep correct text otherwise unchanged.',
    };
}

function formalActionToCustomRefineAction(action: FormalAction): CustomRefineAction {
    return {
        ...action,
        type: 'customRefine',
        prompt: 'Rewrite the same text with a very formal tone, adapted to a corporate or business setting.',
    };
}

function friendlyActionToCustomRefineAction(action: FriendlyAction): CustomRefineAction {
    return {
        ...action,
        type: 'customRefine',
        prompt: 'Rewrite the same text with a friendly tone, like writing to a friend.',
    };
}

function expandActionToCustomRefineAction(action: ExpandAction): CustomRefineAction {
    return {
        ...action,
        type: 'customRefine',
        prompt: 'Expand the text, i.e. paraphrase it, and use more words to say the same thing.',
    };
}

function makePromptFromTurns(turns: Turn[]): string {
    return turns
        .map((turn) => {
            let contents = turn.contents || '';
            let oldContents;
            do {
                oldContents = contents;
                contents = contents
                    .replaceAll(/<\|[^<>|]+\|>/g, '') // remove <|...|> markers
                    .replaceAll(/<\||\|>/g, '') // remove <| and |>
                    .trim();
            } while (contents != oldContents);
            return `<|${turn.role}|>\n${contents}`;
        })
        .join('\n\n');
}

function formatPromptShorten(action: ShortenAction): string {
    // todo rework this to follow the custom refine prompt format
    const partToRephrase = action.fullEmail.slice(action.idxStart, action.idxEnd);
    const prompt = makePromptFromTurns([
        {
            role: 'system',
            contents: INSTRUCTIONS_WRITE_FULL_EMAIL,
        },
        {
            role: 'email',
            contents: action.fullEmail,
        },
        {
            role: 'system',
            contents: INSTRUCTIONS_SHORTEN,
        },
        {
            role: 'long_part',
            contents: partToRephrase,
        },
        {
            role: 'short_part',
        },
    ]);
    return prompt;
}

function formatPromptWriteFullEmail(action: WriteFullEmailAction): string {
    return makePromptFromTurns([
        {
            role: 'instructions',
            contents: INSTRUCTIONS_WRITE_FULL_EMAIL,
        },
        {
            role: 'user',
            contents: `${action.prompt} ${INSTRUCTIONS_WRITE_FULL_EMAIL_USER_POSTFIX}`,
        },
        {
            role: 'assistant',
            contents: HARMFUL_CHECK_PREFIX,
        },
    ]);
}

type SelectionSplitInfo = {
    pre: string;
    mid: string;
    end: string;
    isParagraph: boolean;
    isEntireEmail: boolean;
};

function splitSelection(action: CustomRefineAction): SelectionSplitInfo {
    const pre = action.fullEmail.slice(0, action.idxStart);
    const mid = action.fullEmail.slice(action.idxStart, action.idxEnd);
    const end = action.fullEmail.slice(action.idxEnd);
    const newlinesAtEndOfPre = pre.endsWith('\n\n') ? 2 : pre.endsWith('\n') ? 1 : 0;
    const newlinesAtStartOfMid = mid.startsWith('\n\n') ? 2 : mid.startsWith('\n') ? 1 : 0;
    const newlinesAtEndOfMid = mid.endsWith('\n\n') ? 2 : mid.endsWith('\n') ? 1 : 0;
    const newlinesAtStartOfEnd = end.startsWith('\n\n') ? 2 : end.startsWith('\n') ? 1 : 0;
    const newlinesBefore = newlinesAtEndOfPre + newlinesAtStartOfMid;
    const newlinesAfter = newlinesAtEndOfMid + newlinesAtStartOfEnd;
    const isParagraph = newlinesBefore >= 2 && newlinesAfter >= 2;
    const isEntireEmail = pre.trim() === '' && end.trim() === '';
    return { pre, mid, end, isParagraph, isEntireEmail };
}

function formatPromptCustomRefine(action: CustomRefineAction): string {
    const { pre, mid, end, isParagraph, isEntireEmail } = splitSelection(action);

    let oldEmail: string;
    let system: string;
    let user: string;
    let newEmailStart: string;

    if (isEntireEmail) {
        oldEmail = mid.trim();
        system = INSTRUCTIONS_REFINE_WHOLE;
        user = `${INSTRUCTIONS_REFINE_USER_PREFIX_WHOLE}${action.prompt}`;
        newEmailStart = '';
    } else if (isParagraph) {
        oldEmail = `${pre.trim()}\n\n<div class="to-modify">\n${mid.trim()}\n</div>\n\n${end.trim()}`;
        newEmailStart = `${pre.trim()}\n\n<div class="modified">\n`;
        user = `${INSTRUCTIONS_REFINE_USER_PREFIX_DIV}${action.prompt}`;
        system = INSTRUCTIONS_REFINE_DIV;
    } else {
        oldEmail = `${pre}<span class="to-modify"> ${mid}</span>${end}`;
        newEmailStart = `${pre}<span class="modified">`;
        user = `${INSTRUCTIONS_REFINE_USER_PREFIX_SPAN}${action.prompt}`;
        system = INSTRUCTIONS_REFINE_SPAN;
    }

    const turns = [
        {
            role: 'email',
            contents: oldEmail,
        },
        {
            role: 'system',
            contents: system,
        },
        {
            role: 'user',
            contents: user,
        },
        {
            role: 'email',
            contents: newEmailStart,
        },
    ];

    const prompt = makePromptFromTurns(turns);
    return prompt;
}

function formatPromptProofread(action: ProofreadAction): string {
    return formatPromptCustomRefine(proofreadActionToCustomRefineAction(action));
}

function formatPromptFormal(action: FormalAction): string {
    return formatPromptCustomRefine(formalActionToCustomRefineAction(action));
}

function formatPromptFriendly(action: FriendlyAction): string {
    return formatPromptCustomRefine(friendlyActionToCustomRefineAction(action));
}

function formatPromptExpand(action: ExpandAction): string {
    return formatPromptCustomRefine(expandActionToCustomRefineAction(action));
}

export class GpuWriteFullEmailRunningAction extends BaseRunningAction {
    constructor(action: WriteFullEmailAction, chat: WebWorkerEngine, callback: GenerationCallback) {
        const prompt = formatPromptWriteFullEmail(action);
        super(prompt, callback, chat, action);
    }
}

export class GpuShortenRunningAction extends BaseRunningAction {
    constructor(action: ShortenAction, chat: WebWorkerEngine, callback: GenerationCallback) {
        const prompt = formatPromptShorten(action);
        super(prompt, callback, chat, action);
    }
}

export class GpuRefineRunningAction extends BaseRunningAction {
    constructor(action: CustomRefineAction, chat: WebWorkerEngine, callback: GenerationCallback) {
        const prompt = formatPromptCustomRefine(action);
        const wrappedCallback: GenerationCallback = (fulltext: string, details?: GenerationCallbackDetails) => {
            let cleaned = genericCleanup(fulltext);
            return callback(cleaned || '', details);
        };
        super(prompt, wrappedCallback, chat, action, ['</span>']);
    }
}

export class GpuProofreadRunningAction extends GpuRefineRunningAction {
    constructor(action: ProofreadAction, chat: WebWorkerEngine, callback: GenerationCallback) {
        const refineAction = proofreadActionToCustomRefineAction(action);
        super(refineAction, chat, callback);
    }
}

export class GpuFormalRunningAction extends GpuRefineRunningAction {
    constructor(action: FormalAction, chat: WebWorkerEngine, callback: GenerationCallback) {
        const refineAction = formalActionToCustomRefineAction(action);
        super(refineAction, chat, callback);
    }
}

export class GpuFriendlyRunningAction extends GpuRefineRunningAction {
    constructor(action: FriendlyAction, chat: WebWorkerEngine, callback: GenerationCallback) {
        const refineAction = friendlyActionToCustomRefineAction(action);
        super(refineAction, chat, callback);
    }
}

export class GpuExpandRunningAction extends GpuRefineRunningAction {
    constructor(action: ExpandAction, chat: WebWorkerEngine, callback: GenerationCallback) {
        const refineAction = expandActionToCustomRefineAction(action);
        super(refineAction, chat, callback);
    }
}

export class GpuLlmModel implements LlmModel {
    private chat: WebWorkerEngine;

    private manager: GpuLlmManager;

    constructor(chat: WebWorkerEngine, manager: GpuLlmManager) {
        this.chat = chat;
        this.manager = manager;
    }

    async unload(): Promise<void> {
        await this.chat.unload();
        this.manager.unload();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async performAction(action: Action, callback: GenerationCallback): Promise<RunningAction> {
        switch (action.type) {
            case 'writeFullEmail':
                return new GpuWriteFullEmailRunningAction(action, this.chat, callback);
            case 'shorten':
                return new GpuShortenRunningAction(action, this.chat, callback);
            case 'proofread':
                return new GpuProofreadRunningAction(action, this.chat, callback);
            case 'formal':
                return new GpuFormalRunningAction(action, this.chat, callback);
            case 'friendly':
                return new GpuFriendlyRunningAction(action, this.chat, callback);
            case 'expand':
                return new GpuExpandRunningAction(action, this.chat, callback);
            case 'customRefine':
                return new GpuRefineRunningAction(action, this.chat, callback);
            default:
                throw Error('unimplemented');
        }
    }
}

export class GpuLlmManager implements LlmManager {
    private chat: WebWorkerEngine | undefined;

    private status: undefined | 'downloading' | 'loading' | 'loaded' | 'unloaded' | 'error';

    private model: GpuLlmModel | undefined; // defined if status === 'loaded'

    constructor() {
        this.chat = undefined;
        this.status = undefined;
    }

    isDownloading(): boolean {
        return this.status === 'downloading';
    }

    async startDownload(updateProgress: DownloadProgressCallback, assistantConfig: AssistantConfig): Promise<boolean> {
        this.status = 'downloading';
        const promises: Promise<void>[] = [];
        let appCaches: AppCaches;
        let downloadPromiseResolve: (value: boolean | PromiseLike<boolean>) => void;
        let downloadPromiseReject: (reason?: any) => void;
        let pingIframeTimeout: ReturnType<typeof setTimeout> | undefined;

        const handleReceived = async (event: MessageEvent) => {
            if (!isAssistantPostMessage(event)) {
                return;
            }

            switch (event.data.type) {
                case AssistantEvent.IFRAME_READY:
                    {
                        // Clear timeout if we received an event from the iframe
                        if (pingIframeTimeout) {
                            clearTimeout(pingIframeTimeout);
                        }
                    }
                    break;
                case AssistantEvent.DOWNLOAD_PROGRESS:
                    {
                        // Call the download callback when receiving progress updates
                        const { progress } = event.data.payload;
                        updateProgress(progress);
                    }
                    break;
                case AssistantEvent.DOWNLOAD_DATA:
                    {
                        // Get downloaded data from the iframe and store it in the cache
                        const { downloadResult, cacheUrl, cacheId, expectedMd5, terminate } = event.data.payload;

                        if (appCaches) {
                            const destinationCache = appCaches[cacheId as CacheId];
                            const promise = storeInCache(downloadResult, cacheUrl, destinationCache, expectedMd5);
                            promises.push(promise);

                            // Resolve the promise when receiving the last file
                            if (terminate) {
                                this.status = 'unloaded';
                                await Promise.all(promises);
                                downloadPromiseResolve(true);
                            }
                        }
                    }
                    break;
                case AssistantEvent.DOWNLOAD_ERROR:
                    {
                        const { error } = event.data.payload;

                        if (typeof error === 'object' && error.name === 'AbortError') {
                            // user aborted, and it was successful
                            this.status = undefined;
                            downloadPromiseResolve(false);
                        } else {
                            console.error(error);
                            this.status = 'error';
                            downloadPromiseReject(error);
                        }
                    }
                    break;
            }
        };

        // Creating a promise so that we can wait for the entire downloading process to be complete on the iframe side before
        // ending this function.
        const downloadPromise = await new Promise<boolean>(async (resolve, reject) => {
            downloadPromiseResolve = resolve;
            downloadPromiseReject = reject;
            try {
                // Search for files already present in the cache, download the ones that are not downloaded yet
                const modelVariant = assistantConfig.model_list[0].model_id;
                const {
                    filesAlreadyDownloaded,
                    needsAdditionalDownload,
                    appCaches: currentAppCaches,
                } = await getCachedFiles(modelVariant, assistantConfig);

                appCaches = currentAppCaches;

                // Post message to the iframe if we need to download some files
                if (needsAdditionalDownload) {
                    window.addEventListener('message', handleReceived);

                    postMessageParentToIframe({
                        type: AssistantEvent.START_DOWNLOAD,
                        payload: {
                            config: assistantConfig,
                            modelVariant,
                            filesToIgnore: filesAlreadyDownloaded,
                        },
                    });

                    // Set a timeout that will reject the promise in case the communication with the iframe fails
                    pingIframeTimeout = setTimeout(() => {
                        reject(new Error('Assistant iframe request timeout'));
                    }, IFRAME_COMMUNICATION_TIMEOUT);
                }

                // Resolve the promise if all files are already cached
                if (!needsAdditionalDownload) {
                    this.status = 'unloaded';
                    await Promise.all(promises);
                    resolve(true);
                }
            } catch (e: any) {
                console.error(e);
                this.status = 'error';
                reject(e);
            }
        }).finally(() => {
            window.removeEventListener('message', handleReceived);
        });

        return downloadPromise;
    }

    private async startMlcEngine(assistantConfig: AssistantConfig) {
        try {
            // Create Web-LLM worker
            if (!this.chat) {
                let worker = new Worker(new URL('./worker', import.meta.url), { type: 'module' });
                this.chat = new WebWorkerEngine(worker);
            }

            // Call `reload` on the engine. If all the files are in place,
            // this should go straight to loading the model on GPU without downloading.
            this.status = 'loading';
            const chatOpts: ChatOptions = {
                conv_template: 'empty',
                conv_config: {
                    stop_str: GENERAL_STOP_STRINGS,
                    stop_token_ids: [2],
                    role_empty_sep: ' ',
                },
            };
            await this.chat.reload(MODEL_VARIANT, chatOpts, assistantConfig);
            this.model = new GpuLlmModel(this.chat, this);
            this.status = 'loaded';
        } catch (e) {
            // todo: check if the error is about webgpu, and throw a more specific error in this case
            /* eslint-disable-next-line no-console */
            console.error(e);
            this.status = 'error';
            throw e;
        }
    }

    cancelDownload() {
        postMessageParentToIframe({
            type: AssistantEvent.PAUSE_DOWNLOAD,
        });
    }

    async loadOnGpu(assistantConfig: AssistantConfig): Promise<LlmModel> {
        if (this.status === undefined) {
            throw Error('model is not downloaded, run startDownload() first');
        }
        if (this.status === 'downloading') {
            throw Error('model is downloading, try again after download is complete');
        }
        if (this.status === 'unloaded') {
            // MLC will skip the download and go straight to loading on GPU
            await this.startMlcEngine(assistantConfig);
            // @ts-ignore: TS does not see that the line above will modify `this.status`
            if (this.status !== 'loaded') {
                throw Error('error while waiting for model to load on GPU');
            }
        }
        if (this.status === 'loading') {
            // wait for the model to be loaded
            while (true) {
                await delay(500);
                if (this.status !== 'loading') {
                    break;
                }
            }
            if (this.status !== 'loaded') {
                throw Error('error while waiting for model to load on GPU');
            }
        }
        if (this.status === 'loaded') {
            return this.model!;
        }
        throw Error('error while loading the model on GPU');
    }

    unload() {
        this.status = 'unloaded';
        this.model = undefined;
    }
}

export function getPromptForAction(action: Action) {
    switch (action.type) {
        case 'writeFullEmail':
            return formatPromptWriteFullEmail(action);
        case 'shorten':
            return formatPromptShorten(action);
        case 'proofread':
            return formatPromptProofread(action);
        case 'friendly':
            return formatPromptFriendly(action);
        case 'formal':
            return formatPromptFormal(action);
        case 'expand':
            return formatPromptExpand(action);
        case 'customRefine':
            return formatPromptCustomRefine(action);
        default:
            throw Error('unimplemented');
    }
}

export function getTransformForAction(action: Action): TransformCallback {
    switch (action.type) {
        case 'writeFullEmail':
            return validateAndCleanupWriteFullEmail;
        default:
            return genericCleanup;
    }
}

function getCustomStopStringsForAction(action: Action): string[] {
    switch (action.type) {
        case 'writeFullEmail':
            return STOP_STRINGS_WRITE_FULL_EMAIL;
        default:
            return STOP_STRINGS_REFINE;
    }
}

export function prepareServerAssistantInteraction(action: Action): ServerAssistantInteraction {
    const rawLlmPrompt = getPromptForAction(action);
    const transformCallback = getTransformForAction(action);
    const customStopStrings = getCustomStopStringsForAction(action);
    const stopStrings = [...GENERAL_STOP_STRINGS, ...customStopStrings];

    return {
        rawLlmPrompt,
        transformCallback,
        stopStrings,
    };
}
