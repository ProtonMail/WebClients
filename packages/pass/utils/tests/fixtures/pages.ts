import { readFile } from 'fs/promises';
import JSZip from 'jszip';
import { join } from 'path';

/** Recorded third-party pages shared with the Playwright suite */
const RECORDED_PAGES_DIR = join(__dirname, '../../../../../tests/pass/html');

/** Our own form pages, shared with the Playwright suite */
const AUTOFILL_FIXTURES_DIR = join(__dirname, '../../../../../tests/pass/fixtures/autofill');

export type RecordedPage =
    | 'amazon'
    | 'bitwarden'
    | 'booking'
    | 'coursera'
    | 'discord'
    | 'dovetail'
    | 'facebook'
    | 'google'
    | 'healthchecksEmail'
    | 'healthchecksIdentity'
    | 'ledgy'
    | 'linkedin'
    | 'mastodon'
    | 'microsoft'
    | 'netflix'
    | 'notion'
    | 'paddle'
    | 'paypal'
    | 'proton';

const stripScripts = (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, '');

export const readRecordedPage = async (name: RecordedPage): Promise<string> => {
    // nosemgrep: path-join-resolve-traversal -- `name` is constrained to the `RecordedPage` literal union
    const zip = await JSZip.loadAsync(await readFile(join(RECORDED_PAGES_DIR, `${name}.zip`)));
    const html = await zip.file(`${name}.html`)?.async('string');
    if (html === undefined) throw new Error(`Recorded page "${name}" has no ${name}.html`);
    return stripScripts(html);
};

export type AutofillFixture =
    | 'login-username'
    | 'login-email'
    | 'login-2-steps'
    | 'login-2-steps-otp'
    | 'login-3-steps'
    | 'login-3-steps-password'
    | 'login-with-newsletter'
    | 'logged-in'
    | 'register-email'
    | 'account-created'
    | 'otp'
    | 'identity'
    | 'identity-sections'
    | 'checkout-inline';

export const readAutofillFixture = (name: AutofillFixture): Promise<string> =>
    // nosemgrep: path-join-resolve-traversal -- `name` is constrained to the `AutofillFixture` literal union
    readFile(join(AUTOFILL_FIXTURES_DIR, `${name}.html`), 'utf8');
