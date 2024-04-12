import { fireEvent, screen } from '@testing-library/react';
import loudRejection from 'loud-rejection';

import { getModelState } from '@proton/account/test';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { UserModel } from '@proton/shared/lib/interfaces';
import { mockDefaultBreakpoints } from '@proton/testing/lib/mockUseActiveBreakpoint';

import { addApiMock, clearAll, getDropdown, minimalCache, render, tick } from '../../helpers/test/helper';
import MailHeader from './MailHeader';

loudRejection();

const getProps = () => ({
    labelID: 'labelID',
    elementID: undefined,
    selectedIDs: [],
    breakpoints: mockDefaultBreakpoints,
    onSearch: jest.fn(),
    expanded: true,
    onToggleExpand: jest.fn(),
    onOpenShortcutsModal: jest.fn(),
});

const user = {
    Email: 'Email',
    DisplayName: 'DisplayName',
    Name: 'Name',
    isFree: true,
    UsedSpace: 10,
    MaxSpace: 100,
} as UserModel;

describe('MailHeader', () => {
    let props: ReturnType<typeof getProps>;

    const setup = async () => {
        minimalCache();
        addApiMock('payments/v4/plans', () => ({}));
        addApiMock('contacts/v4/contacts', () => ({ Contacts: [] }));
        addApiMock('payments/v4/subscription/latest', () => ({}));

        props = getProps();

        const result = await render(<MailHeader {...props} />, {
            preloadedState: {
                user: getModelState(user),
            },
        });
        const search = result.getByTitle('Search');

        const openSearch = async () => {
            fireEvent.click(search);
            await tick();
            const overlay = document.querySelector('div[role="dialog"].overlay') as HTMLDivElement;
            const submitButton = overlay.querySelector('button[type="submit"]') as HTMLButtonElement;
            const submit = () => fireEvent.click(submitButton);
            return { overlay, submitButton, submit };
        };

        return { ...result, openSearch };
    };

    afterEach(clearAll);

    describe('Core features', () => {
        it('should open user dropdown', async () => {
            const { getByText: getByTextHeader } = await setup();

            const userButton = getByTextHeader(user.DisplayName);
            fireEvent.click(userButton);

            const dropdown = await getDropdown();
            const { textContent } = dropdown;

            expect(textContent).toContain('Proton shop');
            expect(textContent).toContain('Sign out');
        });

        it('should show upgrade button', async () => {
            const { getByTestId } = await setup();

            const upgradeLabel = getByTestId('cta:upgrade-plan');
            expect(upgradeLabel).toBeInTheDocument();
        });
    });

    describe('Search features', () => {
        it('should search with keyword', async () => {
            const searchTerm = 'test';

            const { getByTestId, openSearch, rerender, history } = await setup();
            const { submit } = await openSearch();

            const keywordInput = document.getElementById('search-keyword') as HTMLInputElement;
            fireEvent.change(keywordInput, { target: { value: searchTerm } });

            submit();

            expect(history.length).toBe(2);
            expect(history.location.pathname).toBe('/all-mail');
            expect(history.location.hash).toBe(`#keyword=${searchTerm}`);

            await rerender(<MailHeader {...props} />);

            const searchKeyword = getByTestId('search-keyword') as HTMLInputElement;
            expect(searchKeyword.value).toBe(searchTerm);
        });

        it('should search with keyword and location', async () => {
            const searchTerm = 'test';

            const { openSearch, history } = await setup();
            const { submit } = await openSearch();

            const keywordInput = document.getElementById('search-keyword') as HTMLInputElement;
            fireEvent.change(keywordInput, { target: { value: searchTerm } });

            const draftButton = screen.getByTestId(`location-${MAILBOX_LABEL_IDS.DRAFTS}`);
            fireEvent.click(draftButton);

            submit();

            expect(history.length).toBe(2);
            expect(history.location.pathname).toBe('/drafts');
            expect(history.location.hash).toBe(`#keyword=${searchTerm}`);
        });
    });
});
