import { c } from 'ttag';

import { RESPONSE_CODE } from '@proton/shared/lib/drive/constants';
import { wait } from '@proton/shared/lib/helpers/promise';

import { TransferCancel } from '../../../components/TransferManager/transfer';
import { ValidationError } from '../../../utils/errorHandling/ValidationError';
import { WAIT_TIME } from '../constants';
import {
    ChildrenLinkMeta,
    DownloadCallbacks,
    DownloadStreamControls,
    GetChildrenCallback,
    LinkDownload,
    LogCallback,
    OnProgressCallback,
    OnSignatureIssueCallback,
} from '../interface';
import ArchiveGenerator from './archiveGenerator';
import ConcurrentIterator from './concurrentIterator';
import { NestedLinkDownload } from './interface';

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
    options?: { virusScan?: boolean }
): DownloadStreamControls {
    const folderLoader = new FolderTreeLoader(link, log);
    const concurrentIterator = new ConcurrentIterator();
    const archiveGenerator = new ArchiveGenerator();

    const start = () => {
        folderLoader
            .load(callbacks.getChildren, callbacks.onSignatureIssue, callbacks.onProgress)
            .then(({ size, linkSizes }) => {
                linkSizes[link.linkId] = size;
                callbacks.onInit?.(size, linkSizes);
            })
            .catch((err) => {
                callbacks.onError?.(err);
                archiveGenerator.cancel();
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
                archiveGenerator.cancel();
            });
        return archiveGenerator.stream;
    };

    return {
        start,
        pause: () => concurrentIterator.pause(),
        resume: () => concurrentIterator.resume(),
        cancel: () => {
            folderLoader.cancel();
            archiveGenerator.cancel();
            concurrentIterator.cancel();
        },
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
        this.log = log;
    }

    async load(
        getChildren: GetChildrenCallback,
        onSignatureIssue?: OnSignatureIssueCallback,
        onProgress?: OnProgressCallback
    ): Promise<FolderLoadInfo> {
        const result = await this.loadHelper(
            this.rootLink,
            [this.rootLink.linkId],
            getChildren,
            onSignatureIssue,
            onProgress
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
        parent: string[] = []
    ): Promise<FolderLoadInfo> {
        if (this.abortController.signal.aborted) {
            throw new TransferCancel({ message: `Transfer canceled` });
        }

        if (link.signatureIssues) {
            await onSignatureIssue?.(this.abortController.signal, link, link.signatureIssues);
        }

        const shareId = link.shareId;
        this.log(`Fetching children for ${link.linkId}`);
        const children = await getChildren(this.abortController.signal, link.shareId, link.linkId).catch((err) => {
            if (err?.data?.Code === RESPONSE_CODE.NOT_FOUND) {
                this.log(`Folder ${link.linkId} was deleted during download`);
                err = new ValidationError(c('Info').t`Folder "${link.name}" was deleted during download`);
            }
            throw err;
        });
        this.log(
            `Folder ${link.linkId} has ${children.length} items including ${children.filter(({ isFile }) => !isFile).length} folders`
        );
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
        return Promise.all(
            children.map(async (item: ChildrenLinkMeta) => {
                // To get link into progresses right away so potentially loader can be displayed.
                onProgress?.([...parentLinkIds, item.linkId], 0);

                if (!item.isFile) {
                    const result = await this.loadHelper(
                        { ...item, shareId },
                        [...parentLinkIds, item.linkId],
                        getChildren,
                        onSignatureIssue,
                        onProgress,
                        [...parent, item.name]
                    );
                    result.linkSizes[item.linkId] = result.size;
                    return result;
                }
                return { size: item.size, linkSizes: Object.fromEntries([[item.linkId, item.size]]) };
            })
        ).then((results: FolderLoadInfo[]) => {
            const size = results.reduce((total, { size }) => total + size, 0);
            const linkSizes = results.reduce((sum, { linkSizes }) => ({ ...sum, ...linkSizes }), {});
            return {
                size,
                linkSizes,
            };
        });
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
