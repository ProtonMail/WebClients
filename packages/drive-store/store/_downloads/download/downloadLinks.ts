import { sendErrorReport } from '../../../utils/errorHandling';
import {
    DownloadCallbacks,
    DownloadStreamControls,
    GetChildrenCallback,
    LinkDownload,
    LogCallback,
    OnInitCallback,
    OnProgressCallback,
    OnSignatureIssueCallback,
} from '../interface';
import ArchiveGenerator from './archiveGenerator';
import ConcurrentIterator from './concurrentIterator';
import { FolderTreeLoader } from './downloadLinkFolder';
import { NestedLinkDownload } from './interface';

/**
 * initDownloadLinks prepares controls to download archive of passed `links`.
 * All links are in the root of the generated archive.
 */
export default function initDownloadLinks(
    links: LinkDownload[],
    callbacks: DownloadCallbacks,
    log: LogCallback,
    options?: { virusScan?: boolean }
): DownloadStreamControls {
    const folderLoaders: Map<String, FolderTreeLoader> = new Map();
    const concurrentIterator = new ConcurrentIterator();
    const archiveGenerator = new ArchiveGenerator();

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
            callbacks.onProgress
        );
        const linksIterator = iterateAllLinks(links, folderLoaders);
        const linksWithStreamsIterator = concurrentIterator.iterate(linksIterator, callbacks, log, options);
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
            Array.from(folderLoaders.values()).forEach((folderLoader) => folderLoader.cancel());
            archiveGenerator.cancel();
            concurrentIterator.cancel();
        },
    };
}

function loadTotalSize(
    links: LinkDownload[],
    folderLoaders: Map<String, FolderTreeLoader>,
    log: LogCallback,
    getChildren: GetChildrenCallback,
    onInit?: OnInitCallback,
    onSignatureIssue?: OnSignatureIssueCallback,
    onProgress?: OnProgressCallback
) {
    const sizePromises = links.map(async (link) => {
        if (link.isFile) {
            return { size: link.size, linkSizes: Object.fromEntries([[link.linkId, link.size]]) };
        }
        const folderLoader = new FolderTreeLoader(link, log);
        folderLoaders.set(link.shareId + link.linkId, folderLoader);
        const result = await folderLoader.load(getChildren, onSignatureIssue, onProgress);
        result.linkSizes[link.linkId] = result.size;
        return result;
    });

    Promise.all(sizePromises)
        .then((results) => {
            const size = results.reduce((total, { size }) => total + size, 0);
            const linkSizes = results.reduce((sum, { linkSizes }) => ({ ...sum, ...linkSizes }), {});
            onInit?.(size, linkSizes);
        })
        .catch(sendErrorReport);
}

async function* iterateAllLinks(
    links: LinkDownload[],
    folderLoaders: Map<String, FolderTreeLoader>
): AsyncGenerator<NestedLinkDownload> {
    for (const link of links) {
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
