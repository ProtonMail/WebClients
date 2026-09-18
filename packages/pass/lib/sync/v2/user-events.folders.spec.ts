import { runSaga } from 'redux-saga';

import { ApiError } from '@proton/shared/lib/fetch/ApiError';
import noop from '@proton/utils/noop';

import { foldersDeletedEvent, foldersUpdated } from '../../../store/actions';
import { sagaSetup } from '../../../store/sagas/testing';
import type {
    FolderData,
    FolderId,
    MaybeNull,
    PassCryptoWorker,
    ShareId,
    SyncEventShareFolderOutput,
} from '../../../types';
import type { FolderDataResponse } from '../../../types/api';
import { logger } from '../../../utils/logger';
import { exposePassCrypto } from '../../crypto';
import * as folderParser from '../../folders/folders.parser';
import * as folderRequests from '../../folders/folders.requests';
import type { EventProcessor } from '../types';
import { processFoldersDeleted, processFoldersUpdated } from './user-events.folders';

jest.mock('../../folders/folders.requests', () => ({
    ...jest.requireActual('../../folders/folders.requests'),
    fetchFolder: jest.fn(),
}));

jest.mock('../../folders/folders.parser', () => ({
    ...jest.requireActual('../../folders/folders.parser'),
    parseFolderResponse: jest.fn(),
}));

const fetchFolder = jest.mocked(folderRequests.fetchFolder);
const parseFolderResponse = jest.mocked(folderParser.parseFolderResponse);
const removeFolderKeys = jest.fn();
jest.spyOn(logger, 'warn').mockImplementation(noop);

beforeEach(() => {
    exposePassCrypto({ removeFolderKeys } as unknown as PassCryptoWorker);
    removeFolderKeys.mockClear();
});

const createEvent = (ShareID: ShareId, FolderID: FolderId) => ({ ShareID, FolderID }) as SyncEventShareFolderOutput;

const createFolder = (folderId: string, parentFolderId: MaybeNull<string> = null, shareId = 's1'): FolderData => ({
    folderId,
    shareId,
    vaultId: 'v1',
    parentFolderId,
    name: folderId,
    keyRotation: 1,
});

const encryptedFolder = (FolderID: string, ParentFolderID: MaybeNull<string> = null): FolderDataResponse =>
    ({ FolderID, ParentFolderID, VaultID: 'v1', KeyRotation: 1 }) as FolderDataResponse;

const run = async (
    saga: (events: SyncEventShareFolderOutput[]) => EventProcessor,
    events: SyncEventShareFolderOutput[],
    state: unknown = {}
) => {
    const setup = sagaSetup(state);
    const result = await runSaga(setup.options, saga, events).toPromise<boolean>();
    return { result, dispatched: setup.dispatched };
};

describe('processFoldersUpdated', () => {
    afterEach(() => jest.clearAllMocks());

    test('returns `true` without dispatching for an empty batch', async () => {
        const { result, dispatched } = await run(processFoldersUpdated, []);
        expect(result).toBe(true);
        expect(dispatched).toHaveLength(0);
    });

    test('fetches each folder and dispatches `foldersUpdated`', async () => {
        const folder = createFolder('f1');
        fetchFolder.mockResolvedValue(encryptedFolder('f1'));
        parseFolderResponse.mockResolvedValue(folder);

        const { result, dispatched } = await run(processFoldersUpdated, [createEvent('s1', 'f1')]);

        expect(fetchFolder).toHaveBeenCalledWith('s1', 'f1');
        expect(result).toBe(true);
        expect(dispatched).toContainEqual(foldersUpdated([folder]));
    });

    test('returns `false` when a folder cannot be fetched', async () => {
        fetchFolder.mockResolvedValueOnce(encryptedFolder('f1')).mockRejectedValueOnce(new ApiError('', 500, 'Err'));
        parseFolderResponse.mockImplementation(async (_shareId, folder) => createFolder(folder.FolderID));

        const events = [createEvent('s1', 'f1'), createEvent('s1', 'f2')];
        const { result, dispatched } = await run(processFoldersUpdated, events);

        expect(result).toBe(false);
        expect(dispatched).toContainEqual(foldersUpdated([createFolder('f1')]));
    });

    test('returns `true` and skips dispatch when a folder cannot be decrypted', async () => {
        fetchFolder.mockResolvedValue(encryptedFolder('f1'));
        parseFolderResponse.mockRejectedValue(new Error('Could not resolve folder key'));

        const { result, dispatched } = await run(processFoldersUpdated, [createEvent('s1', 'f1')]);

        expect(result).toBe(true);
        expect(dispatched).toHaveLength(0);
    });

    test('decrypts parents before children when both arrive in the same event', async () => {
        /** a -> b -> c, listed children first */
        const encrypted: Record<string, FolderDataResponse> = {
            a: encryptedFolder('a'),
            b: encryptedFolder('b', 'a'),
            c: encryptedFolder('c', 'b'),
        };

        fetchFolder.mockImplementation(async (_shareId, folderId) => encrypted[folderId]);

        const order: string[] = [];
        parseFolderResponse.mockImplementation(async (_shareId, folder) => {
            order.push(folder.FolderID);
            return createFolder(folder.FolderID, folder.ParentFolderID ?? null);
        });

        const events = [createEvent('s1', 'c'), createEvent('s1', 'b'), createEvent('s1', 'a')];
        const { result } = await run(processFoldersUpdated, events);

        expect(result).toBe(true);
        expect(order).toEqual(['a', 'b', 'c']);
    });

    test('groups the dispatch per share', async () => {
        fetchFolder.mockImplementation(async (_shareId, folderId) => encryptedFolder(folderId));
        parseFolderResponse.mockImplementation(async (shareId, folder) => createFolder(folder.FolderID, null, shareId));

        const events = [createEvent('s1', 'f1'), createEvent('s2', 'g1')];
        const { dispatched } = await run(processFoldersUpdated, events);

        expect(dispatched).toContainEqual(foldersUpdated([createFolder('f1', null, 's1')]));
        expect(dispatched).toContainEqual(foldersUpdated([createFolder('g1', null, 's2')]));
    });
});

describe('processFoldersDeleted', () => {
    test('returns `true` without dispatching for an empty batch', async () => {
        const { result, dispatched } = await run(processFoldersDeleted, []);
        expect(result).toBe(true);
        expect(dispatched).toHaveLength(0);
    });

    test('expands subfolders from local state and dispatches `foldersDeleted` grouped by share', async () => {
        const state = {
            folders: {
                s1: {
                    f1: createFolder('f1'),
                    f2: createFolder('f2', 'f1'),
                    f3: createFolder('f3', 'f2'),
                    f4: createFolder('f4'),
                },
                s2: { g1: createFolder('g1', null, 's2') },
            },
        };

        const events = [createEvent('s1', 'f1'), createEvent('s2', 'g1')];
        const { result, dispatched } = await run(processFoldersDeleted, events, state);

        expect(result).toBe(true);

        const actions = dispatched as ReturnType<typeof foldersDeletedEvent>[];
        const s1Action = actions.find((action) => foldersDeletedEvent.match(action) && action.payload.shareId === 's1');
        expect([...(s1Action?.payload.folderIds ?? [])].sort()).toEqual(['f1', 'f2', 'f3']);

        expect(dispatched).toContainEqual(foldersDeletedEvent('s2', ['g1']));
    });

    test('drops the folder keys of the deleted folder and its descendants only', async () => {
        const deleted = createFolder('deleted');
        const descendant = createFolder('descendant', deleted.folderId);
        const untouched = createFolder('untouched');
        const state = { folders: { s1: { deleted, descendant, untouched } } };

        await run(processFoldersDeleted, [createEvent('s1', deleted.folderId)], state);

        expect(removeFolderKeys).toHaveBeenCalledTimes(1);
        const [shareId, folderIds] = removeFolderKeys.mock.calls[0];
        expect(shareId).toBe('s1');
        expect([...folderIds].sort()).toEqual(['deleted', 'descendant']);
    });
});
