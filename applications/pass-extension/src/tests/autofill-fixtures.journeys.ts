import { FieldType, FormType } from '@protontech/autofill/types';
import { waitFor } from '@testing-library/react';

import { createTestCreditCard, createTestIdentity, createTestLogin } from '@proton/pass/utils/tests/fixtures/items';
import type { AutofillFixture } from '@proton/pass/utils/tests/fixtures/pages';
import { readAutofillFixture } from '@proton/pass/utils/tests/fixtures/pages';
import { createTestVault } from '@proton/pass/utils/tests/fixtures/shares';

import { DropdownAction } from '../app/content/constants.runtime';
import { CSContext } from '../app/content/context/context';
import {
    getDetectedForms,
    getField,
    inputEventsOf,
    loadPage,
    recordInputEvents,
    startContentScript,
    waitForLoginForm,
} from './content-script';
import { openCreditCardDropdown, openIdentityDropdown, openLoginDropdown } from './dropdown';
import type { ModelWorker } from './model';

/** Same origin as the Playwright suite serves the fixtures on */
const ORIGIN = 'https://autofill.pass.test';
const EMAIL = 'user@example.com';
const PASSWORD = 'correct-horse-battery';

const IDENTITY = {
    firstName: 'Ada',
    middleName: 'Augusta',
    lastName: 'Lovelace',
    fullName: 'Ada Augusta Lovelace',
    email: 'ada@example.com',
    phoneNumber: '+44 20 7946 0000',
    streetAddress: '12 St James Square',
    city: 'London',
    stateOrProvince: 'Greater London',
    zipOrPostalCode: 'SW1Y 4JH',
    countryOrRegion: 'United Kingdom',
};

const CARD = {
    cardholderName: 'Ada Lovelace',
    number: '4242424242424242',
    expirationDate: '2030-07',
    verificationNumber: '123',
};

type SavedLogin = { name: string; email?: string; url?: string };
type FixtureVault = { url?: string; logins?: SavedLogin[]; withIdentity?: boolean; withCard?: boolean };

export const defineFixtureJourneys = ({ model, getModelId, startWorker }: ModelWorker) => {
    /** Opens the `page` fixture at `url`, with the `logins`, and the identity and card if asked, saved in a single vault */
    const openFixture = async (
        page: AutofillFixture,
        { url = `${ORIGIN}/${page}.html`, logins = [{ name: 'Fixtures' }], withIdentity, withCard }: FixtureVault = {}
    ) => {
        const vault = createTestVault({ name: 'Personal' });
        const { shareId } = vault;
        const items = [
            ...logins.map(({ name, email = EMAIL, url: loginUrl = ORIGIN }) =>
                createTestLogin({ shareId, name, email, password: PASSWORD, urls: [loginUrl] })
            ),
            ...(withIdentity ? [createTestIdentity({ shareId, name: 'Ada', content: IDENTITY })] : []),
            ...(withCard ? [createTestCreditCard({ shareId, name: 'Ada card', content: CARD })] : []),
        ];

        await startWorker({ url, state: { shares: [vault], items } });
        loadPage(await readAutofillFixture(page));
        await startContentScript();
    };

    const waitForField = (fieldType: FieldType) =>
        waitFor(() => {
            const [field] = getDetectedForms().flatMap((form) => form.getFieldsFor(fieldType));
            if (!field) throw new Error(`No ${fieldType} field detected yet`);
            return field;
        });

    const waitForFieldById = (id: string) =>
        waitFor(() => {
            const field = getDetectedForms()
                .flatMap((form) => form.getFields())
                .find(({ element }) => element.id === id);
            if (!field) throw new Error(`No field #${id} detected yet`);
            return field;
        });

    const getValues = (ids: string[]) =>
        Object.fromEntries(ids.map((id) => [id, document.querySelector<HTMLInputElement>(`#${id}`)?.value]));

    describe('Detection model', () => {
        test(`runs the content script on the ${model} model`, async () => {
            await openFixture('login-email');
            await waitForLoginForm();

            expect(CSContext.read()?.service.detector.getModelId()).toBe(getModelId());
        });
    });

    describe('Autofill a login on the fixture pages', () => {
        test.each<[AutofillFixture, FieldType.USERNAME | FieldType.EMAIL]>([
            ['login-username', FieldType.USERNAME],
            ['login-email', FieldType.EMAIL],
            ['login-2-steps', FieldType.EMAIL],
        ])('fills the identifier and the password on %s', async (page, identifierType) => {
            await openFixture(page);
            const form = await waitForLoginForm();
            const identifier = getField(form, identifierType);
            const password = getField(form, FieldType.PASSWORD_CURRENT);
            const events = recordInputEvents(identifier.element, password.element);

            const dropdown = await openLoginDropdown(identifier);
            expect(dropdown.candidates).toEqual([expect.objectContaining({ name: 'Fixtures', userIdentifier: EMAIL })]);
            await dropdown.select(dropdown.candidates[0]);

            await waitFor(() => expect(password.element.value).toBe(PASSWORD));
            expect(identifier.element.value).toBe(EMAIL);
            expect(events).toEqual(expect.arrayContaining(inputEventsOf(identifier.element, password.element)));
        });

        test('fills the email step of the 3-step login', async () => {
            await openFixture('login-3-steps');
            const form = await waitForLoginForm();
            const email = getField(form, FieldType.EMAIL);

            expect(form.getFieldsFor(FieldType.PASSWORD_CURRENT)).toHaveLength(0);

            const dropdown = await openLoginDropdown(email);
            await dropdown.select(dropdown.candidates[0]);

            await waitFor(() => expect(email.element.value).toBe(EMAIL));
        });

        test('fills the password step of the 3-step login', async () => {
            await openFixture('login-3-steps-password');
            const form = await waitForLoginForm();
            const password = getField(form, FieldType.PASSWORD_CURRENT);

            const dropdown = await openLoginDropdown(password);
            await dropdown.select(dropdown.candidates[0]);

            await waitFor(() => expect(password.element.value).toBe(PASSWORD));
        });

        test.each<AutofillFixture>(['login-2-steps-otp', 'otp'])(
            'detects the one-time code field on %s',
            async (page) => {
                await openFixture(page);
                const otp = await waitForField(FieldType.OTP);

                expect(otp.element.id).toBe('totp');
            }
        );

        test('offers every login saved for the page', async () => {
            await openFixture('login-email', {
                logins: [
                    { name: 'Personal account', email: 'me@example.com' },
                    { name: 'Work account', email: 'me@work.example.com' },
                ],
            });

            const dropdown = await openLoginDropdown(getField(await waitForLoginForm(), FieldType.EMAIL));

            expect(dropdown.candidates).toHaveLength(2);
            expect(dropdown.candidates).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ name: 'Personal account', userIdentifier: 'me@example.com' }),
                    expect.objectContaining({ name: 'Work account', userIdentifier: 'me@work.example.com' }),
                ])
            );
        });

        test('offers a login saved for the parent domain on a subdomain', async () => {
            await openFixture('login-email', { url: 'https://accounts.autofill.pass.test/login-email.html' });

            const dropdown = await openLoginDropdown(getField(await waitForLoginForm(), FieldType.EMAIL));

            expect(dropdown.candidates).toEqual([expect.objectContaining({ name: 'Fixtures' })]);
        });
    });

    describe('Autofill an identity on the fixture pages', () => {
        test('fills every field of the identity form', async () => {
            await openFixture('identity', { withIdentity: true });
            const firstName = await waitForFieldById('firstname');

            const dropdown = await openIdentityDropdown(firstName);
            expect(dropdown.candidates).toEqual([expect.objectContaining({ name: 'Ada' })]);
            await dropdown.select(dropdown.candidates[0]);

            await waitFor(() => expect(firstName.element.value).toBe(IDENTITY.firstName));
            expect(
                getValues([
                    'middlename',
                    'lastname',
                    'email',
                    'phone',
                    'address',
                    'state',
                    'city',
                    'postal-code',
                    'country',
                ])
            ).toEqual({
                middlename: IDENTITY.middleName,
                lastname: IDENTITY.lastName,
                email: IDENTITY.email,
                phone: IDENTITY.phoneNumber,
                address: IDENTITY.streetAddress,
                state: IDENTITY.stateOrProvince,
                city: IDENTITY.city,
                'postal-code': IDENTITY.zipOrPostalCode,
                country: IDENTITY.countryOrRegion,
            });
        });
    });

    describe('Autofill a credit card on the fixture pages', () => {
        test('fills every card field of the checkout', async () => {
            await openFixture('checkout-inline', { withCard: true });
            const number = await waitForFieldById('cc-number');

            const dropdown = await openCreditCardDropdown(number);
            expect(dropdown.candidates).toEqual([expect.objectContaining({ name: 'Ada card' })]);
            await dropdown.select(dropdown.candidates[0]);

            await waitFor(() => expect(number.element.value).toBe(CARD.number));
            expect(getValues(['cc-name', 'cc-exp', 'cc-csc'])).toEqual({
                'cc-name': CARD.cardholderName,
                'cc-exp': '07/30',
                'cc-csc': CARD.verificationNumber,
            });
        });
    });

    describe('Autofill true negatives on the fixture pages', () => {
        test('fills only the identity section the autofill was started from', async () => {
            await openFixture('identity-sections', { withIdentity: true });
            const billingFirstName = await waitForFieldById('billing-firstname');

            const dropdown = await openIdentityDropdown(billingFirstName);
            await dropdown.select(dropdown.candidates[0]);

            await waitFor(() => expect(billingFirstName.element.value).toBe(IDENTITY.firstName));
            expect(getValues(['billing-lastname', 'billing-city'])).toEqual({
                'billing-lastname': IDENTITY.lastName,
                'billing-city': IDENTITY.city,
            });
            expect(getValues(['shipping-firstname', 'shipping-lastname', 'shipping-city'])).toEqual({
                'shipping-firstname': '',
                'shipping-lastname': '',
                'shipping-city': '',
            });
        });

        test('leaves the shipping address alone when filling a card', async () => {
            await openFixture('checkout-inline', { withCard: true, withIdentity: true });
            const number = await waitForFieldById('cc-number');

            const dropdown = await openCreditCardDropdown(number);
            await dropdown.select(dropdown.candidates[0]);

            await waitFor(() => expect(number.element.value).toBe(CARD.number));
            expect(getValues(['shipping-firstname', 'shipping-lastname', 'shipping-address'])).toEqual({
                'shipping-firstname': '',
                'shipping-lastname': '',
                'shipping-address': '',
            });
        });

        test('offers neither logins nor identities on the card fields', async () => {
            await openFixture('checkout-inline', { withCard: true, withIdentity: true });
            const number = await waitForFieldById('cc-number');

            await expect(openLoginDropdown(number)).rejects.toThrow('login dropdown cannot open on this field');
            await expect(openIdentityDropdown(number)).rejects.toThrow('identity dropdown cannot open on this field');
        });

        test('offers no login saved for a look-alike domain', async () => {
            await openFixture('login-email', { logins: [{ name: 'Look-alike', url: 'https://autofill-pass.test' }] });

            const dropdown = await openLoginDropdown(getField(await waitForLoginForm(), FieldType.EMAIL));

            expect(dropdown.candidates).toEqual([]);
        });

        test('treats neither the search nor the newsletter form next to the login form as a login', async () => {
            await openFixture('login-with-newsletter');
            const login = await waitForLoginForm();

            expect(login.element.id).toBe('login');

            const formsOfInterest = getDetectedForms().filter(({ formType }) => formType !== FormType.NOOP);
            expect(formsOfInterest.map(({ element }) => element.id)).toEqual(['login']);

            const fields = getDetectedForms().flatMap((form) => form.getFields());
            expect(fields.map(({ element }) => element.id)).not.toContain('q');

            /** The newsletter email gets alias suggestions, never logins */
            const newsletterEmail = fields.find(({ element }) => element.id === 'newsletter-email');
            expect(newsletterEmail?.getFormHandle().formType).toBe(FormType.NOOP);
            expect(newsletterEmail?.action?.type).toBe(DropdownAction.AUTOSUGGEST_ALIAS);
        });
    });
};
