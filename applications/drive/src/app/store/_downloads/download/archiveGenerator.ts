import { makeZip } from 'client-zip';
import { fromUnixTime } from 'date-fns';

import { isWindows } from '@proton/shared/lib/helpers/browser';

import { adjustName, adjustWindowsLinkName, splitLinkName } from '../../_links';
import type { StartedNestedLinkDownload } from './interface';

function getPathString(path: string[]): string {
    return path.length > 0 ? `/${path.join('/')}` : '';
}

/**
 * Archive iterates over provided generator of folders and file streams which
 * are written into the archive stream.
 */
export default class ArchiveGenerator {
    stream: ReadableStream<Uint8Array<ArrayBuffer>>;

    private writer: WritableStream<Uint8Array<ArrayBuffer>>;

    private canceled: boolean;

    private includedFiles: { path: string; name: string }[];

    private includedFolderPaths: Set<string>;

    private originalToAdjustedPath: Map<string, string>;

    constructor() {
        const { readable, writable } = new TransformStream();

        this.stream = readable;
        this.writer = writable;
        this.canceled = false;

        this.includedFiles = [];
        this.includedFolderPaths = new Set();
        this.originalToAdjustedPath = new Map();
    }

    async writeLinks(links: AsyncGenerator<StartedNestedLinkDownload>) {
        const zipStream = makeZip(this.transformLinksToZipItems(links), {
            buffersAreUTF8: true,
        });
        await zipStream.pipeTo(this.writer);
    }

    async *transformLinksToZipItems(links: AsyncGenerator<StartedNestedLinkDownload>) {
        for await (const link of links) {
            if (this.canceled) {
                return;
            }
            if (link.isFile) {
                const name = this.adjustFilePath(link.parentPath, link.name);
                yield {
                    name: name.slice(1), // Windows doesn't like leading root slash.
                    input: link.stream,
                    lastModified: link.fileModifyTime && fromUnixTime(link.fileModifyTime),
                };
            } else {
                const name = this.adjustFolderPath(link.parentPath, link.name);
                yield {
                    name: name.slice(1), // Windows doesn't like leading root slash.
                };
            }
        }
    }

    private adjustFolderPath(path: string[], name: string): string {
        const pathString = getPathString(path);
        const fullPath = `${pathString}/${name}`;
        const parentPath = this.originalToAdjustedPath.get(pathString) || '';
        const fixedName = isWindows() ? adjustWindowsLinkName(name) : name;

        const deduplicate = (index = 0): string => {
            const adjustedName = `${adjustName(index, fixedName)}`;
            const adjustedPath = `${parentPath}/${adjustedName}`;

            if (
                this.includedFiles.some(
                    (file) => file.path === parentPath && file.name.toLowerCase() === adjustedName.toLowerCase()
                ) ||
                this.includedFolderPaths.has(adjustedPath.toLowerCase())
            ) {
                return deduplicate(index + 1);
            }
            this.originalToAdjustedPath.set(fullPath, adjustedPath);
            this.includedFolderPaths.add(adjustedPath.toLowerCase());
            return adjustedPath;
        };
        return deduplicate();
    }

    private adjustFilePath(path: string[], name: string) {
        const pathString = getPathString(path);
        const parentPath = this.originalToAdjustedPath.get(pathString) || '';
        const fixedName = isWindows() ? adjustWindowsLinkName(name) : name;
        const [namePart, extension] = splitLinkName(fixedName);

        const deduplicate = (index = 0): string => {
            const adjustedName = adjustName(index, namePart, extension);
            if (
                this.includedFiles.some(
                    (file) => file.path === parentPath && file.name.toLowerCase() === adjustedName.toLowerCase()
                ) ||
                this.includedFolderPaths.has(`${parentPath}/${adjustedName}`)
            ) {
                return deduplicate(index + 1);
            }
            this.includedFiles.push({ path: parentPath, name: adjustedName });
            return `${parentPath}/${adjustedName}`;
        };
        return deduplicate();
    }

    cancel() {
        this.canceled = true;
    }
}
