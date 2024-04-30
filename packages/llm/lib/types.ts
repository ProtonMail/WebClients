/* eslint-disable @typescript-eslint/lines-between-class-members */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */

export type MonitorDownloadCallback = (progress: number, done: boolean) => void;

export type PromiseResolve = (value: PromiseLike<void> | void) => void;

export type PromiseReject = (reason?: any) => void;

// @ts-ignore
export interface LlmManager {
    hasGpu: () => boolean;
    startDownload: (updateProgress: DownloadProgressCallback) => Promise<void>;
    cancelDownload: () => boolean;
    loadOnGpu: () => Promise<LlmModel>;
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

export type GenerationCallback = (token: string, fulltext: string) => void;
export type Action =
    | WriteFullEmailAction
    | RephraseAction
    | EnhanceAction
    | MakeFormalAction
    | MakeFriendlyAction
    | ShortenAction
    | ExpandAction;

export type WriteFullEmailAction = {
    type: 'writeFullEmail';
    prompt: string;
};
export type RephraseAction = {
    type: 'rephrase';
    text: string;
};
export type EnhanceAction = {
    type: 'enhance';
    text: string;
};
export type MakeFormalAction = {
    type: 'makeFormal';
    text: string;
};
export type MakeFriendlyAction = {
    type: 'makeFriendly';
    text: string;
};
export type ShortenAction = {
    type: 'shorten';
    fullEmail: string;
    partToRephase: string; // partToRephase should be contained in fullEmail
};
export type ExpandAction = {
    type: 'expand';
    text: string;
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
