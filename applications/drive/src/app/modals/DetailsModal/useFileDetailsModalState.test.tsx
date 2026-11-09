import { renderHook, waitFor } from '@testing-library/react';

import { handleSdkError } from '@proton/drive/legacy/errorHandling';
import { recentlyAccessed } from '@proton/drive/modules/recentlyAccessed';
import { createMockNodeEntity } from '@proton/drive/modules/testing';
import type { NodeEntity } from '@proton/drive/sdk';
import { NodeType, RevisionState } from '@proton/drive/sdk';

import { useFileDetailsModalState } from './useFileDetailsModalState';

// The real handler logs and reports to Sentry, which under CI load can block long enough for waitFor to time out.
jest.mock('@proton/drive/legacy/errorHandling', () => ({
    ...jest.requireActual('@proton/drive/legacy/errorHandling'),
    handleSdkError: jest.fn(),
}));

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
        const error = new Error('load error');
        const drive = {
            getNode: async () => {
                throw error;
            },
        };

        const { result } = renderDetails(node, drive);

        await waitFor(() => expect(result.current.hasError).toBe(true));
        expect(handleSdkError).toHaveBeenCalledWith(error, expect.objectContaining({ extra: { nodeUid: node.uid } }));
        expect(reportSpy).not.toHaveBeenCalled();
    });
});
