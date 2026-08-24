import { runSaga } from 'redux-saga';

import { sagaReturn, sagaSetup } from '../../../store/sagas/testing';
import type { RootSagaOptions } from '../../../store/types';
import type { SyncEventListOutput } from '../../../types';
import { PendingFileLinkTracker } from '../../file-attachments/file-link.tracker';
import * as alias from './user-events.alias';
import * as folders from './user-events.folders';
import * as invites from './user-events.invites';
import * as items from './user-events.items';
import { processUserEvents } from './user-events.processor';
import * as shares from './user-events.shares';
import * as sync from './user-events.sync';
import * as user from './user-events.user';

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
        processors.forEach(([mod, name]) => jest.spyOn(mod as any, name).mockImplementation(sagaReturn(true)));
        jest.spyOn(sync, 'processFullRefresh').mockImplementation(sagaReturn(true));
    });

    afterEach(() => jest.restoreAllMocks());

    test('resolves `true` when every processor succeeds', async () => {
        await expect(run(event())).resolves.toBe(true);
        expect(items.processItemsUpdated).toHaveBeenCalled();
    });

    test('resolves `false` when any processor fails', async () => {
        jest.spyOn(shares, 'processSharesUpdated').mockImplementation(sagaReturn(false));
        await expect(run(event())).resolves.toBe(false);
    });

    test('delegates to a full refresh and skips per-type processors', async () => {
        await expect(run(event({ FullRefresh: true }))).resolves.toBe(true);
        expect(sync.processFullRefresh).toHaveBeenCalled();
        expect(items.processItemsUpdated).not.toHaveBeenCalled();
    });

    test('skips the batch when an updated item has a pending file link', async () => {
        jest.spyOn(PendingFileLinkTracker, 'isPending').mockReturnValue(true);
        await expect(run(event({ ItemsUpdated: [{ ShareID: 's1', ItemID: 'i1' }] as any }))).resolves.toBe(false);
        expect(items.processItemsUpdated).not.toHaveBeenCalled();
    });
});
