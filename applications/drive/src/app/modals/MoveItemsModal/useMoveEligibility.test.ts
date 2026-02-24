import { renderHook, waitFor } from '@testing-library/react';

import type { ProtonDriveClient } from '@proton/drive/index';
import { generateNodeUid } from '@proton/drive/index';

import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getNodeAncestry } from '../../utils/sdk/getNodeAncestry';
import { createMockNodeEntity } from '../../utils/test/nodeEntity';
import { useMoveEligibility } from './useMoveEligibility';

jest.mock('../../utils/errorHandling/handleSdkError', () => ({
    handleSdkError: jest.fn(),
}));

jest.mock('../../utils/sdk/getNodeAncestry', () => ({
    getNodeAncestry: jest.fn(),
}));

// const mockUseDrive = require('@proton/drive/index').useDrive;
const mockGetNodeAncestry = getNodeAncestry as jest.MockedFunction<typeof getNodeAncestry>;
const mockHandleSdkError = handleSdkError as jest.MockedFunction<typeof handleSdkError>;

const drive: ProtonDriveClient = {} as any;

/*
    Tests folder hierarchy setup:
    VOLUME_ROOT_NODE (vol1~root)
    ├── PARENT1_UID (vol1~parent1)
    │   └── FOLDER1_UID (vol1~folder1)
    │       └── SUBFOLDER1_UID (vol1~subfolder1)
    └── PARENT2_UID (vol1~parent2)
        └── FOLDER2_UID (vol1~folder2)
*/

const VOLUME_ROOT_NODE = generateNodeUid('vol1', 'root');
const PARENT1_UID = generateNodeUid('vol1', 'parent1');
const PARENT2_UID = generateNodeUid('vol1', 'parent2');
const FOLDER1_UID = generateNodeUid('vol1', 'folder1');
const SUBFOLDER1_UID = generateNodeUid('vol1', 'subfolder1');
const FOLDER2_UID = generateNodeUid('vol1', 'folder2');

const ITEM_CONFIG_FOLDER1 = {
    nodeUid: FOLDER1_UID,
    parentNodeUid: PARENT1_UID,
};

const ITEM_CONFIG_FOLDER2 = {
    nodeUid: FOLDER2_UID,
    parentNodeUid: PARENT2_UID,
};

const createMockAncestry = (...uids: string[]) => {
    return {
        ok: true as const,
        value: uids.map((uid) => ({ ok: true as const, value: createMockNodeEntity({ uid }) })),
    };
};

const mockAncestryForTarget = ({ target, targetAncestors }: { target: string; targetAncestors: string[] }) => {
    mockGetNodeAncestry.mockImplementation(async (calledTarget) => {
        expect(calledTarget).toBe(target);
        return createMockAncestry(...targetAncestors, target);
    });
};

describe('useMoveEligibility', () => {
    const mockDrive = {};

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('when no target folder is selected', () => {
        it('should mark move as invalid with appropriate message', async () => {
            const selectedItemConfigs = [ITEM_CONFIG_FOLDER1];
            const { result } = renderHook(() => useMoveEligibility(selectedItemConfigs, undefined, drive));

            await waitFor(() => {
                expect(result.current.isInvalidMove).toBe(true);
                expect(result.current.invalidMoveMessage).toBe('Select a destination folder');
            });
        });
    });

    describe('when moving to the same folder', () => {
        it('should mark move as invalid when item is already in target folder', async () => {
            const selectedItemConfigs = [ITEM_CONFIG_FOLDER1];
            const targetFolderUid = PARENT1_UID;

            mockAncestryForTarget({
                target: targetFolderUid,
                targetAncestors: [VOLUME_ROOT_NODE],
            });

            const { result } = renderHook(() => useMoveEligibility(selectedItemConfigs, targetFolderUid, drive));

            await waitFor(() => {
                expect(result.current.isInvalidMove).toBe(true);
                expect(result.current.invalidMoveMessage).toBe('Already in this folder');
            });
        });

        it('should mark move as invalid when any item is already in target folder', async () => {
            const selectedItemConfigs = [ITEM_CONFIG_FOLDER1, ITEM_CONFIG_FOLDER2];
            const targetFolderUid = PARENT2_UID;

            mockAncestryForTarget({
                target: targetFolderUid,
                targetAncestors: [VOLUME_ROOT_NODE],
            });

            const { result } = renderHook(() => useMoveEligibility(selectedItemConfigs, targetFolderUid, drive));

            await waitFor(() => {
                expect(result.current.isInvalidMove).toBe(true);
                expect(result.current.invalidMoveMessage).toBe('Already in this folder');
            });
        });
    });

    describe('when moving a folder into itself', () => {
        it('should mark move as invalid when target is a descendant of selected item', async () => {
            const selectedItemConfigs = [ITEM_CONFIG_FOLDER1];

            const targetFolderUid = SUBFOLDER1_UID;

            mockAncestryForTarget({
                target: targetFolderUid,
                targetAncestors: [VOLUME_ROOT_NODE, PARENT1_UID, FOLDER1_UID],
            });

            const { result } = renderHook(() => useMoveEligibility(selectedItemConfigs, targetFolderUid, drive));

            await waitFor(() => {
                expect(result.current.isInvalidMove).toBe(true);
                expect(result.current.invalidMoveMessage).toBe("Can't move a folder into itself");
            });

            expect(mockGetNodeAncestry).toHaveBeenCalledWith(targetFolderUid, mockDrive);
        });

        it('should mark move as invalid when any selected item is in target ancestry', async () => {
            const selectedItemConfigs = [ITEM_CONFIG_FOLDER1, ITEM_CONFIG_FOLDER2];
            const targetFolderUid = SUBFOLDER1_UID;

            mockAncestryForTarget({
                target: targetFolderUid,
                targetAncestors: [VOLUME_ROOT_NODE, PARENT1_UID, FOLDER1_UID],
            });

            const { result } = renderHook(() => useMoveEligibility(selectedItemConfigs, targetFolderUid, drive));

            await waitFor(() => {
                expect(result.current.isInvalidMove).toBe(true);
                expect(result.current.invalidMoveMessage).toBe("Can't move a folder into itself");
            });
        });
    });

    describe('when ancestry API returns an error', () => {
        it('should handle error and call handleSdkError', async () => {
            const selectedItemConfigs = [ITEM_CONFIG_FOLDER1];

            const targetFolderUid = PARENT2_UID;
            const mockError = new Error('API Error');

            mockGetNodeAncestry.mockResolvedValue({
                ok: false,
                error: mockError,
            });

            renderHook(() => useMoveEligibility(selectedItemConfigs, targetFolderUid, drive));

            await waitFor(() => {
                expect(mockHandleSdkError).toHaveBeenCalledWith(mockError, { showNotification: false });
            });
        });
    });

    describe('when move is valid', () => {
        it('should mark move as valid when all checks pass', async () => {
            const selectedItemConfigs = [ITEM_CONFIG_FOLDER1];
            const targetFolderUid = FOLDER2_UID;

            mockAncestryForTarget({
                target: targetFolderUid,
                targetAncestors: [VOLUME_ROOT_NODE, PARENT2_UID],
            });

            const { result } = renderHook(() => useMoveEligibility(selectedItemConfigs, targetFolderUid, drive));

            await waitFor(() => {
                expect(result.current.isInvalidMove).toBe(false);
                expect(result.current.invalidMoveMessage).toBeUndefined();
            });
        });
    });
});
