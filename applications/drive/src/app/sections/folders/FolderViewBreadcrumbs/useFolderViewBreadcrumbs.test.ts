import { act, renderHook, waitFor } from '@testing-library/react';

import { type NodeEntity, NodeType } from '@proton/drive/index';

import type { CrumbDefinition } from '../../../statelessComponents/Breadcrumbs/types';
import { sendErrorReport } from '../../../utils/errorHandling';
import { getNodeAncestry } from '../../../utils/sdk/getNodeAncestry';
import { NodeLocation, getNodeLocation } from '../../../utils/sdk/getNodeLocation';
import { createMockNodeEntity } from '../../../utils/test/nodeEntity';
import {
    SYNTHETIC_UID_DEVICES,
    SYNTHETIC_UID_SHARED_WITH_ME,
    useFolderViewBreadcrumbs,
} from './useFolderViewBreadcrumbs';

jest.mock('../../../utils/sdk/getNodeLocation');
const mockGetNodeLocation = jest.mocked(getNodeLocation);

jest.mock('../../../utils/sdk/getNodeAncestry');
const mockGetNodeAncestry = jest.mocked(getNodeAncestry);

jest.mock('../../../utils/errorHandling');
const mockedSendErrorReport = jest.mocked(sendErrorReport);

jest.mock('@proton/components', () => ({
    useNotifications: jest.fn(() => ({
        createNotification: jest.fn(),
    })),
}));

jest.mock('../../../hooks/drive/useNavigate', () => {
    return jest.fn().mockImplementation(() => ({
        navigateToLink: jest.fn(),
    }));
});

const mockDrive = {
    getNode: jest.fn(),
} as any;

const CURRENT_FILE_NODE_UID = 'file-node-uid';

const myFileRootNode = createMockNodeEntity({
    uid: 'uid-volume1Root',
    name: 'volume1Root',
    type: NodeType.Folder,
});

const folder1Node = createMockNodeEntity({
    uid: 'uid-folder1',
    name: 'folder1',
    type: NodeType.Folder,
});

const folder2Node = createMockNodeEntity({
    uid: 'uid-folder2',
    name: 'folder2',
    type: NodeType.Folder,
});

const deviceNode = createMockNodeEntity({
    uid: 'uid-device',
    name: 'My personal computer',
    type: NodeType.Folder,
});

// Test utilities
const mockNodeLocation = (location: NodeLocation) => {
    mockGetNodeLocation.mockResolvedValue({ ok: true, value: location });
};

const mockNodeAncestry = (nodes: NodeEntity[]) => {
    mockGetNodeAncestry.mockImplementation((nodeUid, _driveClient, includeSelf) => {
        expect(nodeUid).toBe(CURRENT_FILE_NODE_UID);
        expect(includeSelf).toBeFalsy();

        return Promise.resolve({
            ok: true,
            value: nodes.map((node) => ({ ok: true, value: node })),
        });
    });
};

const setupTest = (location: NodeLocation, ancestry: NodeEntity[]) => {
    mockNodeLocation(location);
    mockNodeAncestry(ancestry);
    return renderHook(() => useFolderViewBreadcrumbs(mockDrive));
};

const loadAndExpect = async (result: ReturnType<typeof setupTest>, expectedData: CrumbDefinition[]) => {
    expect(result.result.current.loading).toBe(false);

    let loadPromise: Promise<void>;
    act(() => {
        loadPromise = result.result.current.load(CURRENT_FILE_NODE_UID);
    });

    await waitFor(() => {
        expect(result.result.current.loading).toBe(true);
    });

    await act(async () => {
        await loadPromise;
    });

    await waitFor(() => {
        expect(result.result.current.loading).toBe(false);
        expect(result.result.current.data).toEqual(expectedData);
    });
};

const createCrumb = (
    name: string,
    uid: string,
    supportDropOperations: boolean,
    customOnItemClick?: () => void
): CrumbDefinition => {
    const crumb: CrumbDefinition = {
        name,
        uid,
        supportDropOperations,
        haveSignatureIssues: false,
    };
    if (customOnItemClick) {
        crumb.customOnItemClick = customOnItemClick;
    }
    return crumb;
};

const createCrumbWithCustomClick = (name: string, uid: string) => createCrumb(name, uid, false, expect.any(Function));

describe('useFolderViewBreadcrumbs', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should compute "My files" crumbs properly', async () => {
        const hook = setupTest(NodeLocation.MY_FILES, [myFileRootNode, folder1Node]);

        await loadAndExpect(hook, [
            createCrumb('My files', 'uid-volume1Root', true),
            createCrumb('folder1', 'uid-folder1', false),
        ]);
    });

    it('should compute "Shared with me" crumbs properly', async () => {
        const hook = setupTest(NodeLocation.SHARED_WITH_ME, [folder1Node, folder2Node]);

        await loadAndExpect(hook, [
            createCrumbWithCustomClick('Shared with me', SYNTHETIC_UID_SHARED_WITH_ME),
            createCrumb('folder1', 'uid-folder1', true),
            createCrumb('folder2', 'uid-folder2', false),
        ]);
    });

    it('should compute "Computers" crumbs properly', async () => {
        const hook = setupTest(NodeLocation.DEVICES, [deviceNode, folder1Node, folder2Node]);

        await loadAndExpect(hook, [
            createCrumbWithCustomClick('Computers', SYNTHETIC_UID_DEVICES),
            createCrumb('My personal computer', 'uid-device', false),
            createCrumb('folder1', 'uid-folder1', true),
            createCrumb('folder2', 'uid-folder2', false),
        ]);
    });

    it('should handle gracefully unsupported NodeLocation', async () => {
        const hook = setupTest(NodeLocation.PUBLIC_PAGE, [folder1Node, folder2Node]);

        await loadAndExpect(hook, [
            createCrumb('folder1', 'uid-folder1', true),
            createCrumb('folder2', 'uid-folder2', false),
        ]);

        expect(mockedSendErrorReport).toHaveBeenCalledWith(
            new Error('Unsupported NodeLocation <PUBLIC_PAGE> for useFolderViewBreadcrumbs')
        );
    });
});
