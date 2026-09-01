import { describe, expect, it } from 'vitest';

import type { DriveBackground } from './drive/driveBackgrounds';
import { planReconciliation } from './reconcile';
import type { CachedBackground } from './types';

const cachedBackground = (overrides: Partial<CachedBackground> = {}): CachedBackground => ({
    id: 'node-1',
    revisionUid: 'revision-1',
    createdAt: 1,
    name: 'beach.jpg',
    ...overrides,
});

const driveBackground = (overrides: Partial<DriveBackground> = {}): DriveBackground => ({
    nodeUid: 'node-1',
    revisionUid: 'revision-1',
    name: 'beach.jpg',
    mediaType: 'image/jpeg',
    createdAt: 1,
    ...overrides,
});

describe('planReconciliation', () => {
    it('does nothing for a node cached at the same revision', () => {
        expect(planReconciliation({ cached: [cachedBackground()], listed: [driveBackground()] })).toEqual({
            toFetch: [],
            toDelete: [],
        });
    });

    it('fetches the thumbnail of a node that is not cached', () => {
        const listed = driveBackground({ nodeUid: 'node-2' });

        expect(planReconciliation({ cached: [], listed: [listed] })).toEqual({ toFetch: [listed], toDelete: [] });
    });

    it('drops and refetches a node cached at a different revision', () => {
        const listed = driveBackground({ revisionUid: 'revision-2' });

        expect(planReconciliation({ cached: [cachedBackground()], listed: [listed] })).toEqual({
            toFetch: [listed],
            toDelete: ['node-1'],
        });
    });

    it('deletes a cached record the listing did not report', () => {
        expect(planReconciliation({ cached: [cachedBackground()], listed: [] })).toEqual({
            toFetch: [],
            toDelete: ['node-1'],
        });
    });
});
