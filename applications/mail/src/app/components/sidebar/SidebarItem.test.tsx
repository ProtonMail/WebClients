import { fireEvent, screen } from '@testing-library/react';

import useEventManager from '@proton/components/hooks/useEventManager';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { mockUseCategoriesData } from '@proton/testing/lib/mockUseCategoriesData';
import { mockUseMailSettings } from '@proton/testing/lib/mockUseMailSettings';

import { clearAll, mailTestRender, minimalCache } from '../../helpers/test/helper';
import SidebarItem from './SidebarItem';

jest.mock('proton-mail/hooks/mailbox/useElements', () => ({
    useGetElementsFromIDs: jest.fn(() => jest.fn()),
}));

jest.mock('proton-mail/hooks/useSelectAll', () => ({
    useSelectAll: jest.fn(() => ({ selectAll: false })),
}));

jest.mock('proton-mail/containers/CheckAllRefProvider', () => ({
    ...jest.requireActual('proton-mail/containers/CheckAllRefProvider'),
    useCheckAllRef: jest.fn(() => ({ checkAllRef: { current: null } })),
}));

jest.mock('proton-mail/store/hooks', () => ({
    useMailSelector: jest.fn(() => ({ labelID: '0', sort: {}, filter: {}, search: {}, page: 0 })),
}));

jest.mock('@proton/components/containers/items/useItemsDroppable', () => ({
    __esModule: true,
    default: jest.fn(() => ({ dragOver: false, dragProps: {}, handleDrop: jest.fn() })),
}));

const defaultProps = {
    labelID: MAILBOX_LABEL_IDS.INBOX,
    isFolder: true,
    text: 'Inbox',
    moveToFolder: jest.fn(),
    applyLabels: jest.fn(),
};

describe('SidebarItem', () => {
    beforeEach(() => {
        minimalCache();
        mockUseMailSettings();
        mockUseCategoriesData({ categoryViewAccess: false });
    });

    afterEach(() => {
        clearAll();
    });

    it('should trigger refresh when on inbox with category hash', async () => {
        mockUseCategoriesData({ categoryViewAccess: true });

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
        mockUseCategoriesData({ categoryViewAccess: true });

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
        mockUseCategoriesData({ categoryViewAccess: true });

        await mailTestRender(<SidebarItem {...defaultProps} />, {
            initialEntries: ['/inbox/messageID#category=primary'],
        });

        fireEvent.click(screen.getByTestId('navigation-link:inbox'));

        expect(useEventManager.call).not.toHaveBeenCalled();
    });
});
