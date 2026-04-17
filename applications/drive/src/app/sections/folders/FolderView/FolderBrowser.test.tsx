import { act, screen, waitFor } from '@testing-library/react';

import { MemberRole, NodeType } from '@proton/drive';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';
import { renderWithProviders } from '@proton/testing/lib/context/renderWithProviders';

import { useContextMenuStore } from '../../../modules/contextMenu';
import { useSelectionStore } from '../../../modules/selection';
import type { FolderViewItem } from '../useFolder.store';
import { useFolderStore } from '../useFolder.store';
import { FolderBrowser } from './FolderBrowser';

jest.mock('@proton/components/hooks/useActiveBreakpoint', () => ({
    __esModule: true,
    default: () => ({
        viewportWidth: { '<=small': false, isSmall: false, isMedium: false, isLarge: true },
        activeBreakpoint: 'large',
    }),
}));

jest.mock('../../../hooks/drive/useNavigate', () => ({
    __esModule: true,
    default: () => ({ navigateToLink: jest.fn() }),
}));

jest.mock('../../../store/_documents', () => ({
    useOpenInDocs: () => ({ canOpen: false }),
}));

jest.mock('../../../hooks/user', () => ({
    useUserSettings: () => ({
        layout: 0,
        changeLayout: jest.fn(),
    }),
}));

jest.mock('../../../components/sections/useIsEditEnabled', () => ({
    __esModule: true,
    default: () => false,
}));

jest.mock('../../../hooks/drive/useActiveShare', () => ({
    useActiveShare: () => ({
        activeFolder: { shareId: 'share-1', linkId: 'link-1', volumeId: 'vol-1' },
    }),
}));

const resetStores = () => {
    act(() => {
        useFolderStore.getState().reset();
        useSelectionStore.getState().clearSelections();
        useContextMenuStore.getState().close();
    });
};

function buildItem(role: MemberRole): FolderViewItem {
    return {
        uid: 'vol-1~link-1',
        name: 'whatever',
        rootShareId: 'share-1',
        parentLinkId: 'parent-1',
        linkId: 'link-1',
        volumeId: 'vol-1',
        activeRevisionUid: undefined,
        id: 'link-1',
        mimeType: 'text/plain',
        isFile: true,
        hasThumbnail: false,
        size: 1,
        metaDataModifyTime: 0,
        fileModifyTime: new Date(),
        trashed: null,
        parentUid: 'vol-1~parent-1',
        hasSignatureIssues: false,
        type: NodeType.File,
        effectiveRole: role,
    };
}

function renderFolderBrowser(role: MemberRole, buttonType: 'toolbar' | 'contextMenu') {
    const item = buildItem(role);

    act(() => {
        useFolderStore.getState().setItems([item]);
        useSelectionStore.getState().setAllItemIds(new Set([item.uid]));
        useSelectionStore.getState().selectItem(item.uid);
        if (buttonType === 'contextMenu') {
            useContextMenuStore.setState({
                isOpen: true,
                type: 'item',
                position: { top: 0, left: 0 },
            });
        }
    });

    return renderWithProviders(
        <FolderBrowser
            activeFolder={{ shareId: 'share-1', linkId: 'link-1', volumeId: 'vol-1' }}
            layout={LayoutSetting.List}
            sortedList={[item]}
            onSortChange={jest.fn()}
        />
    );
}

describe('FolderBrowser', () => {
    beforeEach(() => {
        resetStores();
    });

    it('renders without crashing', () => {
        const { container } = renderWithProviders(
            <FolderBrowser
                activeFolder={{ shareId: 'share-1', linkId: 'link-1', volumeId: 'vol-1' }}
                layout={LayoutSetting.List}
                sortedList={[]}
                onSortChange={jest.fn()}
            />
        );

        expect(container).toBeTruthy();
    });

    it('item can be re-shared if user has admin rights (context menu)', async () => {
        renderFolderBrowser(MemberRole.Admin, 'contextMenu');

        await waitFor(() => {
            expect(screen.getByTestId('context-menu-share-link')).toBeInTheDocument();
        });
    });

    it('item can be re-shared if user has admin rights (toolbar)', async () => {
        renderFolderBrowser(MemberRole.Admin, 'toolbar');

        await waitFor(() => {
            expect(screen.getByTestId('toolbar-share-link')).toBeInTheDocument();
        });
    });

    it('item cannot be re-shared if user has viewer rights (context menu)', async () => {
        renderFolderBrowser(MemberRole.Viewer, 'contextMenu');

        await waitFor(() => {
            expect(screen.queryByTestId('context-menu-share-link')).not.toBeInTheDocument();
        });
    });

    it('item cannot be re-shared if user has viewer rights (toolbar)', async () => {
        renderFolderBrowser(MemberRole.Viewer, 'toolbar');

        await waitFor(() => {
            expect(screen.queryByTestId('toolbar-share-link')).not.toBeInTheDocument();
        });
    });
});
