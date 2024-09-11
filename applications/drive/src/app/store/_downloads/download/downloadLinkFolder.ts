import { c } from 'ttag';

import { RESPONSE_CODE } from '@proton/shared/lib/drive/constants';
import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Api } from '@proton/shared/lib/interfaces';

import { TransferCancel } from '../../../components/TransferManager/transfer';
import { ValidationError } from '../../../utils/errorHandling/ValidationError';
import { WAIT_TIME } from '../constants';
import type {
    ChildrenLinkMeta,
    DownloadCallbacks,
    DownloadStreamControls,
    GetChildrenCallback,
    LinkDownload,
    LogCallback,
    OnContainsDocumentCallback,
    OnProgressCallback,
    OnSignatureIssueCallback,
} from '../interface';
import ArchiveGenerator from './archiveGenerator';
import ConcurrentIterator from './concurrentIterator';
import type { NestedLinkDownload } from './interface';

type FolderLoadInfo = {
    size: number;
    linkSizes: { [linkId: string]: number };
};

/**
 * initDownloadLinkFolder prepares controls to download archive of the folder.
 * The folder itself is not part of the archive, all childs are in the root
 * of the archive.
 */
export default function initDownloadLinkFolder(
    link: LinkDownload,
    callbacks: DownloadCallbacks,
    log: LogCallback,
    api: Api,
    options?: { virusScan?: boolean }
): DownloadStreamControls {
    const folderLoader = new FolderTreeLoader(link, log);
    const concurrentIterator = new ConcurrentIterator();
    const archiveGenerator = new ArchiveGenerator();

    const cancel = () => {
        folderLoader.cancel();
        archiveGenerator.cancel();
        concurrentIterator.cancel();
    };

    const start = () => {
        folderLoader
            .load(callbacks.getChildren, callbacks.onSignatureIssue, callbacks.onProgress, callbacks.onContainsDocument)
            .then(({ size, linkSizes }) => {
                linkSizes[link.linkId] = size;
                callbacks.onInit?.(size, linkSizes);
            })
            .catch((err) => {
                callbacks.onError?.(err);
                cancel();
            });
        const childrenIterator = folderLoader.iterateAllChildren();
        const linksWithStreamsIterator = concurrentIterator.iterate(childrenIterator, callbacks, log, options);
        archiveGenerator
            .writeLinks(linksWithStreamsIterator)
            .then(() => {
                callbacks.onFinish?.();
            })
            .catch((err) => {
                callbacks.onError?.(err);
                cancel();
            });
        return archiveGenerator.stream;
    };

    return {
        start,
        pause: () => concurrentIterator.pause(),
        resume: () => concurrentIterator.resume(),
        cancel,
    };
}

/**
 * FolderTreeLoader loads recursively the whole tree and iterates over
 * all links with provided parent path for each of them.
 */
export class FolderTreeLoader {
    private rootLink: LinkDownload;

    private done: boolean;

    private links: NestedLinkDownload[];

    private abortController: AbortController;

    private log: LogCallback;

    constructor(link: LinkDownload, log: LogCallback) {
        this.rootLink = link;
        this.done = false;
        this.links = [];
        this.abortController = new AbortController();
        this.log = (message) => log(`traversal: ${message}`);
    }

    async load(
        getChildren: GetChildrenCallback,
        onSignatureIssue?: OnSignatureIssueCallback,
        onProgress?: OnProgressCallback,
        onContainsDocument?: OnContainsDocumentCallback
    ): Promise<FolderLoadInfo> {
        const result = await this.loadHelper(
            this.rootLink,
            [this.rootLink.linkId],
            getChildren,
            onSignatureIssue,
            onProgress,
            onContainsDocument
        );
        this.done = true;
        return result;
    }

    private async loadHelper(
        link: LinkDownload,
        parentLinkIds: string[],
        getChildren: GetChildrenCallback,
        onSignatureIssue?: OnSignatureIssueCallback,
        onProgress?: OnProgressCallback,
        onContainsDocument?: OnContainsDocumentCallback,
        parent: string[] = []
    ): Promise<FolderLoadInfo> {
        if (this.abortController.signal.aborted) {
            throw new TransferCancel({ message: `Transfer canceled` });
        }

        if (link.signatureIssues) {
            await onSignatureIssue?.(this.abortController.signal, link, link.signatureIssues);
        }

        const shareId = link.shareId;
        this.log(`Fetching children for ${link.linkId}: started`);
        let children = await getChildren(this.abortController.signal, link.shareId, link.linkId).catch((err) => {
            if (err?.data?.Code === RESPONSE_CODE.NOT_FOUND) {
                this.log(`Folder ${link.linkId} was deleted during download`);
                err = new ValidationError(c('Info').t`Folder "${link.name}" was deleted during download`);
            }
            throw err;
        });
        this.log(`Fetching children for ${link.linkId}: finished`);
        this.log(
            `Folder ${link.linkId} has ${children.length} items including ${children.filter(({ isFile }) => !isFile).length} folders, parent: ${parentLinkIds.at(-2) || 'none'}`
        );

        if (children.find((link) => isProtonDocument(link.mimeType))) {
            await onContainsDocument?.(this.abortController.signal);

            children = children.filter((link) => !isProtonDocument(link.mimeType));
        }

        this.links = [
            ...this.links,
            ...children.map((link) => ({
                parentLinkIds: parentLinkIds,
                parentPath: parent,
                isFile: link.isFile,
                shareId,
                linkId: link.linkId,
                name: link.name,
                mimeType: link.mimeType,
                size: link.size,
                fileModifyTime: link.fileModifyTime,
                signatureAddress: link.signatureAddress,
                signatureIssues: link.signatureIssues,
            })),
        ];

        return this.generateFolderResultsNew(
            shareId,
            children,
            getChildren,
            parentLinkIds,
            parent,
            onSignatureIssue,
            onProgress
        );
    }

    /**
     * New algorithm for recursively calling the loadHelper.
     * Will await one branch of nested children to complete recursion before
     * moving onto the next
     */
    private async generateFolderResultsNew(
        shareId: LinkDownload['shareId'],
        children: ChildrenLinkMeta[],
        getChildren: GetChildrenCallback,
        parentLinkIds: string[],
        parent: string[],
        onSignatureIssue?: OnSignatureIssueCallback,
        onProgress?: OnProgressCallback,
        onContainsDocument?: OnContainsDocumentCallback
    ): Promise<FolderLoadInfo> {
        const results = [];
        for (const item of children) {
            onProgress?.([...parentLinkIds, item.linkId], 0);
            if (!item.isFile) {
                const result = await this.loadHelper(
                    { ...item, shareId },
                    [...parentLinkIds, item.linkId],
                    getChildren,
                    onSignatureIssue,
                    onProgress,
                    onContainsDocument,
                    [...parent, item.name]
                );
                result.linkSizes[item.linkId] = result.size;
                results.push(result);
            }
            this.log(`File ${item.linkId}, parent: ${parentLinkIds.at(-1)}`);
            results.push({ size: item.size, linkSizes: Object.fromEntries([[item.linkId, item.size]]) });
        }
        return results.reduce(
            (acc, { size, linkSizes }) => {
                acc.size += size;
                acc.linkSizes = { ...acc.linkSizes, ...linkSizes };
                return acc;
            },
            { size: 0, linkSizes: {} }
        );
    }

    async *iterateAllChildren(): AsyncGenerator<NestedLinkDownload> {
        while (!this.done || this.links.length > 0) {
            const link = this.links.shift();
            if (link) {
                yield link;
            } else {
                await wait(WAIT_TIME);
            }
        }
    }

    cancel() {
        this.done = true;
        this.abortController.abort();
    }
}
