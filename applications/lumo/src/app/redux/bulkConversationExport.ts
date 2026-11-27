import { Zip, ZipDeflate, strToU8 } from 'fflate';
import { c } from 'ttag';

import { convertConversationToJson } from '../components/Modals/ConversationExportModal/convertConversationToJson';
import { convertConversationToMarkdown } from '../components/Modals/ConversationExportModal/convertConversationToMarkdown';
import type { Format } from '../components/Modals/ConversationExportModal/exportConversation';
import {
    getConversationExportBasename,
    sanitizeTitle,
} from '../components/Modals/ConversationExportModal/exportConversation';
import type { ConversationId, SpaceId } from '../types';
import { SpaceType } from '../types';
import { getIsMobileDevice } from '../util/device';
import { isNativeMobileApp } from '../util/userAgent';
import { prepareConversationExport } from './sagas/conversationSnapshot';
import type { LumoDispatch, LumoState } from './store';

export const EXPORT_LOG_FILENAME = 'export-log.txt';

export type BulkConversationExportProgress = { completed: number; total: number };

export type BulkConversationExportResult = {
    /** Number of chat files in the archive. */
    count: number;
    /** Number of chats listed in the export log because they are incomplete or missing. */
    issues: number;
    file: Blob;
};

type ZipEntry = { name: string; input: string; lastModified?: Date };
type ProjectArchiveFolder = { name: string; filenames: Set<string> };

function reserveArchiveName(names: Set<string>, basename: string, extension = '') {
    // Windows treats these device names as reserved even when they have an extension.
    const stem = /^(?:con|prn|aux|nul|com[0-9¹²³]|lpt[0-9¹²³])(?:\.|$)/i.test(basename) ? `_${basename}` : basename;
    let name = `${stem}${extension}`;
    for (let suffix = 2; names.has(name.normalize('NFC').toLowerCase()); suffix++) {
        name = `${stem} (${suffix})${extension}`;
    }
    names.add(name.normalize('NFC').toLowerCase());
    return name;
}

/**
 * Limit bulk exports to desktop only as mobile browsers and the native apps have tight memory limits.
 */
export const isBulkConversationExportSupported = () => !isNativeMobileApp() && !getIsMobileDevice();

/** Thrown when the chat list is not loaded from the server yet, so an export could miss chats. */
export class ChatHistoryNotLoadedError extends Error {
    /** True while the startup load is still running, false when it finished without succeeding. */
    readonly loading: boolean;

    constructor(loading: boolean) {
        super(loading ? 'The chat history is still loading' : 'The chat history could not be loaded');
        this.loading = loading;
    }
}

/**
 * Exports the chats already listed in Redux, either all of them or those of one project, as a ZIP archive.
 * Each chat goes through the same loader as a single-chat export. When a chat cannot be verified,
 * the messages available on this device are exported instead and the chat is listed in an export log.
 * Each chat is compressed into the archive as soon as it is converted, so only the compressed archive is kept
 * in memory rather than every converted chat.
 */
export const prepareBulkConversationExport =
    (
        spaceId: SpaceId | undefined,
        signal: AbortSignal,
        format: Format = 'json',
        onProgress?: (progress: BulkConversationExportProgress) => void
    ) =>
    async (dispatch: LumoDispatch, getState: () => LumoState): Promise<BulkConversationExportResult> => {
        signal.throwIfAborted();
        if (!isBulkConversationExportSupported()) {
            throw new Error('Exporting several chats is not supported on mobile devices');
        }
        const state = getState();
        // The chat list comes from the startup space pull, so it may be missing chats until that pull succeeds.
        const { lastSpacesPullAt, spacesPullSettled } = state.initialization;
        if (!lastSpacesPullAt) {
            throw new ChatHistoryNotLoadedError(!spacesPullSettled);
        }
        // Export saved chats in creation order so duplicate filenames get consistent suffixes.
        const conversations = Object.values(state.conversations)
            .filter((conversation) => !conversation.ghost && (!spaceId || conversation.spaceId === spaceId))
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

        // Files and folders at the archive root share a namespace with the export log.
        const rootNames = new Set([EXPORT_LOG_FILENAME]);
        const projectFolders = new Map<SpaceId, ProjectArchiveFolder>();
        // Reserve project folders before naming chat files. Filenames only need to be unique within their folder.
        for (const { spaceId: parentId } of conversations) {
            const project = state.spaces[parentId];
            if (project?.spaceType !== SpaceType.Project || projectFolders.has(parentId)) {
                continue;
            }
            // translator: Fallback display name for a project without a name, including in export folder names.
            const untitledProject = c('collider_2025:Label').t`Untitled project`;
            const basename = sanitizeTitle(project.projectName ?? '') || sanitizeTitle(untitledProject) || 'project';
            projectFolders.set(parentId, { name: reserveArchiveName(rootNames, basename), filenames: new Set() });
        }
        const convert = format === 'json' ? convertConversationToJson : convertConversationToMarkdown;
        const issues: string[] = [];
        let count = 0;

        const load = (id: ConversationId, allowUnverified: boolean) =>
            dispatch(prepareConversationExport(id, false, signal, allowUnverified));

        // The ZIP stream pulls one entry at a time, so each chat is loaded only when the previous one is written.
        async function* entries(): AsyncGenerator<ZipEntry> {
            const total = conversations.length;
            onProgress?.({ completed: 0, total });
            for (const [index, { id, title, spaceId: parentId }] of conversations.entries()) {
                signal.throwIfAborted();
                let snapshot: Awaited<ReturnType<typeof load>> | undefined;
                let incomplete = false;
                try {
                    snapshot = await load(id, false);
                } catch {
                    // Cancellation stops the export. Other failures get one attempt using locally available messages.
                    signal.throwIfAborted();
                    incomplete = true;
                    snapshot = await load(id, true).catch(() => {
                        signal.throwIfAborted();
                        return undefined;
                    });
                }

                const hasMessages =
                    snapshot && Object.values(snapshot.messages).some((message) => !message.placeholder);
                let entry: ZipEntry | undefined;
                if (snapshot && hasMessages) {
                    const folder = projectFolders.get(parentId);
                    // Use the title and timestamp from the loaded snapshot, which may be newer than the chat list.
                    const basename = getConversationExportBasename(snapshot.conversation.title) || 'chat';
                    const name = reserveArchiveName(folder?.filenames ?? rootNames, basename, `.${format}`);
                    const filename = folder ? `${folder.name}/${name}` : name;
                    entry = {
                        name: filename,
                        input: convert(snapshot.conversation, snapshot.messages),
                        lastModified: new Date(snapshot.conversation.updatedAt),
                    };
                    count += 1;
                    if (incomplete) {
                        // translator: Line in the export log file. ${filename} is a chat file in the downloaded archive.
                        issues.push(
                            c('collider_2025:Info')
                                .t`${filename}: only the messages available on this device were exported.`
                        );
                    }
                } else if (incomplete) {
                    // translator: Line in the export log file. ${title} is the title of a chat that is missing from the archive.
                    issues.push(c('collider_2025:Info').t`"${title}": this chat could not be exported.`);
                }
                // Progress counts every chat processed, including chats skipped or recorded in the log.
                onProgress?.({ completed: index + 1, total });
                if (entry) {
                    yield entry;
                }
            }

            if (issues.length) {
                // translator: First line of the log file added to a chat export archive when some chats are incomplete or missing.
                const heading = c('collider_2025:Info').t`Some chats could not be fully exported:`;
                yield { name: EXPORT_LOG_FILENAME, input: [heading, ...issues].join('\n') };
            }
        }

        const file = await zipEntries(entries());
        signal.throwIfAborted();
        return { count, issues: issues.length, file };
    };

/** Compresses each entry as soon as it is produced, keeping only the compressed chunks. */
async function zipEntries(entries: AsyncIterable<ZipEntry>): Promise<Blob> {
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let failure: Error | null = null;
    const zip = new Zip((error, chunk) => {
        if (error) {
            failure = error;
        } else {
            // fflate allocates each output chunk with its own ArrayBuffer.
            chunks.push(chunk as Uint8Array<ArrayBuffer>);
        }
    });
    try {
        for await (const { name, input, lastModified } of entries) {
            const file = new ZipDeflate(name, { level: 6 });
            if (lastModified) {
                file.mtime = lastModified;
            }
            zip.add(file);
            file.push(strToU8(input), true);
            if (failure) {
                throw failure;
            }
        }
        zip.end();
    } catch (error) {
        zip.terminate();
        throw error;
    }
    if (failure) {
        throw failure;
    }
    return new Blob(chunks, { type: 'application/zip' });
}
