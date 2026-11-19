import { runSaga } from 'redux-saga';

import type { RootSagaOptions } from '../../../store/types';
import type { SyncEventListOutput } from '../../../types/api/pass';
import { sagaReturn, sagaSetup } from '../../../utils/tests/saga';
import { PendingFileLinkTracker } from '../../file-attachments/file-link.tracker';
import * as alias from './user-events.alias';
import * as folders from './user-events.folders';
import * as invites from './user-events.invites';
import * as items from './user-events.items';
import { processUserEvents } from './user-events.processor';
import * as shares from './user-events.shares';
import * as sync from './user-events.sync';
import * as user from './user-events.user';

vi.mock('./user-events.items', async () => ({
    ...(await vi.importActual('./user-events.items')),
    processItemsUpdated: vi.fn(),
    processItemsDeleted: vi.fn(),
}));
vi.mock('./user-events.alias', async () => ({
    ...(await vi.importActual('./user-events.alias')),
    processAliasNoteChanged: vi.fn(),
    processPendingAliasToCreate: vi.fn(),
}));
vi.mock('./user-events.user', async () => ({
    ...(await vi.importActual('./user-events.user')),
    processBreachUpdate: vi.fn(),
    processUserRefresh: vi.fn(),
    processOrganizationInfoChanged: vi.fn(),
}));
vi.mock('./user-events.shares', async () => ({
    ...(await vi.importActual('./user-events.shares')),
    processSharesCreated: vi.fn(),
    processSharesUpdated: vi.fn(),
    processSharesDeleted: vi.fn(),
}));
vi.mock('./user-events.folders', async () => ({
    ...(await vi.importActual('./user-events.folders')),
    processFoldersUpdated: vi.fn(),
    processFoldersDeleted: vi.fn(),
}));
vi.mock('./user-events.invites', async () => ({
    ...(await vi.importActual('./user-events.invites')),
    processInvitesChanged: vi.fn(),
    processGroupInvitesChanged: vi.fn(),
    processSharesWithInvitesToCreate: vi.fn(),
}));
vi.mock('./user-events.sync', async () => ({
    ...(await vi.importActual('./user-events.sync')),
    processFullRefresh: vi.fn(),
}));

const event = (overrides?: Partial<SyncEventListOutput>) =>
    ({ ItemsUpdated: [], FullRefresh: false, ...overrides }) as SyncEventListOutput;

const run = (evt: SyncEventListOutput) =>
    runSaga(sagaSetup().options, processUserEvents, evt, {} as RootSagaOptions).toPromise<boolean>();

const processors = [
    [items, 'processItemsUpdated'],
    [items, 'processItemsDeleted'],
    [alias, 'processAliasNoteChanged'],
    [alias, 'processPendingAliasToCreate'],
    [user, 'processBreachUpdate'],
    [user, 'processUserRefresh'],
    [user, 'processOrganizationInfoChanged'],
    [shares, 'processSharesCreated'],
    [shares, 'processSharesUpdated'],
    [shares, 'processSharesDeleted'],
    [folders, 'processFoldersUpdated'],
    [folders, 'processFoldersDeleted'],
    [invites, 'processInvitesChanged'],
    [invites, 'processGroupInvitesChanged'],
    [invites, 'processSharesWithInvitesToCreate'],
] as const;

describe('processUserEvents', () => {
    beforeEach(() => {
        processors.forEach(([mod, name]) => (mod as any)[name].mockImplementation(sagaReturn(true)));
        vi.mocked(sync.processFullRefresh).mockImplementation(sagaReturn(true));
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    test('resolves `true` when every processor succeeds', async () => {
        await expect(run(event())).resolves.toBe(true);
        expect(items.processItemsUpdated).toHaveBeenCalled();
    });

    test('resolves `false` when any processor fails', async () => {
        vi.mocked(shares.processSharesUpdated).mockImplementation(sagaReturn(false));
        await expect(run(event())).resolves.toBe(false);
    });

    test('delegates to a full refresh and skips per-type processors', async () => {
        await expect(run(event({ FullRefresh: true }))).resolves.toBe(true);
        expect(sync.processFullRefresh).toHaveBeenCalled();
        expect(items.processItemsUpdated).not.toHaveBeenCalled();
    });

    test('skips the batch when an updated item has a pending file link', async () => {
        vi.spyOn(PendingFileLinkTracker, 'isPending').mockReturnValue(true);
        await expect(run(event({ ItemsUpdated: [{ ShareID: 's1', ItemID: 'i1' }] as any }))).resolves.toBe(false);
        expect(items.processItemsUpdated).not.toHaveBeenCalled();
    });
});
