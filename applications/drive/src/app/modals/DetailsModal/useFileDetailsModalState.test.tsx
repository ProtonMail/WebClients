import { renderHook, waitFor } from '@testing-library/react';

import type { NodeEntity } from '@proton/drive/index';
import { NodeType, RevisionState } from '@proton/drive/index';
import { recentlyAccessed } from '@proton/drive/modules/recentlyAccessed';
import { createMockNodeEntity } from '@proton/drive/modules/testing';

import { useFileDetailsModalState } from './useFileDetailsModalState';

const noop = () => {};

function renderDetails(
    node: NodeEntity,
    drive: { getNode: () => Promise<NodeEntity> } = { getNode: async () => node }
) {
    return renderHook(() =>
        useFileDetailsModalState({ nodeUid: node.uid, drive, open: true, onClose: noop, onExit: noop })
    );
}

describe('useFileDetailsModalState - isImported', () => {
    it('is true when the file active revision was imported', async () => {
        const node = createMockNodeEntity({
            type: NodeType.File,
            activeRevision: {
                uid: 'revision-uid',
                state: RevisionState.Active,
                creationTime: new Date('2024-01-01T00:00:00Z'),
                contentAuthor: { ok: true, value: 'content-author' },
                storageSize: 1024,
                isImported: true,
            },
        });

        const { result } = renderDetails(node);

        await waitFor(() => expect(result.current.details).toBeDefined());
        expect(result.current.details?.isImported).toBe(true);
    });

    it('is false when the file active revision was not imported', async () => {
        const node = createMockNodeEntity({
            type: NodeType.File,
            activeRevision: {
                uid: 'revision-uid',
                state: RevisionState.Active,
                creationTime: new Date('2024-01-01T00:00:00Z'),
                contentAuthor: { ok: true, value: 'content-author' },
                storageSize: 1024,
                isImported: false,
            },
        });

        const { result } = renderDetails(node);

        await waitFor(() => expect(result.current.details).toBeDefined());
        expect(result.current.details?.isImported).toBe(false);
    });

    it('is read from the folder details for a folder', async () => {
        const node = createMockNodeEntity({
            type: NodeType.Folder,
            activeRevision: undefined,
            folder: { isImported: true },
        });

        const { result } = renderDetails(node);

        await waitFor(() => expect(result.current.details).toBeDefined());
        expect(result.current.details?.isImported).toBe(true);
    });

    it('is undefined for a folder without folder details', async () => {
        const node = createMockNodeEntity({
            type: NodeType.Folder,
            activeRevision: undefined,
            folder: undefined,
        });

        const { result } = renderDetails(node);

        await waitFor(() => expect(result.current.details).toBeDefined());
        expect(result.current.details?.isImported).toBeUndefined();
    });
});

describe('useFileDetailsModalState - recently accessed reporting', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('reports the node as recently accessed once details load', async () => {
        const reportSpy = jest.spyOn(recentlyAccessed, 'report');
        const node = createMockNodeEntity({ type: NodeType.File });
        const drive = { getNode: async () => node };

        const { result } = renderDetails(node, drive);

        await waitFor(() => expect(result.current.details).toBeDefined());
        expect(reportSpy).toHaveBeenCalledWith(drive, [node.uid]);
    });

    it('does not report when loading the node fails', async () => {
        const reportSpy = jest.spyOn(recentlyAccessed, 'report');
        const node = createMockNodeEntity({ type: NodeType.File });
        const drive = {
            getNode: async () => {
                throw new Error('load error');
            },
        };

        const { result } = renderDetails(node, drive);

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(reportSpy).not.toHaveBeenCalled();
    });
});
