import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import type { NodeEntity } from '@protontech/drive-sdk';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { createMockNodeEntity } from '@proton/drive/modules/testing';

import { SearchDB } from '../../../../shared/SearchDB';
import { RepairableNodeError, SearchLibraryError } from '../../../../shared/errors';
import type { TreeEventScopeId } from '../../../../shared/types';
import { FakeMainThreadBridge } from '../../../../testing/FakeMainThreadBridge';
import { findDocumentsByTag } from '../../../../testing/indexHelpers';
import { makeTaskContext } from '../../../../testing/makeTaskContext';
import { setupRealSearchLibraryWasm } from '../../../../testing/setupRealSearchLibraryWasm';
import { IndexKind, IndexRegistry } from '../../../index/IndexRegistry';
import { createIndexEntry, toCoreNodeFields } from '../../indexEntry';
import type { TaskContext } from '../../tasks/BaseTask';
import type { BFSNodeEvent, BFSVisitorCheckpoint } from './ResumableFolderBFSVisitor';
import type { ResumableWalkHandlers } from './drainResumableTreeVisitorEvents';
import {
    CHECKPOINT_EVERY_N_FOLDERS,
    COMMIT_EVERY_N_ENTRIES,
    drainResumableTreeVisitorEvents,
} from './drainResumableTreeVisitorEvents';

setupRealSearchLibraryWasm();

jest.mock('../../../../shared/errors', () => {
    const actual = jest.requireActual('../../../../shared/errors');
    return { ...actual, sendErrorReportForSearch: jest.fn() };
});

const SCOPE_ID = 'scope-1' as TreeEventScopeId;

const makeNode = (uid: string): NodeEntity =>
    createMockNodeEntity({ uid, name: { ok: true, value: `${uid}.txt` }, parentUid: 'root' });

const nodeEvent = (uid: string): BFSNodeEvent => ({ type: 'node', node: makeNode(uid), parentPath: '', generation: 1 });

const checkpoint: BFSVisitorCheckpoint = { queue: [], generation: 1 };

describe('drainResumableTreeVisitorEvents', () => {
    let db: SearchDB;
    let indexRegistry: IndexRegistry;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        const cryptoKey = await generateAndImportKey();
        indexRegistry = new IndexRegistry(cryptoKey);
    });

    const buildCtx = (): TaskContext => {
        const bridge = new FakeMainThreadBridge();
        return makeTaskContext({ bridge: bridge.asBridge(), db, indexRegistry });
    };

    // Maps a walked node to an index entry — the populator-specific part, stubbed here.
    const toEntry: ResumableWalkHandlers['toEntry'] = (node, parentPath, generation) =>
        createIndexEntry({
            node: toCoreNodeFields(node),
            treeEventScopeId: SCOPE_ID,
            parentPath,
            indexPopulatorKind: 'test-pop',
            indexPopulatorVersion: 1,
            indexPopulatorGeneration: generation,
        });

    async function* fromArray(events: BFSNodeEvent[]): AsyncIterableIterator<BFSNodeEvent> {
        for (const e of events) {
            yield e;
        }
    }

    it('inserts every walked node (via toEntry) and commits it', async () => {
        const ctx = buildCtx();
        const events = [nodeEvent('a'), nodeEvent('b'), nodeEvent('c')];

        await drainResumableTreeVisitorEvents(fromArray(events), IndexKind.MAIN, ctx, {
            toEntry,
            persistCheckpoint: jest.fn(async () => {}),
        });

        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        for (const uid of ['a', 'b', 'c']) {
            expect(await findDocumentsByTag(instance.indexReader, 'nodeUid', uid)).toHaveLength(1);
        }
    });

    it('quarantines a node-scoped mapping failure via onNodeError and keeps indexing the rest', async () => {
        const ctx = buildCtx();
        const onNodeError = jest.fn(async (_node: NodeEntity, _error: unknown) => {});
        // toEntry throws a node-scoped error for 'b' only.
        const failingToEntry: ResumableWalkHandlers['toEntry'] = (node, parentPath, generation) => {
            if (node.uid === 'b') {
                throw new RepairableNodeError('cannot map node b', null);
            }
            return toEntry(node, parentPath, generation);
        };

        await drainResumableTreeVisitorEvents(
            fromArray([nodeEvent('a'), nodeEvent('b'), nodeEvent('c')]),
            IndexKind.MAIN,
            ctx,
            {
                toEntry: failingToEntry,
                persistCheckpoint: jest.fn(async () => {}),
                onNodeError,
            }
        );

        expect(onNodeError).toHaveBeenCalledTimes(1);
        expect(onNodeError.mock.calls[0][0]).toMatchObject({ uid: 'b' });

        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        expect(await findDocumentsByTag(instance.indexReader, 'nodeUid', 'a')).toHaveLength(1);
        expect(await findDocumentsByTag(instance.indexReader, 'nodeUid', 'b')).toHaveLength(0);
        expect(await findDocumentsByTag(instance.indexReader, 'nodeUid', 'c')).toHaveLength(1);
    });

    it('propagates a systemic (SearchLibraryError) mapping failure instead of quarantining', async () => {
        const ctx = buildCtx();
        const onNodeError = jest.fn(async (_node: NodeEntity, _error: unknown) => {});
        const failingToEntry: ResumableWalkHandlers['toEntry'] = () => {
            throw new SearchLibraryError('wasm exploded', null);
        };

        await expect(
            drainResumableTreeVisitorEvents(fromArray([nodeEvent('a')]), IndexKind.MAIN, ctx, {
                toEntry: failingToEntry,
                persistCheckpoint: jest.fn(async () => {}),
                onNodeError,
            })
        ).rejects.toThrow('wasm exploded');
        expect(onNodeError).not.toHaveBeenCalled();
    });

    it('commits pending nodes before persisting the checkpoint at a (forced) boundary', async () => {
        const ctx = buildCtx();
        const persistOrder: string[] = [];
        // Mid-folder boundaries are forced, so persistCheckpoint fires immediately.
        const persistCheckpoint = jest.fn(async () => {
            // At persist time the node must already be durable in the index.
            const instance = await indexRegistry.get(IndexKind.MAIN, db);
            const found = await findDocumentsByTag(instance.indexReader, 'nodeUid', 'a');
            persistOrder.push(found.length > 0 ? 'committed' : 'not-committed');
        });

        await drainResumableTreeVisitorEvents(
            fromArray([nodeEvent('a'), { type: 'mid-folder-boundary', checkpoint }]),
            IndexKind.MAIN,
            ctx,
            {
                toEntry,
                persistCheckpoint,
            }
        );

        expect(persistCheckpoint).toHaveBeenCalledTimes(1);
        expect(persistOrder).toEqual(['committed']);
    });

    it('forces persist on every mid-folder boundary but throttles folder boundaries to CHECKPOINT_EVERY_N_FOLDERS', async () => {
        const ctx = buildCtx();
        const persistCheckpoint = jest.fn(async () => {});

        const events: BFSNodeEvent[] = [
            { type: 'mid-folder-boundary', checkpoint },
            { type: 'mid-folder-boundary', checkpoint },
        ];
        for (let i = 0; i < CHECKPOINT_EVERY_N_FOLDERS; i++) {
            events.push({ type: 'folder-boundary', checkpoint });
        }

        await drainResumableTreeVisitorEvents(fromArray(events), IndexKind.MAIN, ctx, { toEntry, persistCheckpoint });

        // 2 forced mid-folder persists + 1 folder persist (once the 5-folder threshold is hit).
        expect(persistCheckpoint).toHaveBeenCalledTimes(3);
    });

    it('respects an aborted signal', async () => {
        const ac = new AbortController();
        ac.abort();
        const ctx = makeTaskContext({
            bridge: new FakeMainThreadBridge().asBridge(),
            db,
            indexRegistry,
            signal: ac.signal,
        });

        await expect(
            drainResumableTreeVisitorEvents(fromArray([nodeEvent('a')]), IndexKind.MAIN, ctx, {
                toEntry,
                persistCheckpoint: jest.fn(async () => {}),
            })
        ).rejects.toThrow();
    });

    it('exposes the tuning constants', () => {
        expect(COMMIT_EVERY_N_ENTRIES).toBeGreaterThan(0);
        expect(CHECKPOINT_EVERY_N_FOLDERS).toBeGreaterThan(0);
    });
});
