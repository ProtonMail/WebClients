import { makeZip, predictLength } from 'client-zip';
import { fromUnixTime } from 'date-fns';

import { isWindows } from '@proton/shared/lib/helpers/browser';

import { adjustName, adjustWindowsLinkName, splitLinkName } from '../../legacy/store/_links';
import type { ArchiveItem } from './downloadTypes';
import { sanitizeEntryName } from './utils/sanitizeEntryName';

type ArchiveEntryMetadata = {
    uid: string;
    isFile: boolean;
    name: string;
    parentPath: string[];
    size?: number;
};

function getPathString(path: string[]): string {
    return path.length > 0 ? `/${path.join('/')}` : '';
}

// Windows doesn't like a leading root slash in zip entries --> "/dir/a.txt" becomes "dir/a.txt".
function toEntryName(path: string): string {
    return path.slice(1);
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
    private reservedFolderPaths: Map<string, string>;
    // A node can be listed twice (folder and descendant both selected) --> one entry per occurrence.
    private plannedEntries: { uid: string; name: string }[];

    constructor() {
        const { readable, writable } = new TransformStream();

        this.stream = readable;
        this.writer = writable;
        this.canceled = false;

        this.includedFiles = [];
        this.includedFolderPaths = new Set();
        this.originalToAdjustedPath = new Map();
        this.reservedFolderPaths = new Map();
        this.plannedEntries = [];
    }

    // Fix every name and the entry order before writing --> names and length don't depend on download order.
    planEntries(entries: ArchiveEntryMetadata[]): number | undefined {
        let hasUnknownSize = false;
        const plannedEntries: { uid: string; name: string }[] = [];
        const metadata = entries.map((entry) => {
            const path = entry.isFile
                ? this.adjustFilePath(entry.parentPath, entry.name)
                : this.adjustFolderPath(entry.parentPath, entry.name);
            const name = toEntryName(path);
            plannedEntries.push({ uid: entry.uid, name });
            if (!entry.isFile) {
                return { name };
            }
            if (entry.size === undefined) {
                hasUnknownSize = true;
            }
            return { name, size: entry.size ?? 0 };
        });
        this.plannedEntries = plannedEntries;

        if (hasUnknownSize) {
            return undefined;
        }
        return Number(predictLength(metadata));
    }

    async writeLinks(links: AsyncGenerator<ArchiveItem>) {
        const zipStream = makeZip(this.transformLinksToZipItems(links), {
            buffersAreUTF8: true,
        });
        await zipStream.pipeTo(this.writer);
    }

    async *transformLinksToZipItems(links: AsyncGenerator<ArchiveItem>) {
        for await (const { link, plannedName } of this.inPlannedOrder(links)) {
            if (this.canceled) {
                return;
            }
            if (link.isFile) {
                const name = plannedName ?? toEntryName(this.adjustFilePath(link.parentPath, link.name));
                yield {
                    name,
                    input: link.stream,
                    lastModified: link.fileModifyTime && fromUnixTime(link.fileModifyTime),
                };
            } else {
                const name = plannedName ?? toEntryName(this.adjustFolderPath(link.parentPath, link.name));
                yield {
                    name,
                };
            }
        }
    }

    // Zip64 lengths depend on entry order --> hold early arrivals and write planned links in the planned order.
    private async *inPlannedOrder(
        links: AsyncGenerator<ArchiveItem>
    ): AsyncGenerator<{ link: ArchiveItem; plannedName?: string }> {
        const pendingCountByUid = new Map<string, number>();
        this.plannedEntries.forEach(({ uid }) => pendingCountByUid.set(uid, (pendingCountByUid.get(uid) ?? 0) + 1));
        const arrivedByUid = new Map<string, ArchiveItem[]>();
        let nextIndex = 0;

        for await (const link of links) {
            const pendingCount = pendingCountByUid.get(link.uid) ?? 0;
            if (pendingCount === 0) {
                yield { link };
                continue;
            }
            pendingCountByUid.set(link.uid, pendingCount - 1);
            arrivedByUid.set(link.uid, [...(arrivedByUid.get(link.uid) ?? []), link]);

            while (nextIndex < this.plannedEntries.length) {
                const { uid, name } = this.plannedEntries[nextIndex];
                const arrived = arrivedByUid.get(uid)?.shift();
                if (!arrived) {
                    break;
                }
                nextIndex += 1;
                yield { link: arrived, plannedName: name };
            }
        }
    }

    /**
     * Resolves the adjusted path of the folder items live in. A folder can be overtaken by its
     * own children, which are scheduled independently and don't wait for it (e.g. it is stuck on
     * a signature-issue decision), so an ancestor is not guaranteed to be written yet. In that
     * case its path is reserved now, and reused when the folder itself arrives. Without this the
     * children would fall back to the root of the archive, next to an empty parent folder.
     */
    private adjustParentPath(path: string[]): string {
        let parentPath = '';
        path.forEach((name, index) => {
            const originalPath = getPathString(path.slice(0, index + 1));
            const adjustedPath = this.originalToAdjustedPath.get(originalPath);
            if (adjustedPath !== undefined) {
                parentPath = adjustedPath;
                return;
            }
            parentPath = this.adjustFolderPath(path.slice(0, index), name);
            this.reservedFolderPaths.set(originalPath, parentPath);
        });
        return parentPath;
    }

    private adjustFolderPath(path: string[], name: string): string {
        const pathString = getPathString(path);
        const fullPath = `${pathString}/${name}`;
        const reservedPath = this.reservedFolderPaths.get(fullPath);
        if (reservedPath !== undefined) {
            this.reservedFolderPaths.delete(fullPath);
            return reservedPath;
        }
        const parentPath = this.adjustParentPath(path);
        const fixedName = isWindows() ? adjustWindowsLinkName(sanitizeEntryName(name)) : sanitizeEntryName(name);

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
        const parentPath = this.adjustParentPath(path);
        const fixedName = isWindows() ? adjustWindowsLinkName(sanitizeEntryName(name)) : sanitizeEntryName(name);
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
