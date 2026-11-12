import { act, renderHook, waitFor } from '@testing-library/react';

import { useNotifications } from '@proton/app-context/useNotifications';
import { MemberRole, type NodeEntity, NodeType, useDrive } from '@proton/drive/sdk';

import { useFolder } from './useFolder';
import { useFolderStore } from './useFolder.store';

jest.mock('@proton/drive/sdk', () => ({
    ...jest.requireActual('@proton/drive/sdk'),
    useDrive: jest.fn(),
}));
jest.mock('@proton/app-context/useNotifications', () => ({ useNotifications: jest.fn() }));
jest.mock('@proton/unleash/useFlag', () => ({ useFlag: () => false }));

const createFolderNode = (uid: string, parentUid?: string) =>
    ({
        uid,
        parentUid,
        type: NodeType.Folder,
        name: { ok: true, value: uid },
        keyAuthor: { ok: true },
        nameAuthor: { ok: true },
        directRole: MemberRole.Admin,
        treeEventScopeId: 'scope-id',
        creationTime: new Date(),
        modificationTime: new Date(),
    }) as unknown as NodeEntity;

const nodes: Record<string, NodeEntity> = {
    'volume~folder-a': createFolderNode('volume~folder-a'),
    'volume~child': createFolderNode('volume~child', 'volume~folder-a'),
};

let releaseChildren: (() => void) | undefined;

beforeEach(() => {
    releaseChildren = undefined;
    useFolderStore.getState().reset();
    jest.mocked(useNotifications).mockReturnValue({ createNotification: jest.fn() } as unknown as ReturnType<
        typeof useNotifications
    >);
    jest.mocked(useDrive).mockReturnValue({
        drive: {
            getNodeHierarchy: async (uid: string) => [nodes[uid]],
            iterateFolderChildrenNodeUids: async function* () {
                await new Promise<void>((resolve) => {
                    releaseChildren = resolve;
                });
                yield 'volume~child';
            },
            iterateNodes: async function* (uids: string[]) {
                for (const uid of uids) {
                    yield nodes[uid];
                }
            },
        },
    } as unknown as ReturnType<typeof useDrive>);
});

const startLoadingFolderA = () => {
    const { result } = renderHook(() => useFolder());
    return result.current.load('volume~folder-a', 'share-id', new AbortController());
};

describe('useFolder', () => {
    it('lists the folder children once loaded', async () => {
        const listing = startLoadingFolderA();
        await waitFor(() => expect(releaseChildren).toBeDefined());

        releaseChildren?.();
        await act(() => listing);

        const { isLoading, folder, items } = useFolderStore.getState();
        expect(isLoading).toBe(false);
        expect(folder?.uid).toBe('volume~folder-a');
        expect([...items.keys()]).toEqual(['volume~child']);
    });

    it('leaves the next folder loading when the previous folder finishes listing after navigation', async () => {
        const listing = startLoadingFolderA();
        await waitFor(() => expect(releaseChildren).toBeDefined());

        act(() => {
            useFolderStore.getState().reset();
            useFolderStore.getState().setIsLoading(true);
        });
        releaseChildren?.();
        await act(() => listing);

        const { isLoading, hasEverLoaded, folder, items } = useFolderStore.getState();
        expect(isLoading).toBe(true);
        expect(hasEverLoaded).toBe(false);
        expect(folder).toBeUndefined();
        expect(items.size).toBe(0);
    });
});
