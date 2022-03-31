import { ReadableStream } from 'web-streams-polyfill';

import { DriveFileBlock } from '@proton/shared/lib/interfaces/drive/file';
import { PrivateKeyReference, PublicKeyReference, SessionKey } from '@proton/crypto';

import { DecryptedLink, SignatureIssues } from '../_links';

export interface LinkDownload {
    isFile: boolean;
    shareId: string;
    linkId: string;

    name: string;
    mimeType: string;
    size: number;
    signatureAddress?: string;
    signatureIssues?: SignatureIssues;

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

export type OnInitCallback = (
    size: number,
    // linkSizes is map of link ID to its size.
    // Currently we collect only sizes of top level items, that
    // is exluding the whole tree of the folder item.
    linkSizes: { [linkId: string]: number }
) => void;
export type OnProgressCallback = (
    // linkIds for which the progress should be counted.
    // It should contain link itself and all the parents so the whole directory
    // tree is properly counted.
    linkIds: string[],
    bytes: number
) => void;
export type OnSignatureIssueCallback = (
    abortSignal: AbortSignal,
    link: LinkDownload,
    signatureIssues: SignatureIssues
) => Promise<void>;
type OnErrorCallback = (err: any) => void;

export type ChildrenLinkMeta = Pick<
    DecryptedLink,
    'isFile' | 'linkId' | 'name' | 'mimeType' | 'size' | 'signatureAddress' | 'signatureIssues'
>;
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
    privateKey: PrivateKeyReference;
    sessionKeys?: SessionKey;
    addressPublicKeys?: PublicKeyReference[];
};

export type InitDownloadCallback = (
    name: string,
    list: LinkDownload[],
    eventCallbacks: DownloadEventCallbacks
) => DownloadControls;
export type DownloadSignatureIssueModal = React.FunctionComponent<DownloadSignatureIssueModalProps>;

interface DownloadSignatureIssueModalProps {
    isFile: boolean;
    name: string;
    downloadName: string;
    signatureAddress?: string;
    signatureIssues: SignatureIssues;
    apply: (strategy: TransferSignatureIssueStrategy, all: boolean) => void;
    cancelAll: () => void;
}

export enum TransferSignatureIssueStrategy {
    Abort = 'abort',
    Continue = 'continue',
    // Following strategies are not used yet.
    DeleteFile = 'delete',
    ResignFile = 'resign',
}
