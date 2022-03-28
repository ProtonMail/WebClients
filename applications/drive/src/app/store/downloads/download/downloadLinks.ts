import { reportError } from '../../utils';
import {
    LinkDownload,
    DownloadCallbacks,
    DownloadStreamControls,
    GetChildrenCallback,
    OnInitCallback,
    OnSignatureIssueCallback,
} from '../interface';
import { NestedLinkDownload } from './interface';
import { FolderTreeLoader } from './downloadLinkFolder';
import ArchiveGenerator from './archiveGenerator';
import ConcurrentIterator from './concurrentIterator';

/**
 * initDownloadLinks prepares controls to download archive of passed `links`.
 * All links are in the root of the generated archive.
 */
export default function initDownloadLinks(links: LinkDownload[], callbacks: DownloadCallbacks): DownloadStreamControls {
    const folderLoaders: Map<String, FolderTreeLoader> = new Map();
    const concurrentIterator = new ConcurrentIterator();
    const archiveGenerator = new ArchiveGenerator();

    const start = () => {
        loadTotalSize(links, folderLoaders, callbacks.getChildren, callbacks.onInit, callbacks.onSignatureIssue);
        const linksIterator = iterateAllLinks(links, folderLoaders);
        const linksWithStreamsIterator = concurrentIterator.iterate(linksIterator, callbacks);
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
    getChildren: GetChildrenCallback,
    onInit?: OnInitCallback,
    onSignatureIssue?: OnSignatureIssueCallback
) {
    const sizePromises = links.map(async (link) => {
        if (link.isFile) {
            return link.size;
        }
        const folderLoader = new FolderTreeLoader();
        folderLoaders.set(link.shareId + link.linkId, folderLoader);
        return folderLoader.load(link, getChildren, onSignatureIssue);
    });

    Promise.all(sizePromises)
        .then((sizes: number[]) => {
            const size = sizes.reduce((a, b) => a + b, 0);
            onInit?.(size);
        })
        .catch(reportError);
}

async function* iterateAllLinks(
    links: LinkDownload[],
    folderLoaders: Map<String, FolderTreeLoader>
): AsyncGenerator<NestedLinkDownload> {
    for (const link of links) {
        yield {
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
