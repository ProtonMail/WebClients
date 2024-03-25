import { ReadableStream } from 'web-streams-polyfill';

import { PrivateKeyReference, PublicKeyReference, SessionKey } from '@proton/crypto';
import { DriveFileBlock } from '@proton/shared/lib/interfaces/drive/file';
import { SharedFileScan } from '@proton/shared/lib/interfaces/drive/sharing';

import { DecryptedLink, SignatureIssues } from '../_links';

export type LogCallback = (message: string) => void;

export interface LinkDownload {
    isFile: boolean;
    shareId: string;
    linkId: string;

    name: string;
    mimeType: string;
    size: number;
    revisionId?: string;
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
    onScanIssue?: OnScanIssueCallback;
    // Called when the whole transfer is finished.
    onFinish?: () => void;
};

export type DownloadBaseCallbacks = {
    getChildren: GetChildrenCallback;
    getBlocks: GetBlocksCallback;
    getKeys: GetKeysCallback;
    scanFilesHash?: ScanFilesHashCallback;
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
export type OnScanIssueCallback = (abortSignal: AbortSignal, err: any) => Promise<void>;
export type OnErrorCallback = (err: Error) => void;

export type ChildrenLinkMeta = Pick<
    DecryptedLink,
    'isFile' | 'linkId' | 'name' | 'mimeType' | 'size' | 'fileModifyTime' | 'signatureAddress' | 'signatureIssues'
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
    pagination: Pagination,
    revisionId?: string,
    options?: { virusScan?: boolean }
) => Promise<{ blocks: DriveFileBlock[]; thumbnailHashes: string[]; manifestSignature: string; xAttr: string }>;
type GetKeysCallback = (abortSignal: AbortSignal, link: LinkDownload) => Promise<DecryptFileKeys>;
type ScanFilesHashCallback = (abortSignal: AbortSignal, hashes: string[]) => Promise<SharedFileScan | undefined>;

export type Pagination = { FromBlockIndex: number; PageSize: number };
export type DecryptFileKeys = {
    privateKey: PrivateKeyReference;
    sessionKeys?: SessionKey;
    addressPublicKeys?: PublicKeyReference[];
};

export type InitDownloadCallback = (
    name: string,
    list: LinkDownload[],
    eventCallbacks: DownloadEventCallbacks,
    log: LogCallback,
    options?: { virusScan?: boolean }
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
