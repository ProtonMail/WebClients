import { act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MemberRole, NodeType } from '@proton/drive';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';
import { renderWithProviders } from '@proton/testing/lib/context/renderWithProviders';

import { useContextMenuStore } from '../../../modules/contextMenu';
import { featureFlagStore } from '../../../modules/featureFlag';
import { useSelectionStore } from '../../../modules/selection';
import type { FolderViewItem } from '../useFolder.store';
import { useFolderStore } from '../useFolder.store';
import { FolderBrowser } from './FolderBrowser';

// This file covers FolderBrowser-specific keyboard a11y: real cell content
// (checkbox, share icon, context-menu button), the real selection store, and
// real navigation wiring. Generic arrow-key behavior is covered by
// DriveExplorer.keyboardNavigation.test.tsx at the stateless layer.

jest.mock('@proton/components/hooks/useActiveBreakpoint', () => ({
    __esModule: true,
    default: () => ({
        viewportWidth: {
            '<=small': false,
            isSmall: false,
            isMedium: false,
            isLarge: true,
            '>=large': true,
        },
        activeBreakpoint: 'large',
    }),
}));

const mockNavigateToLink = jest.fn();
const mockNavigateToRoot = jest.fn();
jest.mock('../../../legacy/hooks/drive/useNavigate', () => ({
    __esModule: true,
    default: () => ({ navigateToLink: mockNavigateToLink, navigateToRoot: mockNavigateToRoot }),
}));

jest.mock('../../../legacy/store/_documents', () => ({
    useOpenInDocs: () => ({ canOpen: false }),
}));

jest.mock('../../../modules/userSettings', () => ({
    useUserSettings: () => ({
        layout: 0,
        changeLayout: jest.fn(),
    }),
}));

jest.mock('../../../legacy/components/sections/useIsEditEnabled', () => ({
    __esModule: true,
    default: () => false,
}));

jest.mock('../../../legacy/hooks/drive/useActiveShare', () => ({
    useActiveShare: () => ({
        activeFolder: { shareId: 'share-1', linkId: 'link-1', volumeId: 'vol-1' },
    }),
}));

const mockShowSharingModal = jest.fn();
jest.mock('@proton/drive/modals/sharingModal', () => ({
    useSharingModal: () => ({
        sharingModal: null,
        showSharingModal: mockShowSharingModal,
    }),
}));

// jest.setup.js mocks dateFnLocales to an empty module, which leaves
// `dateLocale` in @proton/shared/lib/i18n as undefined. The modified-time cell
// (rendered at >=large breakpoint) reads dateLocale.code via <TimeIntl> and
// crashes. Override dateFnLocales here to supply the real enUS locale.
jest.mock('@proton/shared/lib/i18n/dateFnLocales', () => {
    const enUS = require('date-fns/locale/en-US').default ?? require('date-fns/locale/en-US');
    return {
        __esModule: true,
        enUSLocale: enUS,
        enGBLocale: enUS,
        faIRLocale: enUS,
        getDateFnLocale: () => enUS,
        default: {},
    };
});

function makeFolderItem(i: number, overrides: Partial<FolderViewItem> = {}): FolderViewItem {
    return {
        uid: `vol-1~link-${i}`,
        name: `file-${i}.txt`,
        rootShareId: 'share-1',
        parentLinkId: 'parent-1',
        linkId: `link-${i}`,
        volumeId: 'vol-1',
        activeRevisionUid: undefined,
        id: `link-${i}`,
        mimeType: 'application/octet-stream',
        isFile: true,
        hasThumbnail: false,
        size: 1,
        metaDataModifyTime: i,
        fileModifyTime: new Date(2020, 0, 1 + i),
        trashed: null,
        parentUid: 'vol-1~parent-1',
        hasSignatureIssues: false,
        type: NodeType.File,
        effectiveRole: MemberRole.Admin,
        ...overrides,
    };
}

function seedFolder(items: FolderViewItem[]) {
    act(() => {
        useFolderStore.getState().setFolder(
            {
                uid: 'vol-1~parent-1',
                name: 'My folder',
                parentUid: undefined,
                isRoot: true,
                shareId: 'share-1',
            },
            'tree-event-scope-1'
        );
        useFolderStore.getState().setRole(MemberRole.Admin);
        useFolderStore.getState().setItems(items);
        useSelectionStore.getState().setAllItemIds(new Set(items.map((i) => i.uid)));
    });
}

function getRow(uid: string): HTMLElement {
    const row = document.querySelector(`[data-drive-explorer-item-uid="${CSS.escape(uid)}"]`);
    if (!row) {
        throw new Error(`Row not found for uid ${uid}`);
    }
    return row as HTMLElement;
}

function queryRequired<E extends HTMLElement>(root: HTMLElement, selector: string, label: string): E {
    const el = root.querySelector<E>(selector);
    if (!el) {
        throw new Error(`${label} not found (selector: ${selector})`);
    }
    return el;
}

function getActivator(uid: string): HTMLElement {
    return queryRequired(getRow(uid), '[data-testid="item-a11y-activator"]', 'Activator');
}

function getCheckbox(uid: string): HTMLInputElement {
    return queryRequired<HTMLInputElement>(getRow(uid), 'input[type="checkbox"]', 'Checkbox');
}

function getShareButton(uid: string): HTMLElement | null {
    return getRow(uid).querySelector<HTMLElement>('[data-testid="column-share-options"] button');
}

function getContextMenuButton(uid: string): HTMLElement {
    return queryRequired(getRow(uid), '[data-testid="column-options"] button', 'Context menu button');
}

function renderBrowser(items: FolderViewItem[], layout: LayoutSetting = LayoutSetting.List) {
    seedFolder(items);
    return renderWithProviders(
        <FolderBrowser
            activeFolder={{ shareId: 'share-1', linkId: 'link-1', volumeId: 'vol-1' }}
            layout={layout}
            sortedList={items}
            onSortChange={jest.fn()}
        />
    );
}

const resetStores = () => {
    act(() => {
        useFolderStore.getState().reset();
        useSelectionStore.getState().clearSelections();
        useContextMenuStore.getState().close();
    });
};

describe('FolderBrowser keyboard a11y (cell content)', () => {
    beforeAll(() => {
        Element.prototype.scrollIntoView = jest.fn();
        featureFlagStore.setState({ isEnabled: () => false });
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 800 });
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 1024 });
    });

    beforeEach(() => {
        resetStores();
        mockNavigateToLink.mockReset();
        mockNavigateToRoot.mockReset();
        mockShowSharingModal.mockReset();
    });

    it('Enter on a focused folder row triggers navigation', async () => {
        const folder = makeFolderItem(0, {
            isFile: false,
            type: NodeType.Folder,
            mimeType: 'application/vnd.proton.folder',
        });
        renderBrowser([folder, makeFolderItem(1)]);
        const user = userEvent.setup();

        getActivator(folder.uid).focus();
        await user.keyboard('{Enter}');

        expect(mockNavigateToLink).toHaveBeenCalledWith('share-1', 'link-0', false);
    });

    // Helpers: tests below ONLY focus the row activator (the keyboard entry point) and
    // reach inner controls via Tab/Shift+Tab/Arrow keys, mirroring real keyboard usage.
    // Direct .focus() on checkbox/share/overflow would bypass the very thing we want to
    // verify: that those controls are reachable in the natural tab order.

    it('Tab from the row activator moves focus to the row checkbox', async () => {
        const items = [makeFolderItem(0)];
        renderBrowser(items);
        const user = userEvent.setup();

        getActivator(items[0].uid).focus();
        await user.tab();

        expect(document.activeElement).toBe(getCheckbox(items[0].uid));
    });

    it('Space on the row checkbox (reached via Tab) selects then deselects the row', async () => {
        const items = [makeFolderItem(0), makeFolderItem(1)];
        renderBrowser(items);
        const user = userEvent.setup();

        getActivator(items[0].uid).focus();
        await user.tab(); // activator -> checkbox

        expect(document.activeElement).toBe(getCheckbox(items[0].uid));

        await user.keyboard(' ');
        expect(useSelectionStore.getState().selectedItemIds.has(items[0].uid)).toBe(true);

        await user.keyboard(' ');
        expect(useSelectionStore.getState().selectedItemIds.has(items[0].uid)).toBe(false);
    });

    it('Selecting several rows by arrow-navigating between them and toggling checkboxes', async () => {
        const items = [makeFolderItem(0), makeFolderItem(1), makeFolderItem(2)];
        renderBrowser(items);
        const user = userEvent.setup();

        getActivator(items[0].uid).focus();

        for (let i = 0; i < items.length; i++) {
            if (i > 0) {
                // Move from previous row's checkbox back to its activator, then down.
                await user.tab({ shift: true });
                await user.keyboard('{ArrowDown}');
            }
            await user.tab(); // activator -> checkbox of current row
            expect(document.activeElement).toBe(getCheckbox(items[i].uid));
            await user.keyboard(' ');
        }

        expect(Array.from(useSelectionStore.getState().selectedItemIds).sort()).toEqual(
            items.map((it) => it.uid).sort()
        );
    });

    it('Share icon is reachable by Tab and activates the share handler from keyboard', async () => {
        const shared = makeFolderItem(0, { isShared: true });
        renderBrowser([shared]);
        const user = userEvent.setup();

        getActivator(shared.uid).focus();
        await user.tab(); // checkbox
        await user.tab(); // share button

        const shareButton = getShareButton(shared.uid);
        if (!shareButton) {
            throw new Error('Share button should be rendered for a shared item owned by an admin');
        }
        expect(document.activeElement).toBe(shareButton);

        await user.keyboard(' ');

        expect(mockShowSharingModal).toHaveBeenCalledWith(expect.objectContaining({ nodeUid: shared.uid }));
    });

    it('Context menu button is reachable by Tab and keyboard activation opens the menu', async () => {
        const items = [makeFolderItem(0)]; // not shared, so tab order: activator -> checkbox -> ...
        renderBrowser(items);
        const user = userEvent.setup();

        getActivator(items[0].uid).focus();
        await user.tab(); // checkbox
        await user.tab(); // ... button

        expect(document.activeElement).toBe(getContextMenuButton(items[0].uid));

        await user.keyboard(' ');

        await waitFor(() => {
            expect(useContextMenuStore.getState().isOpen).toBe(true);
        });
        // Keyboard activation (detail === 0) anchors the menu at the button's rect, so
        // position should be set (not the {0,0} fallback that the bare event would give).
        expect(useContextMenuStore.getState().position).toBeDefined();
        // The row should also be selected as a side-effect of opening the menu on it.
        expect(useSelectionStore.getState().selectedItemIds.has(items[0].uid)).toBe(true);
    });

    it('Closing the context menu store leaves the row in the DOM (focus survives)', async () => {
        const items = [makeFolderItem(0)];
        renderBrowser(items);
        const user = userEvent.setup();

        getActivator(items[0].uid).focus();
        await user.tab();
        await user.tab(); // ... button
        await user.keyboard(' ');

        await waitFor(() => {
            expect(useContextMenuStore.getState().isOpen).toBe(true);
        });

        act(() => {
            useContextMenuStore.getState().close();
        });

        // After close, the trigger button is still in the DOM and remains focusable.
        // (The real Dropdown handles focus return; here we just guard against the row
        // being unmounted or the trigger disappearing on close.)
        expect(getContextMenuButton(items[0].uid)).toBeInTheDocument();
        expect(useContextMenuStore.getState().isOpen).toBe(false);
    });

    it('Shift+Tab walks focus backwards through a row (... -> share -> checkbox -> activator)', async () => {
        const shared = makeFolderItem(0, { isShared: true });
        renderBrowser([shared]);
        const user = userEvent.setup();

        // Walk forward to the last focusable in the row.
        getActivator(shared.uid).focus();
        await user.tab(); // checkbox
        await user.tab(); // share
        await user.tab(); // ... button
        expect(document.activeElement).toBe(getContextMenuButton(shared.uid));

        // Walk backward the same way.
        await user.tab({ shift: true });
        expect(document.activeElement).toBe(getShareButton(shared.uid));

        await user.tab({ shift: true });
        expect(document.activeElement).toBe(getCheckbox(shared.uid));

        await user.tab({ shift: true });
        expect(document.activeElement).toBe(getActivator(shared.uid));
    });
});
