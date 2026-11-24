import { fireEvent, screen } from '@testing-library/react';

import useEventManager from '@proton/components/hooks/useEventManager';
import { mockUseCategoriesData } from '@proton/mail/testing/mockUseCategoriesData';
import { mockUseMailSettings } from '@proton/mail/testing/mockUseMailSettings';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { minimalCache } from '../../helpers/tests/cache';
import { clearAll } from '../../helpers/tests/helper';
import { mailTestRender } from '../../helpers/tests/render';
import SidebarItem from './SidebarItem';

vi.mock('proton-mail/hooks/mailbox/useElements', () => ({
    useGetElementsFromIDs: vi.fn(() => vi.fn()),
}));

vi.mock('proton-mail/hooks/useSelectAll', () => ({
    useSelectAll: vi.fn(() => ({ selectAll: false })),
}));

vi.mock('proton-mail/containers/CheckAllRefProvider', async () => ({
    ...(await vi.importActual('proton-mail/containers/CheckAllRefProvider')),
    useCheckAllRef: vi.fn(() => ({ checkAllRef: { current: null } })),
}));

vi.mock('proton-mail/store/hooks', async () => ({
    ...(await vi.importActual('proton-mail/store/hooks')),
    useMailSelector: vi.fn(() => ({ labelID: '0', sort: {}, filter: {}, search: {}, page: 0 })),
}));

vi.mock('@proton/components/containers/items/useItemsDroppable', () => ({
    __esModule: true,
    default: vi.fn(() => ({ dragOver: false, dragProps: {}, handleDrop: vi.fn() })),
}));

const defaultProps = {
    labelID: MAILBOX_LABEL_IDS.INBOX,
    isFolder: true,
    text: 'Inbox',
    moveToFolder: vi.fn(),
    applyLabels: vi.fn(),
};

describe('SidebarItem', () => {
    beforeEach(() => {
        minimalCache();
        mockUseMailSettings();
        mockUseCategoriesData({ isCategoryViewEnabled: false });
    });

    afterEach(() => {
        clearAll();
    });

    it('should trigger refresh when on inbox with category hash', async () => {
        mockUseCategoriesData({ isCategoryViewEnabled: true });

        await mailTestRender(<SidebarItem {...defaultProps} />, {
            initialEntries: ['/inbox#category=primary'],
        });

        fireEvent.click(screen.getByTestId('navigation-link:inbox'));

        expect(useEventManager.call).toHaveBeenCalled();
    });

    it('should trigger refresh when on inbox without category hash', async () => {
        await mailTestRender(<SidebarItem {...defaultProps} />, {
            initialEntries: ['/inbox'],
        });

        fireEvent.click(screen.getByTestId('navigation-link:inbox'));

        expect(useEventManager.call).toHaveBeenCalled();
    });

    it('should NOT trigger refresh when on inbox with extra hash params beyond category', async () => {
        mockUseCategoriesData({ isCategoryViewEnabled: true });

        await mailTestRender(<SidebarItem {...defaultProps} />, {
            initialEntries: ['/inbox#category=primary&page=2'],
        });

        fireEvent.click(screen.getByTestId('navigation-link:inbox'));

        expect(useEventManager.call).not.toHaveBeenCalled();
    });

    it('should NOT trigger refresh when hash contains a keyword search', async () => {
        await mailTestRender(<SidebarItem {...defaultProps} />, {
            initialEntries: ['/inbox#keyword'],
        });

        fireEvent.click(screen.getByTestId('navigation-link:inbox'));

        expect(useEventManager.call).not.toHaveBeenCalled();
    });

    it('should NOT trigger refresh when on a message inside inbox', async () => {
        mockUseCategoriesData({ isCategoryViewEnabled: true });

        await mailTestRender(<SidebarItem {...defaultProps} />, {
            initialEntries: ['/inbox/messageID#category=primary'],
        });

        fireEvent.click(screen.getByTestId('navigation-link:inbox'));

        expect(useEventManager.call).not.toHaveBeenCalled();
    });
});
