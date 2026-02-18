import { MemberRole, NodeType } from '@proton/drive';

import { getOpenInDocsInfo } from '../../../../utils/docs/openInDocs';
import type { SearchResultItemUI } from '../store';
import { createActionsItemChecker } from './actionsItemChecker';

jest.mock('../../../../utils/docs/openInDocs', () => ({
    ...jest.requireActual('../../../../utils/docs/openInDocs'),
    getOpenInDocsInfo: jest.fn(),
}));

const mockedGetOpenInDocsInfo = jest.mocked(getOpenInDocsInfo);

const createItem = (overrides: Partial<SearchResultItemUI> = {}): SearchResultItemUI => ({
    nodeUid: 'uid-1',
    parentUid: 'parent-uid',
    name: 'file.txt',
    type: NodeType.File,
    role: MemberRole.Editor,
    size: 1024,
    mediaType: 'text/plain',
    thumbnailId: undefined,
    modificationTime: new Date(),
    location: '/My files',
    haveSignatureIssues: false,
    ...overrides,
});

describe('createActionsItemChecker', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedGetOpenInDocsInfo.mockReturnValue(undefined);
    });

    describe('empty items', () => {
        it('should return multi-item checker with all flags disabled', () => {
            const result = createActionsItemChecker([], 'toolbar');

            expect(result).toEqual({
                canEdit: true,
                canDownload: false,
                canDelete: false,
                canGoToParent: false,
                canPreview: false,
                canRename: false,
                canShowDetails: false,
                canOpenInDocs: false,
                hasAtLeastOneSelectedItem: false,
            });
        });
    });

    describe('single item', () => {
        it('should allow rename and show details', () => {
            const result = createActionsItemChecker([createItem()], 'toolbar');

            expect(result.canRename).toBe(true);
            expect(result.canShowDetails).toBe(true);
        });

        it('should set firstItemUid', () => {
            const result = createActionsItemChecker([createItem({ nodeUid: 'my-uid' })], 'toolbar');

            expect(result).toHaveProperty('firstItemUid', 'my-uid');
        });

        it('should allow download and delete', () => {
            const result = createActionsItemChecker([createItem()], 'toolbar');

            expect(result.canDownload).toBe(true);
            expect(result.canDelete).toBe(true);
            expect(result.hasAtLeastOneSelectedItem).toBe(true);
        });

        describe('canEdit', () => {
            it('should be true for Editor role', () => {
                const result = createActionsItemChecker([createItem({ role: MemberRole.Editor })], 'toolbar');
                expect(result.canEdit).toBe(true);
            });

            it('should be true for Admin role', () => {
                const result = createActionsItemChecker([createItem({ role: MemberRole.Admin })], 'toolbar');
                expect(result.canEdit).toBe(true);
            });

            it('should be false for Viewer role', () => {
                const result = createActionsItemChecker([createItem({ role: MemberRole.Viewer })], 'toolbar');
                expect(result.canEdit).toBe(false);
            });
        });

        describe('canPreview', () => {
            it('should be true when preview is available', () => {
                const result = createActionsItemChecker([createItem({ mediaType: 'image/png', size: 500 })], 'toolbar');
                expect(result.canPreview).toBe(true);
            });

            it('should be false when preview is not available', () => {
                const result = createActionsItemChecker(
                    [createItem({ mediaType: 'no-preview-mime-type/ext', size: 500 })],
                    'toolbar'
                );

                expect(result.canPreview).toBe(false);
            });

            it('should be false when mediaType is undefined', () => {
                const result = createActionsItemChecker([createItem({ mediaType: undefined })], 'toolbar');

                expect(result.canPreview).toBe(false);
            });
        });

        describe('canOpenInDocs', () => {
            it('should be true for native documents', () => {
                const docsInfo = { type: 'document' as const, isNative: true };
                mockedGetOpenInDocsInfo.mockReturnValue(docsInfo);

                const result = createActionsItemChecker([createItem({ role: MemberRole.Viewer })], 'toolbar');

                expect(result.canOpenInDocs).toBe(true);
                expect(result).toHaveProperty('openInDocsInfo', docsInfo);
            });

            it('should be true for non-native documents when user can edit', () => {
                const docsInfo = { type: 'document' as const, isNative: false };
                mockedGetOpenInDocsInfo.mockReturnValue(docsInfo);

                const result = createActionsItemChecker([createItem({ role: MemberRole.Editor })], 'toolbar');

                expect(result.canOpenInDocs).toBe(true);
                expect(result).toHaveProperty('openInDocsInfo', docsInfo);
            });

            it('should be false for non-native documents when user cannot edit', () => {
                const docsInfo = { type: 'document' as const, isNative: false };
                mockedGetOpenInDocsInfo.mockReturnValue(docsInfo);

                const result = createActionsItemChecker([createItem({ role: MemberRole.Viewer })], 'toolbar');

                expect(result.canOpenInDocs).toBe(false);
            });

            it('should be false when getOpenInDocsInfo returns undefined', () => {
                mockedGetOpenInDocsInfo.mockReturnValue(undefined);

                const result = createActionsItemChecker([createItem()], 'toolbar');

                expect(result.canOpenInDocs).toBe(false);
            });

            it('should not check docs info when mediaType is undefined', () => {
                const result = createActionsItemChecker([createItem({ mediaType: undefined })], 'toolbar');

                expect(mockedGetOpenInDocsInfo).not.toHaveBeenCalled();
                expect(result.canOpenInDocs).toBe(false);
            });
        });

        describe('canGoToParent', () => {
            it('should be true when parentUid is defined and buttonType is contextMenu', () => {
                const result = createActionsItemChecker([createItem({ parentUid: 'parent-uid' })], 'contextMenu');

                expect(result.canGoToParent).toBe(true);
                expect(result).toHaveProperty('parentNodeUid', 'parent-uid');
            });

            it('should be false when parentUid is defined but buttonType is toolbar', () => {
                const result = createActionsItemChecker([createItem({ parentUid: 'parent-uid' })], 'toolbar');

                expect(result.canGoToParent).toBe(false);
                expect(result).not.toHaveProperty('parentNodeUid');
            });

            it('should be false when parentUid is undefined', () => {
                const result = createActionsItemChecker([createItem({ parentUid: undefined })], 'contextMenu');

                expect(result.canGoToParent).toBe(false);
                expect(result).not.toHaveProperty('parentNodeUid');
            });
        });
    });

    describe('multiple items', () => {
        it('should disable single-item actions', () => {
            const items = [createItem({ nodeUid: 'uid-1' }), createItem({ nodeUid: 'uid-2' })];
            const result = createActionsItemChecker(items, 'toolbar');

            expect(result.canPreview).toBe(false);
            expect(result.canRename).toBe(false);
            expect(result.canShowDetails).toBe(false);
            expect(result.canOpenInDocs).toBe(false);
            expect(result.canGoToParent).toBe(false);
            expect(result).not.toHaveProperty('firstItemUid');
        });

        it('should allow download and delete', () => {
            const items = [createItem({ nodeUid: 'uid-1' }), createItem({ nodeUid: 'uid-2' })];
            const result = createActionsItemChecker(items, 'toolbar');

            expect(result.canDownload).toBe(true);
            expect(result.canDelete).toBe(true);
            expect(result.hasAtLeastOneSelectedItem).toBe(true);
        });

        it('should allow edit when all items are editors', () => {
            const items = [
                createItem({ nodeUid: 'uid-1', role: MemberRole.Editor }),
                createItem({ nodeUid: 'uid-2', role: MemberRole.Admin }),
            ];
            const result = createActionsItemChecker(items, 'toolbar');

            expect(result.canEdit).toBe(true);
        });

        it('should disallow edit when any item is viewer', () => {
            const items = [
                createItem({ nodeUid: 'uid-1', role: MemberRole.Editor }),
                createItem({ nodeUid: 'uid-2', role: MemberRole.Viewer }),
            ];
            const result = createActionsItemChecker(items, 'toolbar');

            expect(result.canEdit).toBe(false);
        });
    });
});
