import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';
import type { Api } from '@proton/shared/lib/interfaces';

import type {
    DownloadCallbacks,
    DownloadStreamControls,
    GetChildrenCallback,
    LinkDownload,
    LogCallback,
    OnContainsDocumentCallback,
    OnInitCallback,
    OnProgressCallback,
    OnSignatureIssueCallback,
} from '../interface';
import ArchiveGenerator from './archiveGenerator';
import ConcurrentIterator from './concurrentIterator';
import { FolderTreeLoader } from './downloadLinkFolder';
import type { NestedLinkDownload } from './interface';

/**
 * initDownloadLinks prepares controls to download archive of passed `links`.
 * All links are in the root of the generated archive.
 */
export default function initDownloadLinks(
    links: LinkDownload[],
    callbacks: DownloadCallbacks,
    log: LogCallback,
    api: Api,
    options?: { virusScan?: boolean }
): DownloadStreamControls {
    const folderLoaders: Map<String, FolderTreeLoader> = new Map();
    const concurrentIterator = new ConcurrentIterator();
    const archiveGenerator = new ArchiveGenerator();

    const cancel = () => {
        Array.from(folderLoaders.values()).forEach((folderLoader) => folderLoader.cancel());
        archiveGenerator.cancel();
        concurrentIterator.cancel();
    };

    const start = () => {
        // To get link into progresses right away so potentially loader can be displayed.
        callbacks.onProgress?.(
            links.map(({ linkId }) => linkId),
            0
        );

        loadTotalSize(
            links,
            folderLoaders,
            log,
            callbacks.getChildren,
            callbacks.onInit,
            callbacks.onSignatureIssue,
            callbacks.onProgress,
            callbacks.onContainsDocument
        ).catch((err: Error) => {
            log(`initDownloadLinks => loadTotalSize failed: ${err}`);
            callbacks.onError?.(err);
            cancel();
        });

        const linksIterator = iterateAllLinks(links, folderLoaders, callbacks.onContainsDocument);
        const linksWithStreamsIterator = concurrentIterator.iterate(linksIterator, callbacks, log, options);
        archiveGenerator
            .writeLinks(linksWithStreamsIterator)
            .then(() => {
                callbacks.onFinish?.();
            })
            .catch((err: Error) => {
                log(`initDownloadLinks => archiveGenerator failed: ${err}`);
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

function loadTotalSize(
    links: LinkDownload[],
    folderLoaders: Map<String, FolderTreeLoader>,
    log: LogCallback,
    getChildren: GetChildrenCallback,
    onInit?: OnInitCallback,
    onSignatureIssue?: OnSignatureIssueCallback,
    onProgress?: OnProgressCallback,
    onContainsDocument?: OnContainsDocumentCallback
) {
    const sizePromises = links.map(async (link) => {
        // Proton Documents are skipped, so let's set them as 0 size
        if (isProtonDocument(link.mimeType)) {
            return { size: 0, linkSizes: { [link.linkId]: 0 } };
        }

        if (link.isFile) {
            return { size: link.size, linkSizes: Object.fromEntries([[link.linkId, link.size]]) };
        }
        const folderLoader = new FolderTreeLoader(link, log);
        folderLoaders.set(link.shareId + link.linkId, folderLoader);
        const result = await folderLoader.load(getChildren, onSignatureIssue, onProgress, onContainsDocument);
        result.linkSizes[link.linkId] = result.size;
        return result;
    });

    return Promise.all(sizePromises).then((results) => {
        const size = results.reduce((total, { size }) => total + size, 0);
        const linkSizes = results.reduce((sum, { linkSizes }) => ({ ...sum, ...linkSizes }), {});
        onInit?.(size, linkSizes);
        return { size, linkSizes };
    });
}

async function* iterateAllLinks(
    links: LinkDownload[],
    folderLoaders: Map<String, FolderTreeLoader>,
    onContainsDocument?: OnContainsDocumentCallback
): AsyncGenerator<NestedLinkDownload> {
    for (const link of links) {
        // If this is removed, remove it in `loadTotalSize` as well.
        if (isProtonDocument(link.mimeType)) {
            await onContainsDocument?.(new AbortController().signal);
            continue;
        }

        yield {
            parentLinkIds: [],
            parentPath: [],
            ...link,
        };

        if (!link.isFile) {
            const f = folderLoaders.get(link.shareId + link.linkId) as FolderTreeLoader;
            for await (const childLink of f.iterateAllChildren()) {
                yield {
                    ...childLink,
                    parentPath: [link.name, ...childLink.parentPath],
                };
            }
        }
    }
}
