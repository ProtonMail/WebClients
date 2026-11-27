import JSZip from 'jszip';

import type { Format } from '../components/Modals/ConversationExportModal/exportConversation';
import type { Conversation, Message, Space } from '../types';
import { Role, SpaceType } from '../types';
import { getIsMobileDevice } from '../util/device';
import { isNativeMobileApp } from '../util/userAgent';
import type { BulkConversationExportProgress } from './bulkConversationExport';
import {
    ChatHistoryNotLoadedError,
    EXPORT_LOG_FILENAME,
    isBulkConversationExportSupported,
    prepareBulkConversationExport,
} from './bulkConversationExport';
import { prepareConversationExport } from './sagas/conversationSnapshot';
import type { LumoDispatch, LumoState } from './store';

vi.mock('./sagas/conversationSnapshot', () => ({ prepareConversationExport: vi.fn() }));
vi.mock('../util/device', () => ({ getIsMobileDevice: vi.fn(() => false) }));
vi.mock('../util/userAgent', () => ({ isNativeMobileApp: vi.fn(() => false) }));

const createdAt = '2026-01-01T00:00:00.000Z';

const createConversation = (id: string, spaceId: string, extra: Partial<Conversation> = {}): Conversation => ({
    id,
    spaceId,
    title: id,
    createdAt,
    updatedAt: createdAt,
    ...extra,
});

const createMessage = (id: string, conversationId: string): Message => ({
    id,
    conversationId,
    createdAt,
    role: Role.User,
    content: `body-${id}`,
});

const createProject = (id: string, projectName: string): Space => ({
    id,
    projectName,
    createdAt,
    updatedAt: createdAt,
    spaceType: SpaceType.Project,
    spaceKey: '',
});

type Snapshot = { conversation: Conversation; messages: Record<string, Message> };
/** Per chat: the verified snapshot, or 'unverified' when only the device copy loads, or 'missing' when neither does. */
type Outcome = Snapshot | 'unverified' | 'missing';

function setup(
    conversations: Conversation[],
    outcomes: Record<string, Outcome> = {},
    {
        initialization = { lastSpacesPullAt: 1, spacesPullSettled: true },
        spaces = [],
    }: { initialization?: { lastSpacesPullAt: number; spacesPullSettled: boolean }; spaces?: Space[] } = {}
) {
    const snapshotOf = (conversation: Conversation): Snapshot => ({
        conversation,
        messages: { [`message-${conversation.id}`]: createMessage(`message-${conversation.id}`, conversation.id) },
    });
    vi.mocked(prepareConversationExport).mockImplementation(((
        id: string,
        _isGuest: boolean,
        signal: AbortSignal,
        allowUnverified: boolean
    ) => {
        signal.throwIfAborted();
        const conversation = conversations.find((entry) => entry.id === id)!;
        const outcome = outcomes[id] ?? snapshotOf(conversation);
        if (outcome === 'missing' || (outcome === 'unverified' && !allowUnverified)) {
            return Promise.reject(new Error('unavailable'));
        }
        return Promise.resolve(outcome === 'unverified' ? snapshotOf(conversation) : outcome);
    }) as unknown as typeof prepareConversationExport);

    const state = {
        conversations: Object.fromEntries(conversations.map((conversation) => [conversation.id, conversation])),
        spaces: Object.fromEntries(spaces.map((space) => [space.id, space])),
        initialization,
    } as unknown as LumoState;
    const dispatch = vi.fn((action: unknown) => action) as unknown as LumoDispatch;

    return (
        spaceId?: string,
        format?: Format,
        onProgress?: (progress: BulkConversationExportProgress) => void,
        signal = new AbortController().signal
    ) => prepareBulkConversationExport(spaceId, signal, format, onProgress)(dispatch, () => state);
}

const openZip = async (file: Blob) => JSZip.loadAsync(await new Response(file).arrayBuffer());

describe('prepareBulkConversationExport', () => {
    beforeEach(() => {
        vi.mocked(prepareConversationExport).mockReset();
    });

    it('exports every non-ghost chat as a separate file and reports progress', async () => {
        const prepare = setup([
            createConversation('second', 'space-b', { createdAt: '2026-01-02T00:00:00.000Z' }),
            createConversation('first', 'space-a'),
            createConversation('ghost', 'space-a', { ghost: true }),
        ]);
        const progress = vi.fn();

        const { count, issues, file } = await prepare(undefined, 'json', progress);
        const archive = await openZip(file);

        expect(count).toBe(2);
        expect(issues).toBe(0);
        expect(file.type).toBe('application/zip');
        expect(Object.keys(archive.files)).toEqual(['first.json', 'second.json']);
        const chat = JSON.parse(await archive.file('first.json')!.async('string'));
        expect(chat.mapping['message-first'].message.content.parts).toEqual(['body-message-first']);
        expect(progress.mock.calls.flat()).toEqual([
            { completed: 0, total: 2 },
            { completed: 1, total: 2 },
            { completed: 2, total: 2 },
        ]);
        expect(prepareConversationExport).not.toHaveBeenCalledWith(
            'ghost',
            expect.anything(),
            expect.anything(),
            expect.anything()
        );
    });

    it('only exports the chats of the selected project, as Markdown', async () => {
        const prepare = setup(
            [createConversation('in-project', 'project'), createConversation('other', 'elsewhere')],
            {},
            { spaces: [createProject('project', 'Planning'), createProject('elsewhere', 'Another project')] }
        );

        const { count, file } = await prepare('project', 'md');
        const archive = await openZip(file);

        expect(count).toBe(1);
        expect(Object.keys(archive.files)).toEqual(['Planning/in-project.md']);
        expect(await archive.file('Planning/in-project.md')!.async('string')).toContain('body-message-in-project');
    });

    it('groups chats by project and keeps root and project folder names distinct', async () => {
        const prepare = setup(
            [
                createConversation('personal', 'default', { title: 'Chat' }),
                createConversation('first', 'a', { title: 'Notes' }),
                createConversation('second', 'a', { title: 'Notes' }),
                createConversation('third', 'b', { title: 'Notes' }),
                createConversation('fourth', 'c'),
            ],
            { second: 'unverified' },
            { spaces: [createProject('a', 'Plans/'), createProject('b', 'plans'), createProject('c', 'Chat.json')] }
        );

        const { count, file } = await prepare();
        const archive = await openZip(file);

        expect(count).toBe(5);
        expect(Object.keys(archive.files)).toEqual([
            'Chat (2).json',
            'Plans/Notes.json',
            'Plans/Notes (2).json',
            'plans (2)/Notes.json',
            'Chat.json/fourth.json',
            EXPORT_LOG_FILENAME,
        ]);
        const log = await archive.file(EXPORT_LOG_FILENAME)!.async('string');
        expect(log).toContain('Plans/Notes (2).json: only the messages available on this device were exported.');
    });

    it('exports the messages on this device for an unverified chat and lists it in the export log', async () => {
        const prepare = setup(
            [
                createConversation('ok', 'space'),
                createConversation('partial', 'space'),
                createConversation('lost', 'space'),
            ],
            {
                partial: 'unverified',
                lost: 'missing',
            }
        );

        const { count, issues, file } = await prepare();
        const archive = await openZip(file);

        expect(count).toBe(2);
        expect(issues).toBe(2);
        expect(Object.keys(archive.files)).toEqual(['ok.json', 'partial.json', EXPORT_LOG_FILENAME]);
        const log = await archive.file(EXPORT_LOG_FILENAME)!.async('string');
        expect(log).toContain('partial.json: only the messages available on this device were exported.');
        expect(log).toContain('"lost": this chat could not be exported.');
        expect(log).not.toContain('ok.json');
    });

    it('skips empty chats without logging them', async () => {
        const empty = createConversation('empty', 'space');
        const prepare = setup([empty, createConversation('full', 'space')], {
            empty: { conversation: empty, messages: {} },
        });

        const { count, issues, file } = await prepare();

        expect(count).toBe(1);
        expect(issues).toBe(0);
        expect(Object.keys((await openZip(file)).files)).toEqual(['full.json']);
    });

    it('keeps separate files when sanitized titles collide, and never overwrites the log', async () => {
        const prepare = setup(
            [
                createConversation('a', 'space', { title: 'Plans/' }),
                createConversation('b', 'space', { title: 'plans' }),
                createConversation('c', 'space', { title: 'export-log' }),
                createConversation('d', 'space'),
            ],
            { d: 'unverified' }
        );

        const { file } = await prepare();

        expect(Object.keys((await openZip(file)).files)).toEqual([
            'Plans.json',
            'plans (2).json',
            'export-log.json',
            'd.json',
            EXPORT_LOG_FILENAME,
        ]);
    });

    it.each([
        { spacesPullSettled: false, loading: true },
        { spacesPullSettled: true, loading: false },
    ])(
        'rejects before the chat history has been loaded (settled: $spacesPullSettled)',
        async ({ spacesPullSettled, loading }) => {
            const prepare = setup(
                [createConversation('first', 'space')],
                {},
                { initialization: { lastSpacesPullAt: 0, spacesPullSettled } }
            );

            const error = await prepare().catch((error: unknown) => error);

            expect(error).toBeInstanceOf(ChatHistoryNotLoadedError);
            expect((error as ChatHistoryNotLoadedError).loading).toBe(loading);
            expect(prepareConversationExport).not.toHaveBeenCalled();
        }
    );

    it('stops instead of logging chats when the export is cancelled', async () => {
        const prepare = setup([createConversation('first', 'space')]);
        const controller = new AbortController();
        vi.mocked(prepareConversationExport).mockImplementationOnce((() => {
            controller.abort();
            return Promise.reject(new Error('cancelled'));
        }) as unknown as typeof prepareConversationExport);

        await expect(prepare(undefined, undefined, undefined, controller.signal)).rejects.toThrow();
        expect(prepareConversationExport).toHaveBeenCalledOnce();
    });

    it.each([
        { device: 'a mobile browser', mobile: true, native: false },
        { device: 'the native mobile app', mobile: false, native: true },
    ])('is not available in $device', async ({ mobile, native }) => {
        vi.mocked(getIsMobileDevice).mockReturnValueOnce(mobile).mockReturnValueOnce(mobile);
        vi.mocked(isNativeMobileApp).mockReturnValueOnce(native).mockReturnValueOnce(native);
        const prepare = setup([createConversation('first', 'space')]);

        expect(isBulkConversationExportSupported()).toBe(false);
        await expect(prepare()).rejects.toThrow('Exporting several chats is not supported on mobile devices');
        expect(prepareConversationExport).not.toHaveBeenCalled();
    });
});
