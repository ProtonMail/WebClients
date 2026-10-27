import { FieldType, FormType } from '@protontech/autofill/types';
import { waitFor } from '@testing-library/react';

import { createTestLogin } from '@proton/pass/utils/tests/fixtures/items';
import type { RecordedPage } from '@proton/pass/utils/tests/fixtures/pages';
import { readRecordedPage } from '@proton/pass/utils/tests/fixtures/pages';
import { createTestVault } from '@proton/pass/utils/tests/fixtures/shares';

import {
    getDetectedForms,
    getField,
    inputEventsOf,
    loadPage,
    recordInputEvents,
    startContentScript,
} from './content-script';
import { openLoginDropdown } from './dropdown';
import type { ModelWorker, TestModel } from './model';

const EMAIL = 'user@example.com';
const PASSWORD = 'correct-horse-battery';

/** `password: false` for username-first pages, whose first step only asks for the email */
type LoginPage = { page: RecordedPage; url: string; password: boolean };

/** Recorded pages of the Playwright logins spec, but `google`: jsdom's uniform fake
 * geometry gets its form detected as `noop` where a real browser sees a login */
const RECORDED_LOGIN_PAGES: LoginPage[] = [
    { page: 'amazon', url: 'https://www.amazon.es/', password: false },
    { page: 'bitwarden', url: 'https://vault.bitwarden.com/', password: true },
    { page: 'booking', url: 'https://account.booking.com/', password: false },
    { page: 'coursera', url: 'https://www.coursera.org/login', password: true },
    { page: 'discord', url: 'https://discord.com/login', password: true },
    { page: 'dovetail', url: 'https://dovetail.com/auth/login/', password: false },
    { page: 'facebook', url: 'https://www.facebook.com/login/', password: true },
    { page: 'healthchecksEmail', url: 'https://healthchecks-email.io/accounts/login/', password: true },
    { page: 'healthchecksIdentity', url: 'https://healthchecks-identity.io/accounts/login/', password: true },
    { page: 'ledgy', url: 'https://app.ledgy.com/', password: false },
    { page: 'linkedin', url: 'https://www.linkedin.com/login', password: true },
    { page: 'mastodon', url: 'https://mastodon.social/auth/sign_in', password: true },
    { page: 'microsoft', url: 'https://login.live.com/', password: false },
    { page: 'netflix', url: 'https://www.netflix.com/login', password: true },
    { page: 'notion', url: 'https://www.notion.so/login', password: false },
    { page: 'paddle', url: 'https://login.paddle.com/login', password: true },
    { page: 'paypal', url: 'https://www.paypal.com/signin', password: false },
    { page: 'proton', url: 'https://account.proton.me/login', password: true },
];

/** Recorded pages are heavy: detection can exceed `waitFor`'s 1s default while spec files run in parallel */
const DETECTION_TIMEOUT = { timeout: 5_000 };

/** Pages a model misses, failing on purpose until the model catches up */
const KNOWN_MODEL_GAPS: Partial<Record<RecordedPage, TestModel[]>> = { netflix: ['challenger'] };

export const defineRecordedPageJourneys = ({ model, startWorker }: ModelWorker) => {
    const isKnownGap = ({ page }: LoginPage) => KNOWN_MODEL_GAPS[page]?.includes(model) ?? false;

    /** Opens the recorded `page` at `url` with a single login saved for its origin */
    const openLoginPage = async ({ page, url, password }: LoginPage) => {
        const vault = createTestVault({ name: 'Personal' });
        const login = createTestLogin({
            shareId: vault.shareId,
            name: page,
            email: EMAIL,
            password: PASSWORD,
            urls: [new URL(url).origin],
        });

        await startWorker({ url, state: { shares: [vault], items: [login] } });
        loadPage(await readRecordedPage(page));
        await startContentScript();

        /** Some pages have a second login form, eg: an email-only magic link one */
        return waitFor(() => {
            const form = getDetectedForms().find(
                (handle) =>
                    handle.formType === FormType.LOGIN &&
                    handle.getFieldsFor(FieldType.PASSWORD_CURRENT).length === (password ? 1 : 0)
            );
            if (!form) throw new Error(`No login form ${password ? 'with' : 'without'} password detected yet`);
            return form;
        }, DETECTION_TIMEOUT);
    };

    const fillLogin = async (page: LoginPage) => {
        const form = await openLoginPage(page);
        const email = getField(form, FieldType.EMAIL);
        const password = page.password ? getField(form, FieldType.PASSWORD_CURRENT) : null;
        const elements = password ? [email.element, password.element] : [email.element];
        const events = recordInputEvents(...elements);

        const dropdown = await openLoginDropdown(email);
        expect(dropdown.candidates).toEqual([expect.objectContaining({ name: page.page, userIdentifier: EMAIL })]);

        await dropdown.select(dropdown.candidates[0]);

        await waitFor(() => expect(email.element.value).toBe(EMAIL));
        if (password) expect(password.element.value).toBe(PASSWORD);
        expect(events).toEqual(expect.arrayContaining(inputEventsOf(...elements)));
    };

    describe('Autofill a login on the recorded pages', () => {
        const gaps = RECORDED_LOGIN_PAGES.filter(isKnownGap);

        test.each(RECORDED_LOGIN_PAGES.filter((page) => !isKnownGap(page)))(
            'fills the login from the dropdown on $page',
            fillLogin
        );

        if (gaps.length) {
            test.failing.each(gaps)(`misses the login form on $page (known ${model} model gap)`, fillLogin);
        }
    });
};
