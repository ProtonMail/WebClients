/* eslint-disable @typescript-eslint/lines-between-class-members */

/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-use-before-define */
import type { CacheId, DownloadResult, LlmFile } from '@proton/llm/lib/downloader';

export type PromiseResolve = (value: PromiseLike<void> | void) => void;

export type PromiseReject = (reason?: any) => void;

export interface LlmManager {
    // prefer passing a canvas, it will allow us to get some info using WebGL
    startDownload: (updateProgress: DownloadProgressCallback, assistantConfig: AssistantConfig) => Promise<boolean>; // returns whether it completed
    cancelDownload: () => void;
    loadOnGpu: (assistantConfig: AssistantConfig) => Promise<LlmModel>;
    isDownloaded: (assistantConfig: AssistantConfig, setLlmStatus?: boolean) => Promise<boolean>;
}

export interface LlmModel {
    unload: () => Promise<void>;
    performAction: (action: Action, callback: GenerationCallback) => Promise<RunningAction>;
}

export interface RunningAction {
    isRunning: () => boolean;
    isDone: () => boolean;
    isCancelled: () => boolean;
    action: () => Action;
    cancel: () => boolean;
    waitForCompletion(): Promise<void>;
}

export type GenerationCallbackDetails = {
    slow: boolean;
    harmful: boolean;
};
export type GenerationCallback = (fulltext: string, details?: GenerationCallbackDetails) => void;

/** ACTION TYPES
 *
 * Here is the classification for the different actions:
 *
 * writeFullEmail
 * proofread         } "predefined           }
 * shorten           }  refine actions"      }  "refine actions"
 * customRefine                              }
 *
 * The types below indicate this hierarchy, along with optional info
 * like the refine location.
 */

type ActionOptions = {
    userInputFormat?: 'plaintext' | 'markdown';
    assistantOutputFormat?: 'plaintext' | 'markdown';
};

// "Write Full Email": initial generation of an email based on a user prompt.
export type WriteFullEmailAction = {
    type: 'writeFullEmail';
    prompt: string;
    recipient?: string;
    sender?: string;
    locale?: string;
} & ActionOptions;

// Identifies a substring to refine along with its context. Only for refine actions.
// Usually, this will be a selection inside the generated text.
export type RefineLocation = {
    fullEmail: string; // `fullEmail.slice(idxStart, idxEnd)` is the part to rephrase
    idxStart: number; // beginning of part to rephrase
    idxEnd: number; // end of part to rephrase
} & ActionOptions;

// "Custom Refine" refers to the reformulation of an already-generated email, or part of it,
// with a custom request written by the user (e.g. "make it formal").
export type CustomRefineAction = PartialCustomRefineAction & RefineLocation;
export type PartialCustomRefineAction = {
    type: 'customRefine';
    prompt: string; // user-submitted instruction of what to do with this text
} & ActionOptions;

// "Proofread" action button.
export type ProofreadAction = PartialProofreadAction & RefineLocation;
export type PartialProofreadAction = {
    type: 'proofread';
};

// "Shorten" action button.
export type ShortenAction = PartialShortenAction & RefineLocation;
export type PartialShortenAction = {
    type: 'shorten';
};

// "Formal" action button.
export type FormalAction = PartialFormalAction & RefineLocation;
export type PartialFormalAction = {
    type: 'formal';
};

// "Friendly" action button.
export type FriendlyAction = PartialFriendlyAction & RefineLocation;
export type PartialFriendlyAction = {
    type: 'friendly';
};

// "Expand" action button.
export type ExpandAction = PartialExpandAction & RefineLocation;
export type PartialExpandAction = {
    type: 'expand';
};

export type PartialRefineAction =
    | PartialProofreadAction
    | PartialShortenAction
    | PartialFormalAction
    | PartialFriendlyAction
    | PartialExpandAction
    | PartialCustomRefineAction;
export type RefineAction = PartialRefineAction & RefineLocation;
export type PredefinedRefineAction = ProofreadAction | ShortenAction | FormalAction | FriendlyAction | ExpandAction;
export type Action = WriteFullEmailAction | RefineAction;

export type PredefinedRefineActionType = PredefinedRefineAction['type'];
export type RefineActionType = RefineAction['type'];
export type ActionType = Action['type'];

export function isPredefinedRefineActionType(value: any): value is PredefinedRefineActionType {
    return (
        value === 'shorten' || value === 'proofread' || value === 'formal' || value === 'friendly' || value === 'expand'
    );
}

export function isRefineActionType(value: any): value is RefineActionType {
    return value === 'customRefine' || isPredefinedRefineActionType(value);
}

// A function to monitor the overall download progress.
//
// `info.estimatedTotalBytes` can change over time, because there are a few
// files whose size is unknown until we start downloading them. That said,
// it shouldn't be far from reality anyway, because we know the size of the
// biggest files upfront.
//
// If the download is stopped and then resume, this progress will take into
// account the files already cached and start from that number, not from zero.
export type DownloadProgressCallback = (info: DownloadProgressInfo) => void;
export type DownloadProgressInfo = {
    receivedFiles: number;
    totalFiles: number;
    receivedBytes: number;
    estimatedTotalBytes: number;
};

export interface AssistantModel {
    ModelID: string;
    Priority: number;
    ModelURL: string;
    ModelLibURL: string;
    VRAMRequiredMB: number;
    LowResourceRequired: boolean;
    RequiredFeatures: string[];
}

export interface AssistantConfigModel {
    model_url: string;
    model_download_url: string;
    model_id: string;
    model_lib_url: string;
    vram_required_MB: number;
    low_resource_required: boolean;
    required_features: string[];
}

export interface AssistantConfig {
    model_list: AssistantConfigModel[];
    use_web_worker: boolean;
}

export enum OpenedAssistantStatus {
    EXPANDED = 'expanded',
    COLLAPSED = 'collapsed',
}

export type OpenedAssistant = {
    id: string;
    status: OpenedAssistantStatus;
};

/**
 * Events sent from or to the assistant iframe
 */
export enum AssistantEvent {
    // Messages from parent to iframe
    START_DOWNLOAD = 'start-download',
    PAUSE_DOWNLOAD = 'pause-download',

    // Messages from iframe to parent
    IFRAME_READY = 'iframe-ready',
    DOWNLOAD_DATA = 'download-data',
    DOWNLOAD_PROGRESS = 'download-progress',
    DOWNLOAD_ERROR = 'download-error',
}

interface StartDownloadMessage {
    type: AssistantEvent.START_DOWNLOAD;
    payload: {
        config: AssistantConfig;
        modelVariant: string;
        filesToIgnore: LlmFile[];
    };
}

interface PauseDownloadMessage {
    type: AssistantEvent.PAUSE_DOWNLOAD;
}

interface IframeReady {
    type: AssistantEvent.IFRAME_READY;
}

interface DownloadedChunkMessage {
    type: AssistantEvent.DOWNLOAD_DATA;
    payload: {
        downloadResult: DownloadResult;
        cacheId: CacheId;
        cacheUrl: string;
        expectedMd5?: string;
        terminate: boolean;
    };
}

interface DownloadProgressMessage {
    type: AssistantEvent.DOWNLOAD_PROGRESS;
    payload: {
        progress: DownloadProgressInfo;
    };
}

interface DownloadErrorMessage {
    type: AssistantEvent.DOWNLOAD_ERROR;
    payload: {
        error: any;
    };
}

export type ParentToIframeMessage = StartDownloadMessage | PauseDownloadMessage;

export type IframeToParentMessage =
    | IframeReady
    | DownloadedChunkMessage
    | DownloadProgressMessage
    | DownloadErrorMessage;
