import { waitFor } from '@testing-library/react';

import { AutosaveMode } from '@proton/pass/types/worker/autosave';
import { FormEntryStatus } from '@proton/pass/types/worker/form';
import { createTestLogin } from '@proton/pass/utils/tests/fixtures/items';
import type { AutofillFixture } from '@proton/pass/utils/tests/fixtures/pages';
import { readAutofillFixture } from '@proton/pass/utils/tests/fixtures/pages';
import { createTestVault } from '@proton/pass/utils/tests/fixtures/shares';

import type { FormHandle } from '../app/content/services/form/form';
import { loadPage, navigatePage, startContentScript, waitForLoginForm, waitForRegisterForm } from './content-script';
import { getTabSubmission, navigateTab, setupWorker } from './worker';

jest.mock('../app/worker/channel');

/** Same origin as the Playwright suite serves the fixtures on */
const ORIGIN = 'https://autofill.pass.test';
const SAVED_EMAIL = 'saved@example.com';
const SAVED_PASSWORD = 'saved-horse-battery';
const NEW_EMAIL = 'new@example.com';
const NEW_PASSWORD = 'new-horse-battery';

const urlOf = (page: AutofillFixture) => `${ORIGIN}/${page}.html`;

/** Opens the `page` fixture with a single login saved for the origin, unless `withSavedLogin` is false */
const openFixture = async (page: AutofillFixture, { withSavedLogin = true } = {}) => {
    const vault = createTestVault({ name: 'Personal' });
    const saved = createTestLogin({
        shareId: vault.shareId,
        name: 'Saved login',
        email: SAVED_EMAIL,
        password: SAVED_PASSWORD,
        urls: [ORIGIN],
    });

    const worker = setupWorker({ url: urlOf(page), state: { shares: [vault], items: withSavedLogin ? [saved] : [] } });
    loadPage(await readAutofillFixture(page));
    await startContentScript();

    return { ...worker, saved };
};

/** Types `value` the way a page sees a user typing it */
const type = (id: string, value: string) => {
    const input = document.getElementById(id) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
};

const submit = ({ element }: FormHandle) =>
    element.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

type Worker = Awaited<ReturnType<typeof openFixture>>;

/** Waits for the worker to track the submitted form, then returns its autosave decision */
const resolveSubmission = async ({ formTracker, autosave }: Worker, page: AutofillFixture) => {
    const submission = await waitFor(async () => {
        const entry = await getTabSubmission(formTracker, urlOf(page));
        if (!entry?.submit) throw new Error('No form submission tracked yet');
        return entry;
    });

    return { submission, decision: autosave.resolve(submission) };
};

const signUp = async (email: string, password: string) => {
    const form = await waitForRegisterForm();
    type('name', 'Ada Lovelace');
    type('email', email);
    type('password', password);
    type('password-confirm', password);
    submit(form);
};

const signIn = async (email: string, password: string) => {
    const form = await waitForLoginForm();
    type('email', email);
    type('password', password);
    submit(form);
};

describe('Autosave on the fixture pages', () => {
    test('offers to save a new login on sign-up', async () => {
        const worker = await openFixture('register-email', { withSavedLogin: false });
        await signUp(NEW_EMAIL, NEW_PASSWORD);

        const { submission, decision } = await resolveSubmission(worker, 'register-email');

        expect(submission).toMatchObject({
            type: 'register',
            data: { userIdentifier: NEW_EMAIL, password: NEW_PASSWORD },
        });
        expect(decision).toEqual({ shouldPrompt: true, data: { type: AutosaveMode.NEW } });
    });

    test('offers to update the saved login when signing up again with its password', async () => {
        const worker = await openFixture('register-email');
        await signUp(NEW_EMAIL, SAVED_PASSWORD);

        const { decision } = await resolveSubmission(worker, 'register-email');

        expect(decision).toEqual({
            shouldPrompt: true,
            data: {
                type: AutosaveMode.UPDATE,
                candidates: [expect.objectContaining({ itemId: worker.saved.itemId, userIdentifier: SAVED_EMAIL })],
            },
        });
    });

    test('offers to save a new login on sign-in with unknown credentials', async () => {
        const worker = await openFixture('login-email', { withSavedLogin: false });
        await signIn(NEW_EMAIL, NEW_PASSWORD);

        const { decision } = await resolveSubmission(worker, 'login-email');

        expect(decision).toEqual({ shouldPrompt: true, data: { type: AutosaveMode.NEW } });
    });

    test('offers to update the saved login on sign-in with a new password', async () => {
        const worker = await openFixture('login-email');
        await signIn(SAVED_EMAIL, NEW_PASSWORD);

        const { decision } = await resolveSubmission(worker, 'login-email');

        expect(decision).toEqual({
            shouldPrompt: true,
            data: {
                type: AutosaveMode.UPDATE,
                candidates: [expect.objectContaining({ itemId: worker.saved.itemId, userIdentifier: SAVED_EMAIL })],
            },
        });
    });

    test('commits the sign-up once the next page has no sign-up form', async () => {
        const worker = await openFixture('register-email', { withSavedLogin: false });
        await signUp(NEW_EMAIL, NEW_PASSWORD);
        await resolveSubmission(worker, 'register-email');

        navigateTab(urlOf('account-created'));
        await navigatePage(await readAutofillFixture('account-created'));

        await waitFor(async () => {
            const submission = await getTabSubmission(worker.formTracker, urlOf('account-created'));
            expect(submission?.status).toBe(FormEntryStatus.COMMITTED);
        });
    });
});

describe('Autosave true negatives on the fixture pages', () => {
    test('offers nothing on sign-in with the saved credentials', async () => {
        const worker = await openFixture('login-email');
        await signIn(SAVED_EMAIL, SAVED_PASSWORD);

        const { decision } = await resolveSubmission(worker, 'login-email');

        expect(decision).toEqual({ shouldPrompt: false });
    });

    test('drops a sign-in when the sign-in form comes back, as after wrong credentials', async () => {
        const worker = await openFixture('login-email', { withSavedLogin: false });
        await signIn(NEW_EMAIL, NEW_PASSWORD);
        await resolveSubmission(worker, 'login-email');

        await navigatePage(await readAutofillFixture('login-email'));
        await waitForLoginForm();

        await waitFor(async () =>
            expect(await getTabSubmission(worker.formTracker, urlOf('login-email'))).toBeUndefined()
        );
    });
});
