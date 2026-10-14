import { readFile } from 'fs/promises';
import JSZip from 'jszip';
import { join } from 'path';

/** Recorded third-party pages shared with the Playwright suite */
const RECORDED_PAGES_DIR = join(__dirname, '../../../../../tests/pass/html');

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
