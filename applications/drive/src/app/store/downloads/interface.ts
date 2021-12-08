import { ReadableStream } from 'web-streams-polyfill';
import { OpenPGPKey, SessionKey, VERIFICATION_STATUS } from 'pmcrypto';

import { DriveFileBlock } from '@proton/shared/lib/interfaces/drive/file';

import { DecryptedLink, LinkType } from '../links';

export interface LinkDownload {
    type: LinkType;
    shareId: string;
    linkId: string;

    name: string;
    mimeType: string;
    size: number;

    buffer?: Uint8Array[];
}

export type DownloadControls = {
    start: () => Promise<void>;
    pause: () => void;
    resume: () => void;
    cancel: () => void;
};

export type DownloadStreamControls = Omit<DownloadControls, 'start'> & {
    start: () => ReadableStream<Uint8Array>;
};

export type DownloadEventCallbacks = {
    // Called when the total size is known.
    onInit?: OnInitCallback;
    // Called when relative progress is changed.
    // Both up and down, e.g., when something is retried.
    onProgress?: OnProgressCallback;
    // Called when signature verification fails.
    // It can be used to ask user the issue and allow the user to abort
    // the download, or ignore the problem and continue.
    onSignatureIssue?: OnSignatureIssueCallback;
    // Called when error happened.
    // The transfer is cancelled.
    onError?: OnErrorCallback;
    // Called when network error happened.
    // The transfer is paused and it awaits for instructuion to continue.
    onNetworkError?: OnErrorCallback;
    // Called when the whole transfer is finished.
    onFinish?: () => void;
};

export type DownloadBaseCallbacks = {
    getChildren: GetChildrenCallback;
    getBlocks: GetBlocksCallback;
    getKeys: GetKeysCallback;
};

export type DownloadCallbacks = DownloadEventCallbacks & DownloadBaseCallbacks;

export type OnInitCallback = (size: number) => void;
type OnProgressCallback = (bytes: number) => void;
type OnSignatureIssueCallback = (status: VERIFICATION_STATUS) => Promise<void>;
type OnErrorCallback = (err: any) => void;

export type ChildrenLinkMeta = Pick<DecryptedLink, 'type' | 'linkId' | 'name' | 'mimeType' | 'size'>;
export type GetChildrenCallback = (
    abortSignal: AbortSignal,
    shareId: string,
    linkId: string
) => Promise<ChildrenLinkMeta[]>;
type GetBlocksCallback = (
    abortSignal: AbortSignal,
    shareId: string,
    linkId: string,
    pagination: Pagination
) => Promise<DriveFileBlock[]>;
type GetKeysCallback = (abortSignal: AbortSignal, shareId: string, linkId: string) => Promise<DecryptFileKeys>;

export type Pagination = { FromBlockIndex: number; PageSize: number };
export type DecryptFileKeys = {
    privateKey: OpenPGPKey;
    sessionKeys?: SessionKey;
    addressPublicKeys: OpenPGPKey[];
};
