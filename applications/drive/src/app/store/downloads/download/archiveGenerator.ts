import { ReadableStream } from 'web-streams-polyfill';
import { Writer as ZipWriter } from '@transcend-io/conflux';

import { isWindows } from '@proton/shared/lib/helpers/browser';
import { TransferCancel } from '@proton/shared/lib/interfaces/drive/transfer';

import { splitLinkName, adjustName, adjustWindowsLinkName } from '../../links';
import { StartedNestedLinkDownload } from './interface';

function getPathString(path: string[]): string {
    return path.length > 0 ? `/${path.join('/')}` : '';
}

/**
 * Archive iterates over provided generator of folders and file streams which
 * are written into the archive stream.
 */
export default class ArchiveGenerator {
    stream: ReadableStream<Uint8Array>;

    private writer: {
        write: (entry: {
            directory?: boolean;
            name: string;
            lastModified?: Date;
            stream?: () => ReadableStream<Uint8Array>;
        }) => Promise<void>;
        close: () => void;
        abort: (reason?: any) => void;
    };

    private canceled: boolean;

    private includedFiles: { path: string; name: string }[];

    private includedFolderPaths: Set<string>;

    private originalToAdjustedPath: Map<string, string>;

    constructor() {
        const { readable, writable } = new ZipWriter();
        const writer = writable.getWriter();

        this.stream = readable;
        this.writer = writer;
        this.canceled = false;

        this.includedFiles = [];
        this.includedFolderPaths = new Set();
        this.originalToAdjustedPath = new Map();
    }

    async writeLinks(links: AsyncGenerator<StartedNestedLinkDownload>) {
        const promises: Promise<void>[] = [];
        for await (const link of links) {
            if (this.canceled) {
                return;
            }
            if (link.isFile) {
                const name = this.adjustFilePath(link.parentPath, link.name);
                promises.push(
                    this.writer.write({
                        name: name.slice(1), // Windows doesn't like leading root slash.
                        // lastModified: new Date(),
                        stream: () => link.stream,
                    })
                );
            } else {
                const name = this.adjustFolderPath(link.parentPath, link.name);
                promises.push(
                    this.writer.write({
                        directory: true,
                        name: name.slice(1), // Windows doesn't like leading root slash.
                        // lastModified: new Date(),
                    })
                );
            }
        }
        if (!this.canceled) {
            await Promise.all(promises).then(() => {
                this.writer.close();
            });
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

            if (this.includedFolderPaths.has(adjustedPath.toLowerCase())) {
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
                )
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
        const error = new TransferCancel({ message: `Transfer canceled` });
        this.writer.abort(error);
    }
}
