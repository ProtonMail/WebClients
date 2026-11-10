import type { ClientToolExecutor, ClientToolResult } from '@proton/lumo-api-client/core/client-tools';
import { languageCode } from '@proton/shared/lib/i18n';

import { applyRetentionPolicy } from '../../../layouts/sidepanel/helpers';
import { isImageAttachment } from '../../../llm/attachments';
import type { LumoState } from '../../../redux/store';
import { clearAnalysisProgress, setAnalysisProgress } from '../../../services/analysisProgressStore';
import { BM25Index } from '../../../services/search/bm25Index';
import type { SearchService } from '../../../services/search/searchService';
import { STOPWORDS } from '../../../services/search/stopwords';
import {
    type Attachment,
    type ChatSearchReach,
    type Conversation,
    type ConversationId,
    type Message,
    type MessageId,
    Role,
    type SpaceId,
    isTextBlock,
} from '../../../types';
import type { RetrievalExclusions } from './exclusions';
import {
    MAX_MENTIONED_FILES,
    type NamedFile,
    findFilesByName,
    findMentionedFiles,
    normalizeFileName,
} from './fileNames';
import { countPdfPages } from '../../../lib/attachments/pdfChangeMarkup';
import { type AskModel, analyzeFile } from './fileAnalysis';
import { snippetAround, splitIntoPages } from './pages';
import {
    ANALYZE_FILE_TOOL_NAME,
    DEFAULT_RESULTS,
    MAX_GOAL_CHARS,
    MAX_FILE_IDS,
    MAX_QUERY_CHARS,
    MAX_PAGES_PER_READ,
    MAX_RESULTS,
    READ_KNOWLEDGE_TOOL_NAME,
    RETRIEVAL_SCOPES,
    RETRIEVAL_SOURCES,
    type RetrievalScope,
    type RetrievalSource,
    analyzeFileTool,
    readKnowledgeTool,
    searchKnowledgeTool,
} from './schema';

/**
 * Per reply, so retrieval rounds (which count against usage limits) stay bounded. Shared
 * across compaction retries of the same send because the executor is created once per send.
 */
export const MAX_RETRIEVAL_CALLS_PER_REPLY = 16;
export const MAX_READS_PER_REPLY = 10;
/** Whole-file analyses per reply; each runs a model call per few pages. */
export const MAX_ANALYSES_PER_REPLY = 3;
/**
 * What one reply may read in total, about 75K tokens. Reads are limited by how much text they
 * return, not only by how many calls were made, so a long document costs a few multi-page reads
 * instead of one call per page. Whatever is left unread is reported with next_page.
 */
export const MAX_READ_CHARS_PER_REPLY = 300_000;
/** Indexed documents shortlisted before their pages are ranked. */
const MAX_INDEXED_DOCUMENTS = 8;
/** Newest messages considered when searching chats, so a long history stays fast. */
const MAX_MESSAGE_CANDIDATES = 2_000;
/** Other chats searched per call: the index's best matches, plus the latest ones it may not have caught up with. */
const MAX_RANKED_CONVERSATIONS = 25;
const RECENT_CONVERSATIONS = 5;
const MAX_ID_CHARS = 128;
const MAX_FILE_NAME_CHARS = 300;
/** Chats named to the model as likely relevant before it answers. */
const MAX_RELATED_CHATS = 3;
/** Chats weighed for that hint when the index has no match, newest first. */
const MAX_RELATED_CANDIDATES = 50;
/** Text of a chat weighed for that hint, so one long chat stays cheap. */
const MAX_RELATED_CHAT_CHARS = 20_000;
/** Share of the query's weight a chat must match to be named. */
const MIN_RELATED_COVERAGE = 0.6;
/** Distinct query words a chat must contain, so one common word is never enough. */
const MIN_RELATED_WORDS = 2;

export type RetrievalIndex = Pick<
    SearchService,
    'rankDocumentsInScope' | 'getIndexedDocument' | 'listDocuments' | 'rankConversations'
>;

export type RetrievalContext = {
    conversationId: ConversationId;
    spaceId: SpaceId;
    isProject: boolean;
    /** Ghost chats and guests can only look inside the current chat. */
    allowWideScopes: boolean;
    /**
     * Which other chats' messages can be searched and read (with wider scopes): none, the
     * current project's, or all. The current chat's own messages are always searchable.
     */
    chatSearch: ChatSearchReach;
    /**
     * Search and read files of other projects and spaces (scope "all"). Off unless the user
     * turns it on; this chat's files and the current project's files are always reachable.
     */
    searchOtherSpaces: boolean;
    /** Whether another space lets chats elsewhere reach its chats or files; read at call time. */
    allowsSearchFromOutside: (spaceId: SpaceId | undefined) => boolean;
    hasLumoPlus: boolean;
    /** Messages already sent in full with the request, left out of message search. */
    getVisibleMessageIds: () => ReadonlySet<MessageId>;
    /** Every attachment of the current chat, with its converted text. */
    chatAttachments: Attachment[];
    /** Files the user switched off in this chat: never found, read or listed. */
    exclusions: RetrievalExclusions;
    getState: () => Pick<LumoState, 'conversations' | 'messages'>;
    /** The user's search index; absent for guests and ghost chats. */
    index?: RetrievalIndex;
    /**
     * Asks a small model one question and returns its reply. When present the model may have a
     * whole file read for it (analyze_file); without it the tool is not offered.
     */
    analyze?: AskModel;
    /** Stops the reply; a file analysis in progress throws instead of reporting what it had read. */
    signal?: AbortSignal;
};

type FileSource = { id: string; name: string; text: string };

const errorResult = (error: string): ClientToolResult => ({
    is_error: true,
    content: JSON.stringify({ ok: false, error }),
});

const parseArguments = (rawArguments: string): Record<string, unknown> | undefined => {
    try {
        const args: unknown = JSON.parse(rawArguments);
        return typeof args === 'object' && args !== null && !Array.isArray(args)
            ? (args as Record<string, unknown>)
            : undefined;
    } catch {
        return undefined;
    }
};

const isId = (value: unknown): value is string =>
    typeof value === 'string' && value.length > 0 && value.length <= MAX_ID_CHARS;

function getMessageText(message: Message): string {
    const blocks = message.blocks?.filter(isTextBlock).map((block) => block.content) ?? [];
    return (blocks.length > 0 ? blocks.join('\n\n') : (message.content ?? '')).trim();
}

const isTextAttachment = (attachment: Attachment) => !isImageAttachment(attachment) && !!attachment.markdown?.trim();

const isSearchableConversation = (conversation: Conversation | undefined) =>
    !!conversation && !conversation.ghost && !conversation.scheduleRun;

const isReachableChat = (context: RetrievalContext, conversation: Conversation) =>
    conversation.spaceId === context.spaceId ||
    (context.chatSearch === 'all' && context.allowsSearchFromOutside(conversation.spaceId));

/** Chats other than this one whose messages `scope` may search; none when chat search is off. */
function otherChatsInScope(context: RetrievalContext, scope: RetrievalScope): Conversation[] {
    if (scope === 'this_chat' || context.chatSearch === 'none') {
        return [];
    }
    const everywhere = scope === 'all' && context.chatSearch === 'all';
    const inScope = Object.values(context.getState().conversations).filter(
        (conversation) =>
            conversation.id !== context.conversationId &&
            isSearchableConversation(conversation) &&
            (everywhere ? isReachableChat(context, conversation) : conversation.spaceId === context.spaceId)
    );
    return applyRetentionPolicy(inScope, context.hasLumoPlus);
}

const newestFirst = (conversations: Conversation[]) =>
    [...conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

/**
 * Other chats worth searching: the index's best matches for the query among the allowed ones,
 * plus the most recently updated. Without index matches, every allowed chat.
 */
async function shortlistConversations(
    context: RetrievalContext,
    query: string,
    allowed: Conversation[]
): Promise<ConversationId[]> {
    const allowedIds = new Set(allowed.map((conversation) => conversation.id));
    const ranked =
        (await context.index?.rankConversations(query, MAX_RANKED_CONVERSATIONS, allowedIds).catch(() => [])) ?? [];
    const matches = ranked.filter((id) => allowedIds.has(id)).slice(0, MAX_RANKED_CONVERSATIONS);
    if (matches.length === 0) {
        return [...allowedIds];
    }
    const recent = newestFirst(allowed)
        .slice(0, RECENT_CONVERSATIONS)
        .map((conversation) => conversation.id);
    return [...new Set([...matches, ...recent])];
}

const isLookupMessage = (message: Message) =>
    (message.role === Role.User || message.role === Role.Assistant) && !message.compaction && !message.placeholder;

type Parsed<T> = { value: T } | { error: string };

/** The project in a project; outside one, everything the user lets this chat reach. */
function defaultScope(context: RetrievalContext): RetrievalScope {
    if (!context.allowWideScopes) {
        return 'this_chat';
    }
    if (context.isProject) {
        return 'project';
    }
    return context.chatSearch === 'all' || context.searchOtherSpaces ? 'all' : 'this_chat';
}

function parseScope(value: unknown, context: RetrievalContext): Parsed<RetrievalScope> {
    const scope = value ?? defaultScope(context);
    if (typeof scope !== 'string' || !(RETRIEVAL_SCOPES as readonly string[]).includes(scope)) {
        return { error: `scope must be one of: ${RETRIEVAL_SCOPES.join(', ')}` };
    }
    if (scope === 'project' && !context.isProject) {
        return { error: 'This chat is not in a project. Use "this_chat" or "all".' };
    }
    if (scope !== 'this_chat' && !context.allowWideScopes) {
        return { error: 'Only this chat can be searched here. Use "this_chat".' };
    }
    if (scope === 'all' && !context.searchOtherSpaces && context.chatSearch !== 'all') {
        return {
            error: context.isProject
                ? 'Searching outside this project is turned off. Use "project" or "this_chat".'
                : 'Searching other chats and projects is turned off. Use "this_chat".',
        };
    }
    return { value: scope as RetrievalScope };
}

function parseSources(value: unknown): Parsed<RetrievalSource[]> {
    if (value === undefined) {
        return { value: [...RETRIEVAL_SOURCES] };
    }
    const valid =
        Array.isArray(value) &&
        value.length > 0 &&
        value.every((source) => (RETRIEVAL_SOURCES as readonly unknown[]).includes(source));
    return valid
        ? { value: value as RetrievalSource[] }
        : { error: `sources must be a non-empty list of: ${RETRIEVAL_SOURCES.join(', ')}` };
}

function parseFileIds(value: unknown): Parsed<ReadonlySet<string> | undefined> {
    if (value === undefined) {
        return { value: undefined };
    }
    if (!Array.isArray(value) || value.length === 0 || value.length > MAX_FILE_IDS || !value.every(isId)) {
        return { error: `file_ids must be a list of 1 to ${MAX_FILE_IDS} file ids` };
    }
    return { value: new Set(value) };
}

function parseLimit(value: unknown): Parsed<number> {
    if (value === undefined) {
        return { value: DEFAULT_RESULTS };
    }
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > MAX_RESULTS) {
        return { error: `limit must be an integer from 1 to ${MAX_RESULTS}` };
    }
    return { value };
}

function parsePage(value: unknown): Parsed<number> {
    if (value === undefined) {
        return { value: 1 };
    }
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
        return { error: 'page must be an integer starting at 1' };
    }
    return { value };
}

function parsePageCount(value: unknown): Parsed<number> {
    if (value === undefined) {
        return { value: 1 };
    }
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > MAX_PAGES_PER_READ) {
        return { error: `page_count must be an integer from 1 to ${MAX_PAGES_PER_READ}` };
    }
    return { value };
}

/** Counts for one reply's lookups. Never queries, names or results. */
export type RetrievalUsage = {
    searches: number;
    emptySearches: number;
    reads: number;
    errors: number;
    callLimitHit: boolean;
    readLimitHit: boolean;
};

export type RetrievalToolExecutor = ClientToolExecutor & { getUsage: () => RetrievalUsage };

export const createRetrievalToolExecutor = (context: RetrievalContext): RetrievalToolExecutor => {
    const tools = [searchKnowledgeTool, readKnowledgeTool, ...(context.analyze ? [analyzeFileTool] : [])];
    const toolNames = new Set(tools.map((tool) => tool.function.name));
    const pagesById = new Map<string, string[]>();
    let calls = 0;
    let analyses = 0;
    let reads = 0;
    let readChars = 0;
    const usage: RetrievalUsage = {
        searches: 0,
        emptySearches: 0,
        reads: 0,
        errors: 0,
        callLimitHit: false,
        readLimitHit: false,
    };

    const pagesOf = (key: string, text: string) => {
        let pages = pagesById.get(key);
        if (!pages) {
            pages = splitIntoPages(text);
            pagesById.set(key, pages);
        }
        return pages;
    };

    const chatFiles = (): FileSource[] =>
        context.chatAttachments
            .filter(
                (attachment) => isTextAttachment(attachment) && !context.exclusions.attachmentIds.has(attachment.id)
            )
            .map((attachment) => ({ id: attachment.id, name: attachment.filename, text: attachment.markdown! }));

    const findChatFile = (fileId: string) => chatFiles().find((file) => file.id === fileId);

    const isReachableFileSpace = (spaceId: string | undefined) =>
        spaceId === context.spaceId ||
        (context.searchOtherSpaces && context.allowsSearchFromOutside(spaceId as SpaceId | undefined));

    /** Files the model may name, nearest first: this chat, the current space, then everything. */
    let knownFileGroups: Promise<NamedFile[][]> | undefined;
    const getKnownFileGroups = () => {
        knownFileGroups ??= (async () => {
            const groups: NamedFile[][] = [chatFiles().map(({ id, name }) => ({ id, name }))];
            if (context.allowWideScopes && context.index) {
                const spaceFiles = await context.index.listDocuments({ spaceId: context.spaceId }).catch(() => []);
                groups.push(spaceFiles.filter((file) => !context.exclusions.documentIds.has(file.id)));
                if (context.searchOtherSpaces) {
                    const allFiles = await context.index.listDocuments().catch(() => []);
                    groups.push(
                        allFiles.filter(
                            (file) => isReachableFileSpace(file.spaceId) && !context.exclusions.documentIds.has(file.id)
                        )
                    );
                }
            }
            return groups;
        })();
        return knownFileGroups;
    };

    /** A name resolves to its nearest file: one of this space hides a same-named file elsewhere. */
    const mentionedFiles = async (text: string, excludeId: string) => {
        const seenIds = new Set<string>();
        const nearerNames = new Set<string>();
        const found: NamedFile[] = [];
        for (const group of await getKnownFileGroups()) {
            const fresh = group.filter((file) => !seenIds.has(file.id));
            fresh.forEach((file) => seenIds.add(file.id));
            const inGroup = findMentionedFiles(text, fresh, excludeId).filter(
                (file) => !nearerNames.has(normalizeFileName(file.name))
            );
            found.push(...inGroup);
            fresh.forEach((file) => nearerNames.add(normalizeFileName(file.name)));
        }
        const mentioned = found.slice(0, MAX_MENTIONED_FILES).map((file) => ({
            file_id: file.id,
            file_name: file.name,
            ...(file.folderPath && { folder: file.folderPath }),
        }));
        return mentioned.length > 0 ? { mentioned_files: mentioned } : {};
    };

    const resolveFileName = async (fileName: string): Promise<{ fileId: string } | { result: ClientToolResult }> => {
        for (const group of await getKnownFileGroups()) {
            const matches = findFilesByName(fileName, group);
            if (matches.length === 1) {
                return { fileId: matches[0]!.id };
            }
            if (matches.length > 1) {
                return {
                    result: {
                        is_error: true,
                        content: JSON.stringify({
                            ok: false,
                            error: 'Several files match this name. Read one of them by file_id.',
                            matches: matches.map((file) => ({
                                file_id: file.id,
                                file_name: file.name,
                                ...(file.folderPath && { folder: file.folderPath }),
                            })),
                        }),
                    },
                };
            }
        }
        return {
            result: errorResult(
                'No file has this name. Try search_knowledge with distinctive words from its name or content.'
            ),
        };
    };

    const fileSources = async (
        query: string,
        scope: RetrievalScope,
        fileIds: ReadonlySet<string> | undefined
    ): Promise<FileSource[]> => {
        const files = chatFiles().filter((file) => !fileIds || fileIds.has(file.id));
        if (scope === 'this_chat' || !context.index) {
            return files;
        }
        const seen = new Set(files.map((file) => file.id));
        const everywhere = scope === 'all' && context.searchOtherSpaces;
        const ranked = await context.index.rankDocumentsInScope(
            query,
            { spaceId: everywhere ? undefined : context.spaceId, documentIds: fileIds },
            // Room for documents of spaces that turn out to be closed to this chat.
            everywhere ? MAX_INDEXED_DOCUMENTS * 4 : MAX_INDEXED_DOCUMENTS
        );
        let added = 0;
        for (const { id, spaceId } of ranked) {
            if (
                seen.has(id) ||
                context.exclusions.documentIds.has(id) ||
                !isReachableFileSpace(spaceId) ||
                added >= MAX_INDEXED_DOCUMENTS
            ) {
                continue;
            }
            const document = await context.index.getIndexedDocument(id);
            if (document?.text) {
                files.push({ id: document.id, name: document.name, text: document.text });
                seen.add(id);
                added += 1;
            }
        }
        return files;
    };

    const isReadableConversation = (conversationId: ConversationId): boolean => {
        if (conversationId === context.conversationId) {
            return true;
        }
        if (!context.allowWideScopes || context.chatSearch === 'none') {
            return false;
        }
        const conversation = context.getState().conversations[conversationId];
        return (
            isSearchableConversation(conversation) &&
            isReachableChat(context, conversation!) &&
            applyRetentionPolicy([conversation!], context.hasLumoPlus).length > 0
        );
    };

    const messageSources = async (query: string, scope: RetrievalScope): Promise<Message[]> => {
        const { messages } = context.getState();
        const visibleMessageIds = context.getVisibleMessageIds();
        const others = otherChatsInScope(context, scope);
        const allowedConversations = new Set<ConversationId>([
            context.conversationId,
            ...(others.length > 0 ? await shortlistConversations(context, query, others) : []),
        ]);
        return Object.values(messages)
            .filter(
                (message) =>
                    allowedConversations.has(message.conversationId) &&
                    !visibleMessageIds.has(message.id) &&
                    isLookupMessage(message)
            )
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, MAX_MESSAGE_CANDIDATES);
    };

    const runSearch = async (args: Record<string, unknown> | undefined): Promise<ClientToolResult> => {
        const query = typeof args?.query === 'string' ? args.query.trim().slice(0, MAX_QUERY_CHARS) : '';
        if (!query) {
            return errorResult('arguments: expected {"query": "<keywords>"}');
        }
        const scope = parseScope(args?.scope, context);
        if ('error' in scope) {
            return errorResult(scope.error);
        }
        const sources = parseSources(args?.sources);
        if ('error' in sources) {
            return errorResult(sources.error);
        }
        const fileIds = parseFileIds(args?.file_ids);
        if ('error' in fileIds) {
            return errorResult(fileIds.error);
        }
        const limit = parseLimit(args?.limit);
        if ('error' in limit) {
            return errorResult(limit.error);
        }
        const validScope = scope.value;
        const validSources = sources.value;
        const validFileIds = fileIds.value;

        const index = new BM25Index();
        type Candidate =
            | { id: string; text: string; kind: 'file'; file: FileSource; page: number; pages: number }
            | { id: string; text: string; kind: 'message'; message: Message };
        const candidates: Candidate[] = [];
        const unavailable: RetrievalSource[] = [];
        const load = <T>(source: RetrievalSource, sources: () => Promise<T[]>): Promise<T[]> =>
            sources().catch(() => {
                unavailable.push(source);
                return [];
            });

        if (validSources.includes('files')) {
            for (const file of await load('files', () => fileSources(query, validScope, validFileIds))) {
                const pages = pagesOf(`file:${file.id}`, file.text);
                pages.forEach((text, pageIndex) => {
                    candidates.push({
                        id: `file:${file.id}:${pageIndex}`,
                        text: `${file.name}\n${text}`,
                        kind: 'file',
                        file,
                        page: pageIndex + 1,
                        pages: pages.length,
                    });
                });
            }
        }
        if (validSources.includes('messages') && !validFileIds) {
            for (const message of await load('messages', () => messageSources(query, validScope))) {
                const text = getMessageText(message);
                if (text) {
                    candidates.push({ id: `message:${message.id}`, text, kind: 'message', message });
                }
            }
        }

        const searched = validSources.filter(
            (source) => !(source === 'messages' && validFileIds) && !unavailable.includes(source)
        );
        if (searched.length === 0 && unavailable.length > 0) {
            return errorResult('The lookup failed. Answer without it.');
        }

        candidates.forEach((candidate) => index.addDocument(candidate.id, candidate.text));
        const terms = index.getMatchingTerms(query);
        const ranked = index.rankDocuments(query, candidates, limit.value);
        const { conversations } = context.getState();

        const results = ranked.map(({ document: candidate, score }) => {
            const snippet = snippetAround(candidate.text, terms);
            if (candidate.kind === 'file') {
                return {
                    type: 'file',
                    file_id: candidate.file.id,
                    file_name: candidate.file.name,
                    page: candidate.page,
                    pages: candidate.pages,
                    snippet,
                    score: Number(score.toFixed(2)),
                };
            }
            const { message } = candidate;
            return {
                type: 'message',
                message_id: message.id,
                ...(message.conversationId !== context.conversationId && {
                    chat_title: conversations[message.conversationId]?.title || undefined,
                }),
                in_this_chat: message.conversationId === context.conversationId,
                role: message.role,
                date: message.createdAt.slice(0, 10),
                snippet,
                score: Number(score.toFixed(2)),
            };
        });

        return {
            content: JSON.stringify({
                ok: true,
                scope: validScope,
                results,
                ...(unavailable.length > 0 && {
                    unavailable_sources: unavailable,
                    warning: `The user's ${unavailable.join(' and ')} could not be searched right now; these results leave them out.`,
                }),
                ...(results.length === 0 && {
                    message: 'Nothing matched. Try other keywords, a wider scope, or answer without it.',
                }),
            }),
        };
    };

    /**
     * Up to `count` consecutive pages from `start`, stopping early when the reply's read budget
     * would be exceeded (the first page is always returned). `next_page` says where to continue.
     */
    const takePages = (pages: string[], start: number, count: number) => {
        const budget = MAX_READ_CHARS_PER_REPLY - readChars;
        const lastWanted = Math.min(pages.length, start + count - 1);
        let last = start - 1;
        let chars = 0;
        for (let page = start; page <= lastWanted; page += 1) {
            const length = pages[page - 1]!.length;
            if (page > start && chars + length > budget) {
                break;
            }
            chars += length;
            last = page;
        }
        readChars += chars;
        const content = pages.slice(start - 1, last).join('\n\n');
        return {
            content,
            window: {
                page: start,
                last_page: last,
                pages: pages.length,
                ...(last < pages.length && { next_page: last + 1 }),
            },
        };
    };

    const lookupFile = async (fileId: string): Promise<FileSource | undefined> => {
        let file: FileSource | undefined = findChatFile(fileId);
        if (!file && context.allowWideScopes && context.index && !context.exclusions.documentIds.has(fileId)) {
            const document = await context.index.getIndexedDocument(fileId);
            const reachable = !!document && isReachableFileSpace(document.spaceId);
            if (document?.text && reachable) {
                file = { id: document.id, name: document.name, text: document.text };
            }
        }
        return file;
    };

    const readFile = async (fileId: string, page: number, pageCount: number): Promise<ClientToolResult> => {
        const file = await lookupFile(fileId);
        if (!file) {
            return errorResult('Unknown file_id. Use an id from the file list or from search_knowledge results.');
        }
        const pages = pagesOf(`file:${file.id}`, file.text);
        if (page > pages.length) {
            return errorResult(`This file has ${pages.length} page(s).`);
        }
        const { content, window } = takePages(pages, page, pageCount);
        return {
            content: JSON.stringify({
                ok: true,
                file_id: file.id,
                file_name: file.name,
                ...(countPdfPages(file.text) && { pdf_pages: countPdfPages(file.text) }),
                ...window,
                content,
                ...(await mentionedFiles(content, file.id)),
            }),
        };
    };

    const readMessage = async (messageId: string, page: number, pageCount: number): Promise<ClientToolResult> => {
        const message = context.getState().messages[messageId];
        if (!message || !isReadableConversation(message.conversationId)) {
            return errorResult('Unknown message_id. Use an id from search_knowledge results.');
        }
        const pages = pagesOf(`message:${message.id}`, getMessageText(message));
        if (page > pages.length) {
            return errorResult(`This message has ${pages.length} page(s).`);
        }
        const { content, window } = takePages(pages, page, pageCount);
        return {
            content: JSON.stringify({
                ok: true,
                message_id: message.id,
                ...(message.conversationId !== context.conversationId && {
                    chat_title: context.getState().conversations[message.conversationId]?.title || undefined,
                }),
                in_this_chat: message.conversationId === context.conversationId,
                role: message.role,
                date: message.createdAt.slice(0, 10),
                ...window,
                content,
                ...(await mentionedFiles(content, '')),
            }),
        };
    };

    const runRead = async (args: Record<string, unknown> | undefined): Promise<ClientToolResult> => {
        const page = parsePage(args?.page);
        if ('error' in page) {
            return errorResult(page.error);
        }
        const pageCount = parsePageCount(args?.page_count);
        if ('error' in pageCount) {
            return errorResult(pageCount.error);
        }
        const given = ['file_id', 'file_name', 'message_id'].filter((key) => args?.[key] !== undefined);
        if (given.length === 1 && isId(args?.file_id)) {
            return readFile(args.file_id, page.value, pageCount.value);
        }
        if (given.length === 1 && isId(args?.message_id)) {
            return readMessage(args.message_id, page.value, pageCount.value);
        }
        const fileName = args?.file_name;
        if (
            given.length === 1 &&
            typeof fileName === 'string' &&
            fileName.trim() &&
            fileName.length <= MAX_FILE_NAME_CHARS
        ) {
            const resolved = await resolveFileName(fileName);
            return 'fileId' in resolved ? readFile(resolved.fileId, page.value, pageCount.value) : resolved.result;
        }
        return errorResult(
            'arguments: expected one of {"file_id": "<id>"}, {"file_name": "<name>"} or {"message_id": "<id>"}, and optionally "page" and "page_count"'
        );
    };

    const runAnalyze = async (
        args: Record<string, unknown> | undefined,
        callId: string | undefined
    ): Promise<ClientToolResult> => {
        const goal = typeof args?.goal === 'string' ? args.goal.trim() : '';
        if (!goal || goal.length > MAX_GOAL_CHARS) {
            return errorResult(`goal must say what you need from the file, in at most ${MAX_GOAL_CHARS} characters`);
        }
        const given = ['file_id', 'file_name'].filter((key) => args?.[key] !== undefined);
        let fileId: string | undefined;
        if (given.length === 1 && isId(args?.file_id)) {
            fileId = args.file_id;
        } else if (
            given.length === 1 &&
            typeof args?.file_name === 'string' &&
            args.file_name.trim() &&
            args.file_name.length <= MAX_FILE_NAME_CHARS
        ) {
            const resolved = await resolveFileName(args.file_name);
            if (!('fileId' in resolved)) {
                return resolved.result;
            }
            fileId = resolved.fileId;
        }
        if (!fileId) {
            return errorResult('arguments: expected one of {"file_id": "<id>"} or {"file_name": "<name>"}, and a "goal"');
        }
        const file = await lookupFile(fileId);
        if (!file) {
            return errorResult('Unknown file_id. Use an id from the file list or from search_knowledge results.');
        }
        const pages = pagesOf(`file:${file.id}`, file.text);
        const pdfPages = countPdfPages(file.text);
        const analysis = await analyzeFile({
            pages,
            fileName: file.name,
            goal,
            ask: context.analyze!,
            signal: context.signal,
            onProgress: callId ? (step) => setAnalysisProgress(callId, step) : undefined,
        }).finally(() => callId && clearAnalysisProgress(callId));
        if (analysis.failedPages.length === analysis.parts) {
            return errorResult(
                'The helper could not read this file. Read it yourself with read_knowledge, or tell the user it could not be analysed.'
            );
        }
        const warnings = [
            ...(analysis.failedPages.length > 0
                ? [
                      `The helper failed on pages ${analysis.failedPages.join(', ')}, so the notes leave them out. Read them with read_knowledge or say they were not covered.`,
                  ]
                : []),
            ...(analysis.notReachedFromPage !== undefined
                ? [
                      `The file is longer than one analysis covers: pages ${analysis.notReachedFromPage} to ${pages.length} were not analysed. Say so, or read them with read_knowledge.`,
                  ]
                : []),
            ...(analysis.trimmed ? ['The notes were cut to fit, so they end early.'] : []),
        ];
        return {
            content: JSON.stringify({
                ok: true,
                file_id: file.id,
                file_name: file.name,
                pages: pages.length,
                ...(pdfPages && { pdf_pages: pdfPages }),
                notes: analysis.notes || 'Nothing in the file matched the goal.',
                ...(warnings.length > 0 && { warnings }),
            }),
        };
    };

    const runCall = async (name: string, rawArguments: string, callId?: string): Promise<ClientToolResult> => {
        calls += 1;
        if (calls > MAX_RETRIEVAL_CALLS_PER_REPLY) {
            usage.callLimitHit = true;
            return errorResult(
                'Retrieval limit for this reply reached. Answer with what you have, and tell the user which parts you could not look up.'
            );
        }
        const args = parseArguments(rawArguments);
        if (name === ANALYZE_FILE_TOOL_NAME) {
            if (analyses >= MAX_ANALYSES_PER_REPLY) {
                usage.callLimitHit = true;
                return errorResult(
                    'Analysis limit for this reply reached. Answer with what you have, and tell the user which files you could not analyse.'
                );
            }
            analyses += 1;
            const result = await runAnalyze(args, callId);
            if (result.is_error) {
                usage.errors += 1;
            } else {
                usage.reads += 1;
            }
            return result;
        }
        if (name === READ_KNOWLEDGE_TOOL_NAME) {
            if (reads >= MAX_READS_PER_REPLY || readChars >= MAX_READ_CHARS_PER_REPLY) {
                usage.readLimitHit = true;
                return errorResult(
                    'Read limit for this reply reached. Answer with what you have, and tell the user which parts you could not read.'
                );
            }
            const result = await runRead(args);
            if (result.is_error) {
                usage.errors += 1;
            } else {
                reads += 1;
                usage.reads += 1;
            }
            return result;
        }
        const result = await runSearch(args);
        if (result.is_error) {
            usage.errors += 1;
        } else {
            usage.searches += 1;
            if ((JSON.parse(result.content) as { results: unknown[] }).results.length === 0) {
                usage.emptySearches += 1;
            }
        }
        return result;
    };

    return {
        getUsage: () => ({ ...usage }),
        getClientTools: async () => tools,
        canExecute: (name) => toolNames.has(name),
        execute: async (toolCalls) => {
            const results: ClientToolResult[] = [];
            for (const call of toolCalls) {
                results.push(
                    await runCall(call.name, call.arguments, call.id).catch(() => {
                        usage.errors += 1;
                        return errorResult('The lookup failed. Answer without it.');
                    })
                );
            }
            return results;
        },
    };
};

export type RelatedChat = { conversationId: ConversationId; title: string; date: string };

/** Scripts written without spaces, where two-character words are common and meaningful. */
const SHORT_WORD_SCRIPTS = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

let wordSegmenter: { locale: string; segmenter: Intl.Segmenter } | undefined;

/**
 * Words in `text`, split by the locale-aware segmenter so unspaced Chinese, Japanese or Thai is split
 * into words too. Older browsers without `Intl.Segmenter` fall back to runs of letters and digits.
 */
const splitWords = (text: string): string[] => {
    if (typeof Intl.Segmenter !== 'function') {
        return text.match(/[\p{L}\p{N}]+/gu) ?? [];
    }
    if (wordSegmenter?.locale !== languageCode) {
        wordSegmenter = { locale: languageCode, segmenter: new Intl.Segmenter(languageCode, { granularity: 'word' }) };
    }
    return Array.from(wordSegmenter.segmenter.segment(text)).flatMap(({ segment, isWordLike }) =>
        isWordLike ? [segment] : []
    );
};

const isMeaningfulWord = (word: string) =>
    !STOPWORDS.has(word) && (word.length >= 3 || (word.length >= 2 && SHORT_WORD_SCRIPTS.test(word)));

export const distinctWords = (text: string) => new Set(splitWords(text.toLowerCase()).filter(isMeaningfulWord));

/**
 * Other chats this chat may search that clearly match `query`: most of its weight and at least two
 * of its words (or its only word). Best first; empty when chat search is off or nothing matches well.
 */
export async function findRelatedChats(context: RetrievalContext, query: string): Promise<RelatedChat[]> {
    const queryWords = distinctWords(query);
    if (!context.allowWideScopes || queryWords.size === 0) {
        return [];
    }
    const allowed = otherChatsInScope(context, defaultScope(context));
    if (allowed.length === 0) {
        return [];
    }
    const shortlisted = await shortlistConversations(context, query, allowed);
    const candidateIds = new Set(
        shortlisted.length < allowed.length
            ? shortlisted
            : newestFirst(allowed)
                  .slice(0, MAX_RELATED_CANDIDATES)
                  .map((conversation) => conversation.id)
    );
    const candidates = allowed.filter((conversation) => candidateIds.has(conversation.id));

    const textByChat = new Map(candidates.map((conversation) => [conversation.id, [conversation.title ?? '']]));
    for (const message of Object.values(context.getState().messages)) {
        if (isLookupMessage(message)) {
            textByChat.get(message.conversationId)?.push(getMessageText(message));
        }
    }
    const documents = candidates.map((conversation) => ({
        id: conversation.id,
        text: textByChat.get(conversation.id)!.join('\n').slice(0, MAX_RELATED_CHAT_CHARS),
        conversation,
    }));

    const index = new BM25Index();
    documents.forEach((document) => index.addDocument(document.id, document.text));
    const minWords = Math.min(MIN_RELATED_WORDS, queryWords.size);
    return index
        .rankDocuments(query, documents)
        .filter(({ document, coverage }) => {
            if (coverage < MIN_RELATED_COVERAGE) {
                return false;
            }
            const words = distinctWords(document.text);
            return [...queryWords].filter((word) => words.has(word)).length >= minWords;
        })
        .slice(0, MAX_RELATED_CHATS)
        .map(({ document: { conversation } }) => ({
            conversationId: conversation.id,
            title: conversation.title,
            date: conversation.updatedAt.slice(0, 10),
        }));
}
