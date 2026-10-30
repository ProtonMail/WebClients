import type { ClientToolExecutor, ClientToolResult } from '@proton/lumo-api-client/core/client-tools';

import { applyRetentionPolicy } from '../../../layouts/sidepanel/helpers';
import { isImageAttachment } from '../../../llm/attachments';
import type { LumoState } from '../../../redux/store';
import { BM25Index } from '../../../services/search/bm25Index';
import type { SearchService } from '../../../services/search/searchService';
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
import {
    MAX_MENTIONED_FILES,
    type NamedFile,
    findFilesByName,
    findMentionedFiles,
    normalizeFileName,
} from './fileNames';
import { snippetAround, splitIntoPages } from './pages';
import {
    DEFAULT_RESULTS,
    MAX_FILE_IDS,
    MAX_QUERY_CHARS,
    MAX_RESULTS,
    READ_KNOWLEDGE_TOOL_NAME,
    RETRIEVAL_SCOPES,
    RETRIEVAL_SOURCES,
    type RetrievalScope,
    type RetrievalSource,
    readKnowledgeTool,
    searchKnowledgeTool,
} from './schema';

/**
 * Per reply, so retrieval rounds (which count against usage limits) stay bounded. Shared
 * across compaction retries of the same send because the executor is created once per send.
 */
export const MAX_RETRIEVAL_CALLS_PER_REPLY = 8;
export const MAX_READS_PER_REPLY = 4;
/** Indexed documents shortlisted before their pages are ranked. */
const MAX_INDEXED_DOCUMENTS = 8;
/** Newest messages considered when searching chats, so a long history stays fast. */
const MAX_MESSAGE_CANDIDATES = 2_000;
const MAX_ID_CHARS = 128;
const MAX_FILE_NAME_CHARS = 300;

export type RetrievalIndex = Pick<SearchService, 'rankDocumentsInScope' | 'getIndexedDocument' | 'listDocuments'>;

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
    hasLumoPlus: boolean;
    /** Messages already sent in full with the request, left out of message search. */
    getVisibleMessageIds: () => ReadonlySet<MessageId>;
    /** Every attachment of the current chat, with its converted text. */
    chatAttachments: Attachment[];
    getState: () => Pick<LumoState, 'conversations' | 'messages'>;
    /** The user's search index; absent for guests and ghost chats. */
    index?: RetrievalIndex;
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

type Parsed<T> = { value: T } | { error: string };

function parseScope(value: unknown, context: RetrievalContext): Parsed<RetrievalScope> {
    const scope = value ?? (context.isProject ? 'project' : 'this_chat');
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

export const createRetrievalToolExecutor = (context: RetrievalContext): ClientToolExecutor => {
    const tools = [searchKnowledgeTool, readKnowledgeTool];
    const toolNames = new Set(tools.map((tool) => tool.function.name));
    const pagesById = new Map<string, string[]>();
    let calls = 0;
    let reads = 0;

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
            .filter(isTextAttachment)
            .map((attachment) => ({ id: attachment.id, name: attachment.filename, text: attachment.markdown! }));

    const findChatFile = (fileId: string) => chatFiles().find((file) => file.id === fileId);

    /** Files the model may name, nearest first: this chat, the current space, then everything. */
    let knownFileGroups: Promise<NamedFile[][]> | undefined;
    const getKnownFileGroups = () => {
        knownFileGroups ??= (async () => {
            const groups: NamedFile[][] = [chatFiles().map(({ id, name }) => ({ id, name }))];
            if (context.allowWideScopes && context.index) {
                groups.push(await context.index.listDocuments({ spaceId: context.spaceId }).catch(() => []));
                if (context.searchOtherSpaces) {
                    groups.push(await context.index.listDocuments().catch(() => []));
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
        const ranked = await context.index.rankDocumentsInScope(
            query,
            {
                spaceId: scope === 'all' && context.searchOtherSpaces ? undefined : context.spaceId,
                documentIds: fileIds,
            },
            MAX_INDEXED_DOCUMENTS
        );
        for (const { id } of ranked) {
            if (seen.has(id)) {
                continue;
            }
            const document = await context.index.getIndexedDocument(id);
            if (document?.text) {
                files.push({ id: document.id, name: document.name, text: document.text });
                seen.add(id);
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
            (context.chatSearch === 'all' || conversation!.spaceId === context.spaceId) &&
            applyRetentionPolicy([conversation!], context.hasLumoPlus).length > 0
        );
    };

    const messageSources = (scope: RetrievalScope): Message[] => {
        const { conversations, messages } = context.getState();
        const visibleMessageIds = context.getVisibleMessageIds();
        let allowedConversations: Set<ConversationId>;
        if (scope === 'this_chat' || context.chatSearch === 'none') {
            allowedConversations = new Set([context.conversationId]);
        } else {
            const everywhere = scope === 'all' && context.chatSearch === 'all';
            const inScope = Object.values(conversations).filter(
                (conversation) =>
                    isSearchableConversation(conversation) && (everywhere || conversation.spaceId === context.spaceId)
            );
            allowedConversations = new Set([
                context.conversationId,
                ...applyRetentionPolicy(inScope, context.hasLumoPlus).map((conversation) => conversation.id),
            ]);
        }
        return Object.values(messages)
            .filter(
                (message) =>
                    allowedConversations.has(message.conversationId) &&
                    !visibleMessageIds.has(message.id) &&
                    (message.role === Role.User || message.role === Role.Assistant) &&
                    !message.compaction &&
                    !message.placeholder
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

        if (validSources.includes('files')) {
            for (const file of await fileSources(query, validScope, validFileIds)) {
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
            for (const message of messageSources(validScope)) {
                const text = getMessageText(message);
                if (text) {
                    candidates.push({ id: `message:${message.id}`, text, kind: 'message', message });
                }
            }
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
                ...(results.length === 0 && {
                    message: 'Nothing matched. Try other keywords, a wider scope, or answer without it.',
                }),
            }),
        };
    };

    const readFile = async (fileId: string, page: number): Promise<ClientToolResult> => {
        let file: FileSource | undefined = findChatFile(fileId);
        if (!file && context.allowWideScopes && context.index) {
            const document = await context.index.getIndexedDocument(fileId);
            const reachable = document?.spaceId === context.spaceId || context.searchOtherSpaces;
            if (document?.text && reachable) {
                file = { id: document.id, name: document.name, text: document.text };
            }
        }
        if (!file) {
            return errorResult('Unknown file_id. Use an id from the file list or from search_knowledge results.');
        }
        const pages = pagesOf(`file:${file.id}`, file.text);
        if (page > pages.length) {
            return errorResult(`This file has ${pages.length} page(s).`);
        }
        return {
            content: JSON.stringify({
                ok: true,
                file_id: file.id,
                file_name: file.name,
                page,
                pages: pages.length,
                content: pages[page - 1],
                ...(await mentionedFiles(pages[page - 1]!, file.id)),
            }),
        };
    };

    const readMessage = async (messageId: string, page: number): Promise<ClientToolResult> => {
        const message = context.getState().messages[messageId];
        if (!message || !isReadableConversation(message.conversationId)) {
            return errorResult('Unknown message_id. Use an id from search_knowledge results.');
        }
        const pages = pagesOf(`message:${message.id}`, getMessageText(message));
        if (page > pages.length) {
            return errorResult(`This message has ${pages.length} page(s).`);
        }
        return {
            content: JSON.stringify({
                ok: true,
                message_id: message.id,
                role: message.role,
                date: message.createdAt.slice(0, 10),
                page,
                pages: pages.length,
                content: pages[page - 1],
                ...(await mentionedFiles(pages[page - 1]!, '')),
            }),
        };
    };

    const runRead = async (args: Record<string, unknown> | undefined): Promise<ClientToolResult> => {
        const page = parsePage(args?.page);
        if ('error' in page) {
            return errorResult(page.error);
        }
        const given = ['file_id', 'file_name', 'message_id'].filter((key) => args?.[key] !== undefined);
        if (given.length === 1 && isId(args?.file_id)) {
            return readFile(args.file_id, page.value);
        }
        if (given.length === 1 && isId(args?.message_id)) {
            return readMessage(args.message_id, page.value);
        }
        const fileName = args?.file_name;
        if (
            given.length === 1 &&
            typeof fileName === 'string' &&
            fileName.trim() &&
            fileName.length <= MAX_FILE_NAME_CHARS
        ) {
            const resolved = await resolveFileName(fileName);
            return 'fileId' in resolved ? readFile(resolved.fileId, page.value) : resolved.result;
        }
        return errorResult(
            'arguments: expected one of {"file_id": "<id>"}, {"file_name": "<name>"} or {"message_id": "<id>"}, and optionally "page"'
        );
    };

    const runCall = async (name: string, rawArguments: string): Promise<ClientToolResult> => {
        calls += 1;
        if (calls > MAX_RETRIEVAL_CALLS_PER_REPLY) {
            return errorResult(
                'Retrieval limit for this reply reached. Answer with what you have, and tell the user which parts you could not look up.'
            );
        }
        const args = parseArguments(rawArguments);
        if (name === READ_KNOWLEDGE_TOOL_NAME) {
            if (reads >= MAX_READS_PER_REPLY) {
                return errorResult(
                    'Read limit for this reply reached. Answer with what you have, and tell the user which parts you could not read.'
                );
            }
            const result = await runRead(args);
            if (!result.is_error) {
                reads += 1;
            }
            return result;
        }
        return runSearch(args);
    };

    return {
        getClientTools: async () => tools,
        canExecute: (name) => toolNames.has(name),
        execute: async (toolCalls) => {
            const results: ClientToolResult[] = [];
            for (const call of toolCalls) {
                results.push(
                    await runCall(call.name, call.arguments).catch(() =>
                        errorResult('The lookup failed. Answer without it.')
                    )
                );
            }
            return results;
        },
    };
};
