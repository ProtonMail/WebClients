import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import type { NodeEntity, NodeType } from '@proton/drive';
import { ValidationError } from '@proton/drive';
import { createMockNodeEntity } from '@proton/drive/modules/testing';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import { SearchDB } from '../../../../shared/SearchDB';
import { FakeMainThreadBridge } from '../../../../testing/FakeMainThreadBridge';
import type { BFSNodeEvent, BFSVisitContext } from './ResumableFolderBFSVisitor';
import { ResumableFolderBFSVisitor } from './ResumableFolderBFSVisitor';

const VISITOR_ID = 'test-id';

const file = (uid: string, name = `${uid}.txt`) =>
    createMockNodeEntity({ uid, name: { ok: true, value: name }, type: 'file' as NodeType });
const folder = (uid: string, name = uid) =>
    createMockNodeEntity({ uid, name: { ok: true, value: name }, type: 'folder' as NodeType });
const trashedFile = (uid: string) =>
    createMockNodeEntity({
        uid,
        name: { ok: true, value: `${uid}.txt` },
        type: 'file' as NodeType,
        trashTime: new Date(),
    });

async function collect(gen: AsyncIterableIterator<BFSNodeEvent>): Promise<BFSNodeEvent[]> {
    const events: BFSNodeEvent[] = [];
    for await (const event of gen) {
        events.push(event);
    }
    return events;
}

const nodeEvents = (events: BFSNodeEvent[]) =>
    events.filter((e): e is Extract<BFSNodeEvent, { type: 'node' }> => e.type === 'node');

describe('ResumableFolderBFSVisitor', () => {
    let db: SearchDB;
    let bridge: FakeMainThreadBridge;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        bridge = new FakeMainThreadBridge();
    });

    const makeCtx = (signal: AbortSignal = new AbortController().signal): BFSVisitContext => ({
        db,
        driveSdk: bridge.asBridge().driveSdk,
        signal,
    });

    describe('checkpoint persistence', () => {
        it('saveCheckpoint persists queue, generation and currentFolder', async () => {
            const visitor = new ResumableFolderBFSVisitor(VISITOR_ID);
            await visitor.saveCheckpoint(db, {
                queue: [{ folderUid: 'a', parentPath: '/a' }],
                generation: 3,
                currentFolder: { folderUid: 'b', parentPath: '/b', pendingUids: ['x', 'y'] },
            });

            const state = await db.getBFSVisitorState(VISITOR_ID);
            expect(state?.id).toBe(VISITOR_ID);
            expect(state?.queue).toEqual([{ folderUid: 'a', parentPath: '/a' }]);
            expect(state?.generation).toBe(3);
            expect(state?.currentFolder).toEqual({ folderUid: 'b', parentPath: '/b', pendingUids: ['x', 'y'] });
        });

        it('delete removes the persisted state', async () => {
            const visitor = new ResumableFolderBFSVisitor(VISITOR_ID);
            await visitor.saveCheckpoint(db, { queue: [{ folderUid: 'a', parentPath: '' }], generation: 1 });
            await visitor.delete(db);
            expect(await db.getBFSVisitorState(VISITOR_ID)).toBeUndefined();
        });

        it('saveCheckpoint stamps subtree metadata when set, and loadSubtreeMetadata reads it back', async () => {
            const visitor = new ResumableFolderBFSVisitor(VISITOR_ID);
            expect(await visitor.loadSubtreeMetadata(db)).toBeUndefined();

            visitor.setSubtreeMetadata({ nodeUid: 'folder-a', parentPath: '/folder-a', epoch: 5 });
            await visitor.saveCheckpoint(db, { queue: [], generation: 1 });

            const state = await db.getBFSVisitorState(VISITOR_ID);
            expect(state?.nodeUid).toBe('folder-a');
            expect(state?.parentPath).toBe('/folder-a');
            expect(state?.epoch).toBe(5);

            expect(await visitor.loadSubtreeMetadata(db)).toEqual({
                nodeUid: 'folder-a',
                parentPath: '/folder-a',
                epoch: 5,
            });
        });

        it('loadSubtreeMetadata returns undefined for a plain (non-subtree) checkpoint', async () => {
            const visitor = new ResumableFolderBFSVisitor(VISITOR_ID);
            await visitor.saveCheckpoint(db, { queue: [], generation: 1 });
            expect(await visitor.loadSubtreeMetadata(db)).toBeUndefined();
        });
    });

    describe('visit — fresh walk', () => {
        it('yields nodes breadth-first, uid-sorted, with correct parent paths and the fresh generation', async () => {
            bridge.setChildren('root', [folder('a-folder'), file('b-file')]);
            bridge.setChildren('a-folder', [file('deep')]);

            const visitor = new ResumableFolderBFSVisitor(VISITOR_ID);
            const events = await collect(visitor.visit({ folderUid: 'root', parentPath: '' }, 1, makeCtx()));

            expect(nodeEvents(events).map((e) => ({ uid: e.node.uid, path: e.parentPath, gen: e.generation }))).toEqual(
                [
                    { uid: 'a-folder', path: '', gen: 1 },
                    { uid: 'b-file', path: '', gen: 1 },
                    { uid: 'deep', path: '/a-folder', gen: 1 },
                ]
            );
        });

        it('skips trashed nodes', async () => {
            bridge.setChildren('root', [file('ok'), trashedFile('gone')]);

            const visitor = new ResumableFolderBFSVisitor(VISITOR_ID);
            const events = await collect(visitor.visit({ folderUid: 'root', parentPath: '' }, 1, makeCtx()));

            expect(nodeEvents(events).map((e) => e.node.uid)).toEqual(['ok']);
        });

        it('emits a folder-boundary after each expanded folder, carrying the remaining queue', async () => {
            bridge.setChildren('root', [folder('a-folder'), file('b-file')]);
            bridge.setChildren('a-folder', [file('deep')]);

            const visitor = new ResumableFolderBFSVisitor(VISITOR_ID);
            const events = await collect(visitor.visit({ folderUid: 'root', parentPath: '' }, 1, makeCtx()));

            const boundaries = events.filter((e) => e.type === 'folder-boundary');
            // One boundary after root (a-folder still queued), one after a-folder (queue drained).
            expect(boundaries).toHaveLength(2);
            expect(boundaries[0].checkpoint.queue).toEqual([{ folderUid: 'a-folder', parentPath: '/a-folder' }]);
            expect(boundaries[1].checkpoint.queue).toEqual([]);
        });

        it('yields nothing but a folder-boundary for an empty folder', async () => {
            bridge.setChildren('root', []);

            const visitor = new ResumableFolderBFSVisitor(VISITOR_ID);
            const events = await collect(visitor.visit({ folderUid: 'root', parentPath: '' }, 1, makeCtx()));

            expect(nodeEvents(events)).toHaveLength(0);
            expect(events).toEqual([{ type: 'folder-boundary', checkpoint: { queue: [], generation: 1 } }]);
        });
    });

    describe('visit — gone folder', () => {
        it('treats a folder that vanished mid-walk as childless and continues to sibling folders', async () => {
            bridge.setChildren('root', [folder('gone'), folder('sibling')]);
            bridge.setChildren('gone', [file('gone-child')]);
            bridge.setChildren('sibling', [file('sibling-child')]);
            bridge.failNextIterateForFolder(
                'gone',
                new ValidationError('File or folder not found', API_CUSTOM_ERROR_CODES.NOT_FOUND)
            );

            const visitor = new ResumableFolderBFSVisitor(VISITOR_ID);
            const events = await collect(visitor.visit({ folderUid: 'root', parentPath: '' }, 1, makeCtx()));

            expect(nodeEvents(events).map((e) => e.node.uid)).toEqual(['gone', 'sibling', 'sibling-child']);
            expect(events.filter((e) => e.type === 'folder-boundary')).toHaveLength(3);
        });

        it('still propagates a ValidationError whose code means the folder is listable', async () => {
            bridge.setChildren('root', [folder('still-here')]);
            bridge.setNode('still-here', folder('still-here'));
            bridge.failNextIterateForFolder(
                'still-here',
                new ValidationError('Invalid value', API_CUSTOM_ERROR_CODES.INVALID_VALUE)
            );

            const visitor = new ResumableFolderBFSVisitor(VISITOR_ID);
            await expect(collect(visitor.visit({ folderUid: 'root', parentPath: '' }, 1, makeCtx()))).rejects.toThrow(
                'Invalid value'
            );
        });

        it('still propagates a non-ValidationError from a queued folder', async () => {
            bridge.setChildren('root', [folder('gone'), folder('sibling')]);
            bridge.failNextIterateForFolder('gone', new Error('network blip'));

            const visitor = new ResumableFolderBFSVisitor(VISITOR_ID);
            await expect(collect(visitor.visit({ folderUid: 'root', parentPath: '' }, 1, makeCtx()))).rejects.toThrow(
                'network blip'
            );
        });
    });

    describe('visit — resume', () => {
        it('resumes from a persisted checkpoint queue, ignoring startFolder and reusing its generation', async () => {
            // A crash left the walk with folder-x still queued at generation 7.
            await db.putBFSVisitorState({
                id: VISITOR_ID,
                queue: [{ folderUid: 'folder-x', parentPath: '/folder-x' }],
                generation: 7,
                updatedAt: 0,
            });
            bridge.setChildren('root', [file('root-file')]); // must NOT be walked on resume
            bridge.setChildren('folder-x', [file('x-file')]);

            const visitor = new ResumableFolderBFSVisitor(VISITOR_ID);
            const events = await collect(visitor.visit({ folderUid: 'root', parentPath: '' }, 1, makeCtx()));

            expect(nodeEvents(events).map((e) => ({ uid: e.node.uid, path: e.parentPath, gen: e.generation }))).toEqual(
                [{ uid: 'x-file', path: '/folder-x', gen: 7 }]
            );
        });

        it('resumes mid-folder from currentFolder.pendingUids, skipping already-processed children', async () => {
            await db.putBFSVisitorState({
                id: VISITOR_ID,
                queue: [],
                generation: 2,
                currentFolder: { folderUid: 'folder-x', parentPath: '/folder-x', pendingUids: ['uid-b', 'uid-c'] },
                updatedAt: 0,
            });
            // Only the pending uids are fetched (via iterateNodes); uid-a was already handled pre-crash.
            bridge.setNode('uid-b', file('uid-b'));
            bridge.setNode('uid-c', file('uid-c'));

            const visitor = new ResumableFolderBFSVisitor(VISITOR_ID);
            const events = await collect(visitor.visit({ folderUid: 'root', parentPath: '' }, 1, makeCtx()));

            expect(nodeEvents(events).map((e) => ({ uid: e.node.uid, path: e.parentPath, gen: e.generation }))).toEqual(
                [
                    { uid: 'uid-b', path: '/folder-x', gen: 2 },
                    { uid: 'uid-c', path: '/folder-x', gen: 2 },
                ]
            );
        });
    });

    describe('visit — large folder', () => {
        it('emits a mid-folder-boundary after each batch, with the remaining uids as pendingUids', async () => {
            const children: NodeEntity[] = Array.from({ length: 600 }, (_, i) =>
                file(`c${String(i).padStart(4, '0')}`)
            );
            bridge.setChildren('root', children);

            const visitor = new ResumableFolderBFSVisitor(VISITOR_ID);
            const events = await collect(visitor.visit({ folderUid: 'root', parentPath: '' }, 1, makeCtx()));

            expect(nodeEvents(events)).toHaveLength(600);

            const midBoundaries = events.filter((e) => e.type === 'mid-folder-boundary');
            expect(midBoundaries).toHaveLength(1); // one after the first 500-node batch
            expect(midBoundaries[0].checkpoint.currentFolder?.folderUid).toBe('root');
            expect(midBoundaries[0].checkpoint.currentFolder?.pendingUids).toHaveLength(100);

            // The mid-folder-boundary lands right after the 500th node event.
            const midIndex = events.findIndex((e) => e.type === 'mid-folder-boundary');
            expect(nodeEvents(events.slice(0, midIndex))).toHaveLength(500);
        });
    });

    describe('abort', () => {
        it('throws when the signal is already aborted', async () => {
            bridge.setChildren('root', [file('a')]);
            const ac = new AbortController();
            ac.abort();

            const visitor = new ResumableFolderBFSVisitor(VISITOR_ID);
            await expect(
                collect(visitor.visit({ folderUid: 'root', parentPath: '' }, 1, makeCtx(ac.signal)))
            ).rejects.toThrow();
        });
    });
});
