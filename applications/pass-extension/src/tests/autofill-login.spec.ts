import { FieldType } from '@protontech/autofill/types';
import { waitFor } from '@testing-library/react';

import { createTestLogin } from '@proton/pass/utils/tests/fixtures/items';
import type { RecordedPage } from '@proton/pass/utils/tests/fixtures/pages';
import { readRecordedPage } from '@proton/pass/utils/tests/fixtures/pages';
import { createTestVault } from '@proton/pass/utils/tests/fixtures/shares';

import {
    getField,
    inputEventsOf,
    loadPage,
    recordInputEvents,
    startContentScript,
    waitForLoginForm,
} from './content-script';
import { openLoginDropdown } from './dropdown';
import { setupWorker } from './worker';

jest.mock('../app/worker/channel');

const EMAIL = 'user@example.com';
const PASSWORD = 'correct-horse-battery';

type LoginPage = { page: RecordedPage; url: string };

/** Opens the recorded `page` at `url` with a single login saved for `loginUrl` */
const openLoginPage = async ({ page, url, loginUrl = url }: LoginPage & { loginUrl?: string }) => {
    const vault = createTestVault({ name: 'Personal' });
    const login = createTestLogin({
        shareId: vault.shareId,
        name: page,
        email: EMAIL,
        password: PASSWORD,
        urls: [new URL(loginUrl).origin],
    });

    setupWorker({ url, state: { shares: [vault], items: [login] } });
    loadPage(await readRecordedPage(page));
    await startContentScript();

    return waitForLoginForm();
};

describe('Autofill a login', () => {
    test.each<LoginPage>([
        { page: 'facebook', url: 'https://www.facebook.com/login' },
        { page: 'bitwarden', url: 'https://vault.bitwarden.com/#/login' },
        { page: 'proton', url: 'https://account.proton.me/login' },
    ])('from the dropdown on the recorded $page login page', async (page) => {
        const form = await openLoginPage(page);
        const user = getField(form, FieldType.EMAIL);
        const password = getField(form, FieldType.PASSWORD_CURRENT);
        const events = recordInputEvents(user.element, password.element);

        const dropdown = await openLoginDropdown(user);
        expect(dropdown.candidates).toEqual([expect.objectContaining({ name: page.page, userIdentifier: EMAIL })]);

        await dropdown.select(dropdown.candidates[0]);

        await waitFor(() => expect(password.element.value).toBe(PASSWORD));
        expect(user.element.value).toBe(EMAIL);
        expect(events).toEqual(expect.arrayContaining(inputEventsOf(user.element, password.element)));
    });

    test.each<LoginPage>([
        { page: 'microsoft', url: 'https://login.live.com/' },
        { page: 'amazon', url: 'https://www.amazon.es/' },
    ])('fills the email step on the recorded $page username-first page', async (page) => {
        const form = await openLoginPage(page);
        const email = getField(form, FieldType.EMAIL);
        const events = recordInputEvents(email.element);

        expect(form.getFieldsFor(FieldType.PASSWORD_CURRENT)).toHaveLength(0);

        const dropdown = await openLoginDropdown(email);
        await dropdown.select(dropdown.candidates[0]);

        await waitFor(() => expect(email.element.value).toBe(EMAIL));
        expect(events).toEqual(expect.arrayContaining(inputEventsOf(email.element)));
    });

    test('offers no candidate when no login matches the page', async () => {
        const form = await openLoginPage({
            page: 'facebook',
            url: 'https://www.facebook.com/login',
            loginUrl: 'https://www.example.com',
        });

        const dropdown = await openLoginDropdown(getField(form, FieldType.EMAIL));
        expect(dropdown.candidates).toEqual([]);
    });
});
