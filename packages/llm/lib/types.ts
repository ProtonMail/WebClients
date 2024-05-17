/* eslint-disable @typescript-eslint/lines-between-class-members */

/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-use-before-define */
import { DESTINATION_CACHE, DownloadResult } from '@proton/llm/lib/downloader';

export type PromiseResolve = (value: PromiseLike<void> | void) => void;

export type PromiseReject = (reason?: any) => void;

export type GpuAssessmentResult =
    | 'ok' // seems like WebGPU should work
    | 'noWebGpu' // we cannot load WebGPU
    | 'noWebGpuFirefox' // we cannot load WebGPU and we specifically know it's because the user uses Firefox
    | 'insufficientRam' // total ram can't hold the model in memory, and swapping would give terrible perfs
    | 'macPreM1' // Mac detected, but it seems to be an older Intel CPU that cannot run LLMs
    | 'noShaderF16' // this GPU is lacking newer features that are required for LLM text generation
    | 'maxBufferSizeTooLow'; // this GPU is likely underpowered

export interface LlmManager {
    // prefer passing a canvas, it will allow us to get some info using WebGL
    startDownload: (updateProgress: DownloadProgressCallback, assistantConfig: AssistantConfig) => Promise<boolean>; // returns whether it completed
    cancelDownload: () => void;
    loadOnGpu: (assistantConfig: AssistantConfig) => Promise<LlmModel>;
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

export type GenerationCallback = (fulltext: string) => void;
export type Action = WriteFullEmailAction | RefineAction | ShortenAction;

export type WriteFullEmailAction = {
    type: 'writeFullEmail';
    prompt: string;
};
export type RefineAction = {
    type: 'refine';
    fullEmail: string; // `fullEmail.slice(idxStart, idxEnd)` is the part to rephrase
    idxStart: number; // beginning of part to rephrase
    idxEnd: number; // end of part to rephrase
    prompt: string; // user-submitted instruction of what to do with this text
};
export type ShortenAction = {
    type: 'shorten';
    fullEmail: string;
    partToRephrase: string; // partToRephrase should be contained in fullEmail
};

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

/**
 * Events sent from or to the assistant iframe
 */
export enum ASSISTANT_EVENTS {
    // Messages from parent to iframe
    START_DOWNLOAD = 'start-download',
    PAUSE_DOWNLOAD = 'pause-download',

    // Messages from iframe to parent
    DOWNLOAD_DATA = 'download-data',
    DOWNLOAD_PROGRESS = 'download-progress',
    DOWNLOAD_ERROR = 'download-error',
}

interface START_DOWNLOAD {
    type: ASSISTANT_EVENTS.START_DOWNLOAD;
    payload: {
        config: AssistantConfig;
        modelVariant: string;
        filesToIgnore: string[];
    };
}

interface PAUSE_DOWNLOAD {
    type: ASSISTANT_EVENTS.PAUSE_DOWNLOAD;
}

interface DOWNLOAD_DATA {
    type: ASSISTANT_EVENTS.DOWNLOAD_DATA;
    payload: {
        downloadResult: DownloadResult;
        url: string;
        destinationCacheID: DESTINATION_CACHE;
        expectedMd5?: string;
        terminate: boolean;
    };
}

interface DOWNLOAD_PROGRESS {
    type: ASSISTANT_EVENTS.DOWNLOAD_PROGRESS;
    payload: {
        progress: DownloadProgressInfo;
    };
}

interface DOWNLOAD_ERROR {
    type: ASSISTANT_EVENTS.DOWNLOAD_ERROR,
    payload: {
        error: any;
    }
}

export type ASSISTANT_ACTION = START_DOWNLOAD
    | PAUSE_DOWNLOAD
    | DOWNLOAD_DATA
    | DOWNLOAD_PROGRESS
    | DOWNLOAD_ERROR;
