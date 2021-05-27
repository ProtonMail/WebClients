import React from 'react';
import loudRejection from 'loud-rejection';
import { fireEvent, getByTestId, getByText } from '@testing-library/dom';
import { act } from '@testing-library/react';
import {
    addApiMock,
    clearAll,
    getDropdown,
    getHistory,
    render,
    minimalCache,
    addToCache,
} from '../../helpers/test/helper';
import { Breakpoints } from '../../models/utils';
import MailHeader from './MailHeader';

loudRejection();

const getProps = () => ({
    labelID: 'labelID',
    elementID: undefined,
    location: getHistory().location,
    history: getHistory(),
    breakpoints: {} as Breakpoints,
    onSearch: jest.fn(),
    onCompose: jest.fn(),
    expanded: true,
    onToggleExpand: jest.fn(),
    onOpenShortcutsModal: jest.fn(),
});

const user = { Email: 'Email', DisplayName: 'DisplayName', Name: 'Name', hasPaidMail: false };

describe('MailHeader', () => {
    let props: ReturnType<typeof getProps>;

    const setup = async () => {
        minimalCache();
        addToCache('User', user);
        addApiMock('payments/plans', () => ({}));
        addApiMock('contacts', () => ({ Contacts: [] }));

        props = getProps();

        const result = await render(<MailHeader {...props} />, false);
        const searchForm = result.getByRole('search');

        const openAdvanced = async () => {
            const advancedDropdownButton = getByTestId(searchForm, 'dropdown-button');
            fireEvent.click(advancedDropdownButton);
            const dropdown = await getDropdown();
            const submitButton = dropdown.querySelector('button[type="submit"]') as HTMLButtonElement;
            const submit = () => fireEvent.click(submitButton);
            return { dropdown, submitButton, submit };
        };

        return { ...result, searchForm, openAdvanced };
    };

    // Not found better to test
    // It's hard to override sso mode constant
    const assertAppLink = (element: HTMLElement, href: string) => {
        const link = element.closest('a');
        expect(link?.getAttribute('href')).toBe(href);
    };

    afterEach(clearAll);

    describe('Core features', () => {
        it('should redirect on inbox when click on logo', async () => {
            const { getByText } = await setup();
            const logo = getByText('ProtonMail');
            fireEvent.click(logo);

            const history = getHistory();
            expect(history.length).toBe(2);
            expect(history.location.pathname).toBe('/inbox');
        });

        it('should open app dropdown', async () => {
            const { getByTitle } = await setup();

            const appsButton = getByTitle('Proton applications');
            fireEvent.click(appsButton);

            const dropdown = await getDropdown();

            getByText(dropdown, 'Mail');
            getByText(dropdown, 'Calendar');
            getByText(dropdown, 'VPN');
        });

        it('should open contacts widget', async () => {
            const { getByText: getByTextHeader } = await setup();

            const contactsButton = getByTextHeader('Contacts');
            fireEvent.click(contactsButton);

            const dropdown = await getDropdown();
            getByText(dropdown, 'Contacts');
            getByText(dropdown, 'Groups');
            getByText(dropdown, 'Settings');
        });

        it('should open settings', async () => {
            const { getByText: getByTextHeader } = await setup();

            const settingsButton = getByTextHeader('Settings');
            fireEvent.click(settingsButton);

            const dropdown = await getDropdown();
            const settingsLink = getByText(dropdown, 'settings', { exact: false });

            assertAppLink(settingsLink, '/mail/general');
        });

        it('should open help dropdown', async () => {
            const { getByText } = await setup();

            const help = getByText('Help');
            fireEvent.click(help);

            const dropdown = await getDropdown();
            const { textContent } = dropdown;

            expect(textContent).toContain('question');
            expect(textContent).toContain('feature');
            expect(textContent).toContain('problem');
        });

        it('should open user dropdown', async () => {
            const { getByText: getByTextHeader } = await setup();

            const userButton = getByTextHeader(user.DisplayName);
            fireEvent.click(userButton);

            const dropdown = await getDropdown();
            getByText(dropdown, 'Sign out');
        });

        it('should show upgrade button', async () => {
            const { getByText } = await setup();

            const upgradeLabel = getByText('Upgrade');

            assertAppLink(upgradeLabel, '/mail/dashboard');
        });

        it('should show upgrade button', async () => {
            const { getByText } = await setup();

            const upgradeLabel = getByText('Upgrade');

            assertAppLink(upgradeLabel, '/mail/dashboard');
        });
    });

    describe('Search features', () => {
        it('should search with search bar', async () => {
            const searchTerm = 'test';

            const { searchForm } = await setup();
            const searchInput = searchForm.querySelector('input') as HTMLInputElement;

            // Faking timers because there is a debounce in the search input component
            jest.useFakeTimers();

            act(() => {
                fireEvent.change(searchInput, { target: { value: searchTerm } });
                jest.runAllTimers();
                fireEvent.submit(searchForm);
            });

            expect(props.onSearch).toHaveBeenCalledWith(searchTerm, undefined);

            jest.useRealTimers();
        });

        it('should search with keyword in advanced search', async () => {
            const searchTerm = 'test';

            const { searchForm, openAdvanced, rerender } = await setup();
            const { submit } = await openAdvanced();

            const keywordInput = document.getElementById('search-keyword') as HTMLInputElement;
            fireEvent.change(keywordInput, { target: { value: searchTerm } });
            submit();

            const history = getHistory();
            expect(history.length).toBe(2);
            expect(history.location.pathname).toBe('/all-mail');
            expect(history.location.hash).toBe(`#keyword=${searchTerm}`);

            await rerender(<MailHeader {...props} location={history.location} />);

            const searchInput = searchForm.querySelector('input') as HTMLInputElement;
            expect(searchInput.value).toBe(searchTerm);
        });

        it('should search with keyword and location', async () => {
            const searchTerm = 'test';

            const { openAdvanced } = await setup();
            const { submit } = await openAdvanced();

            const keywordInput = document.getElementById('search-keyword') as HTMLInputElement;
            fireEvent.change(keywordInput, { target: { value: searchTerm } });
            const labelSelect = document.getElementById('labelID') as HTMLSelectElement;
            fireEvent.change(labelSelect, { target: { value: '10' } });
            submit();

            const history = getHistory();
            expect(history.length).toBe(2);
            expect(history.location.pathname).toBe('/starred');
            expect(history.location.hash).toBe(`#keyword=${searchTerm}`);
        });
    });
});
