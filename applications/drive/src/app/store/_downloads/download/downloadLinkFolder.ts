import { c } from 'ttag';

import { wait } from '@proton/shared/lib/helpers/promise';
import { RESPONSE_CODE } from '@proton/shared/lib/drive/constants';

import { TransferCancel } from '../../../components/TransferManager/transfer';
import { ValidationError } from '../../_utils';
import { WAIT_TIME } from '../constants';
import {
    LinkDownload,
    DownloadCallbacks,
    DownloadStreamControls,
    GetChildrenCallback,
    OnSignatureIssueCallback,
    ChildrenLinkMeta,
} from '../interface';
import { NestedLinkDownload } from './interface';
import ArchiveGenerator from './archiveGenerator';
import ConcurrentIterator from './concurrentIterator';

/**
 * initDownloadLinkFolder prepares controls to download archive of the folder.
 * The folder itself is not part of the archive, all childs are in the root
 * of the archive.
 */
export default function initDownloadLinkFolder(
    link: LinkDownload,
    callbacks: DownloadCallbacks
): DownloadStreamControls {
    const folderLoader = new FolderTreeLoader(link);
    const concurrentIterator = new ConcurrentIterator();
    const archiveGenerator = new ArchiveGenerator();

    const start = () => {
        folderLoader
            .load(callbacks.getChildren, callbacks.onSignatureIssue)
            .then((size) => {
                const linkSizes = Object.fromEntries([[link.linkId, size]]);
                callbacks.onInit?.(size, linkSizes);
            })
            .catch((err) => {
                callbacks.onError?.(err);
                archiveGenerator.cancel();
            });
        const childrenIterator = folderLoader.iterateAllChildren();
        const linksWithStreamsIterator = concurrentIterator.iterate(childrenIterator, callbacks);
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

    constructor(link: LinkDownload) {
        this.rootLink = link;
        this.done = false;
        this.links = [];
        this.abortController = new AbortController();
    }

    async load(getChildren: GetChildrenCallback, onSignatureIssue?: OnSignatureIssueCallback): Promise<number> {
        const size = await this.loadHelper(this.rootLink, getChildren, onSignatureIssue);
        this.done = true;
        return size;
    }

    private async loadHelper(
        link: LinkDownload,
        getChildren: GetChildrenCallback,
        onSignatureIssue?: OnSignatureIssueCallback,
        parent: string[] = []
    ): Promise<number> {
        if (this.abortController.signal.aborted) {
            throw new TransferCancel({ message: `Transfer canceled` });
        }

        if (link.signatureIssues) {
            await onSignatureIssue?.(this.abortController.signal, link, link.signatureIssues);
        }

        const shareId = link.shareId;
        const children = await getChildren(this.abortController.signal, link.shareId, link.linkId).catch((err) => {
            if (err?.data?.Code === RESPONSE_CODE.NOT_FOUND) {
                err = new ValidationError(c('Info').t`Folder "${link.name}" was deleted during download`);
            }
            throw err;
        });
        this.links = [
            ...this.links,
            ...children.map((link) => ({
                rootLinkId: this.rootLink.linkId,
                parentPath: parent,
                isFile: link.isFile,
                shareId,
                linkId: link.linkId,
                name: link.name,
                mimeType: link.mimeType,
                size: link.size,
                signatureAddress: link.signatureAddress,
                signatureIssues: link.signatureIssues,
            })),
        ];
        return Promise.all(
            children.map(async (item: ChildrenLinkMeta) => {
                if (!item.isFile) {
                    return this.loadHelper({ ...item, shareId }, getChildren, onSignatureIssue, [...parent, item.name]);
                }
                return item.size;
            })
        ).then((sizes: number[]) => {
            return sizes.reduce((total, size) => total + size, 0);
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
