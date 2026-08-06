import { act, cleanup, fireEvent, screen } from '@testing-library/react';

import { MemberRole, NodeType } from '@proton/drive';
import { renderWithProviders } from '@proton/testing/lib/context/renderWithProviders';

import { ActionsDropdown } from '../buttons/ActionsDropdown';
import { FolderItemContextMenu } from '../menus/FolderItemContextMenu';
import type { FolderPermissions, FolderViewItem } from '../useFolder.store';
import { useFolderStore } from '../useFolder.store';
import type { FolderActions } from '../useFolderActions';

jest.mock('../../../utils/docs/openInDocs', () => ({
    getOpenInDocsInfo: () => undefined,
    downloadDocument: jest.fn(),
}));

jest.mock('../../../legacy/components/sections/useIsEditEnabled', () => ({
    __esModule: true,
    default: () => false,
}));

// Report abuse is behind a flag; turn it on so its (in)visibility is actually exercised.
jest.mock('@proton/unleash/useFlag', () => ({
    __esModule: true,
    useFlag: (flag: string) => flag === 'DriveWebReportAbuseDirectShare',
}));

// The dropdown never carries the quick actions: they stay as standalone toolbar buttons on mobile.
const QUICK_ACTIONS = ['preview', 'openInDocs', 'download'];

const CONTEXT_TESTID_BY_ACTION: Record<string, string> = {
    preview: 'context-menu-preview',
    openInDocs: 'context-menu-open-document',
    download: 'context-menu-download',
    copyLink: 'context-menu-copy-link',
    shareLink: 'context-menu-share-link',
    move: 'context-menu-move',
    copy: 'context-menu-copy',
    rename: 'context-menu-rename',
    details: 'context-menu-details',
    revisions: 'context-menu-revisions',
    trash: 'context-menu-trash',
    reportAbuse: 'context-menu-report-abuse',
};

const collectMenuActions = (): Set<string> => {
    const present = new Set<string>();
    for (const [action, testId] of Object.entries(CONTEXT_TESTID_BY_ACTION)) {
        if (screen.queryByTestId(testId)) {
            present.add(action);
        }
    }
    return present;
};

const buildPermissions = (overrides: Partial<FolderPermissions> = {}): FolderPermissions => ({
    canEdit: true,
    canShare: true,
    canCreateNode: true,
    canCreateDocs: true,
    canCreateSheets: true,
    canOpenInDocs: true,
    canShareNode: true,
    canMove: true,
    canCopy: true,
    canRename: true,
    canTrash: true,
    canReportAbuse: true,
    ...overrides,
});

const buildItem = (role: MemberRole): FolderViewItem => ({
    uid: 'vol-1~link-1',
    name: 'file.png',
    rootShareId: 'share-1',
    parentLinkId: 'parent-1',
    linkId: 'link-1',
    volumeId: 'vol-1',
    activeRevisionUid: 'rev-1',
    id: 'link-1',
    mimeType: 'image/png',
    isFile: true,
    isSharedPublicly: true,
    hasThumbnail: false,
    size: 1024,
    metaDataModifyTime: 0,
    fileModifyTime: new Date(0),
    trashed: null,
    parentUid: 'vol-1~parent-1',
    hasSignatureIssues: false,
    type: NodeType.File,
    effectiveRole: role,
});

const buildActions = (): FolderActions =>
    ({
        showPreviewModal: jest.fn(),
        showPreviewForNode: jest.fn(),
        showRenameModal: jest.fn(),
        showMoveModal: jest.fn(),
        showCopyModal: jest.fn(),
        showCreateFileModal: jest.fn(),
        showCreateFolderModal: jest.fn(),
        showDetailsModal: jest.fn(),
        showRevisionsModal: jest.fn(),
        showSharingModal: jest.fn(),
        showFileSharingModal: jest.fn(),
        showReportAbuseModal: jest.fn(),
        createNewDocument: jest.fn(),
        createNewSheet: jest.fn(),
        getPublicLinkInfo: jest.fn().mockResolvedValue(undefined),
    }) as unknown as FolderActions;

const setPermissions = (permissions: FolderPermissions) => {
    act(() => {
        useFolderStore.getState().reset();
        useFolderStore.getState().setPermissions(permissions);
    });
};

const noop = () => {};

// The context menu content lives inside a right-click surface (ItemContextMenu). We drive it directly
// with a controlled `isOpen` and no-op open/close so nothing depends on the shared context-menu store,
// its async open() timer, or FolderBrowser's mount-effect close() — all sources of flakiness.
const getContextMenuActions = async (permissions: FolderPermissions, role: MemberRole): Promise<Set<string>> => {
    setPermissions(permissions);
    const item = buildItem(role);
    const anchorRef = { current: document.createElement('div') };

    renderWithProviders(
        <FolderItemContextMenu
            isOpen
            position={{ top: 0, left: 0 }}
            open={noop}
            close={noop}
            anchorRef={anchorRef}
            selectedItems={[item]}
            shareId="share-1"
            linkId="link-1"
            volumeId="vol-1"
            actions={buildActions()}
            canShareSelectedItem={role === MemberRole.Admin}
        />
    );

    await screen.findByTestId('context-menu-details');
    return collectMenuActions();
};

const getDropdownActions = async (permissions: FolderPermissions, role: MemberRole): Promise<Set<string>> => {
    setPermissions(permissions);
    const item = buildItem(role);

    renderWithProviders(
        <ActionsDropdown
            selectedItems={[item]}
            permissions={permissions}
            canShareSelectedItem={role === MemberRole.Admin}
            actions={buildActions()}
        />
    );

    await act(async () => {
        fireEvent.click(screen.getByTestId('actions-dropdown'));
    });
    await screen.findByTestId('context-menu-details');
    return collectMenuActions();
};

describe('Folder selection actions parity (context menu vs actions dropdown)', () => {
    afterEach(() => {
        cleanup();
        act(() => {
            useFolderStore.getState().reset();
        });
    });

    it('dropdown offers the same actions as the context menu for an admin', async () => {
        const permissions = buildPermissions();

        const contextMenuActions = await getContextMenuActions(permissions, MemberRole.Admin);
        cleanup();
        const dropdownActions = await getDropdownActions(permissions, MemberRole.Admin);

        expect(contextMenuActions).toContain('reportAbuse');

        const expected = new Set([...contextMenuActions].filter((action) => !QUICK_ACTIONS.includes(action)));

        expect(dropdownActions).toEqual(expected);
    });

    it('dropdown stays in sync with the context menu for a viewer', async () => {
        const permissions = buildPermissions({
            canEdit: false,
            canShare: false,
            canShareNode: false,
            canOpenInDocs: false,
            canMove: false,
            canRename: false,
            canTrash: false,
            canReportAbuse: false,
            canCopy: true,
        });

        const contextMenuActions = await getContextMenuActions(permissions, MemberRole.Viewer);
        cleanup();
        const dropdownActions = await getDropdownActions(permissions, MemberRole.Viewer);

        const expected = new Set([...contextMenuActions].filter((action) => !QUICK_ACTIONS.includes(action)));

        expect(dropdownActions).toEqual(expected);
    });
});
