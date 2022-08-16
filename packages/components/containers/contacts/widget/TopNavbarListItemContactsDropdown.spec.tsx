import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import createCache from '@proton/shared/lib/helpers/cache';

import ApiContext from '../../api/apiContext';
import { CacheProvider } from '../../cache';
import ModalsProvider from '../../modals/Provider';
import NotificationsProvider from '../../notifications/Provider';
import TopNavbarListItemContactsDropdown from './TopNavbarListItemContactsDropdown';
import { CONTACT_WIDGET_TABS, CustomAction } from './types';

jest.mock('../../../hooks/useUser', () => ({
    __esModule: true,
    default: jest.fn(() => [{}, false]),
    useGetUser: jest.fn(() => [{ hasPaidMail: true, hasNonDelinquentScope: true }, false]),
}));
jest.mock('../../../hooks/useUserKeys', () => ({
    useUserKeys: () => [{}, false],
}));
jest.mock('../../../hooks/useContactEmails', () => () => []);
jest.mock('../../../hooks/useCategories', () => ({ useContactGroups: () => [] }));
jest.mock('../../../hooks/useContacts', () => () => []);
jest.mock('../../../hooks/useUserSettings', () => () => [{}, jest.fn()]);
jest.mock('../../../hooks/useCachedModelResult', () => jest.fn());
jest.mock('../../../hooks/useEventManager', () => () => ({}));
jest.mock('../../../hooks/useDrawer', () => () => ({}));

function renderComponent({ customActions }: { customActions: CustomAction[] }) {
    return (
        <NotificationsProvider>
            <ApiContext.Provider value={jest.fn().mockRejectedValue(Promise.resolve({}))}>
                <ModalsProvider>
                    <CacheProvider cache={createCache()}>
                        <TopNavbarListItemContactsDropdown customActions={customActions} />
                    </CacheProvider>
                </ModalsProvider>
            </ApiContext.Provider>
        </NotificationsProvider>
    );
}

// TODO: Fix this test later
describe('TopNavbarListItemContactsDropdown', () => {
    it.skip('should display custom actions', async () => {
        const customAction1 = {
            render: jest.fn(() => <p>custom action 1</p>),
            tabs: [CONTACT_WIDGET_TABS.CONTACTS],
        };
        const customAction2 = {
            render: jest.fn(() => <p>custom action 2</p>),
            tabs: [CONTACT_WIDGET_TABS.GROUPS],
        };
        const customActions = [customAction1];

        const { rerender } = render(renderComponent({ customActions }));

        expect(screen.queryByText('custom action 1')).toBeFalsy();

        fireEvent.click(screen.getByTitle('View contacts'));

        expect(screen.getByText('custom action 1')).toBeInTheDocument();
        expect(customAction1.render).toHaveBeenCalledWith({
            contactList: expect.any(Object),
            noSelection: true,
            onClose: expect.any(Function),
            selected: [],
        });
        expect(customAction2.render).not.toHaveBeenCalled();

        customActions.push(customAction2);

        rerender(renderComponent({ customActions }));

        expect(screen.getByText('custom action 1')).toBeInTheDocument();
        expect(screen.queryByText('custom action 2')).toBeFalsy();

        fireEvent.click(screen.getByText('Groups'));

        expect(customAction2.render).toHaveBeenCalledWith({
            groupsEmailsMap: {},
            noSelection: true,
            onClose: expect.any(Function),
            recipients: [],
            selected: [],
        });
        expect(screen.queryByText('custom action 1')).toBeFalsy();
        expect(screen.getByText('custom action 2')).toBeInTheDocument();
    });
});
