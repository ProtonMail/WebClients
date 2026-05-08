import { transformRawLinks } from './transformRawLinks';

const setup = (html: string) => {
    const root = document.createElement('div');
    root.innerHTML = html;
    transformRawLinks(root);
    return root;
};

describe('transformRawLinks', () => {
    it('wraps a raw URL in an anchor carrying only the href', () => {
        // target and rel are intentionally left to transformLinks, which runs
        // immediately after and treats every anchor uniformly.
        const root = setup('<p>visit https://proton.me today</p>');

        const anchor = root.querySelector('a');
        expect(anchor).not.toBeNull();
        expect(anchor?.getAttribute('href')).toBe('https://proton.me');
        expect(anchor?.hasAttribute('target')).toBe(false);
        expect(anchor?.hasAttribute('rel')).toBe(false);
        expect(anchor?.textContent).toBe('https://proton.me');
        // Surrounding text must be preserved.
        expect(root.querySelector('p')?.textContent).toBe('visit https://proton.me today');
    });

    it('wraps every URL in a text node and keeps the interleaving text', () => {
        const root = setup('<p>see https://a.test and https://b.test for details</p>');

        const anchors = root.querySelectorAll('a');
        expect(anchors).toHaveLength(2);
        expect(anchors[0].getAttribute('href')).toBe('https://a.test');
        expect(anchors[1].getAttribute('href')).toBe('https://b.test');
        expect(root.querySelector('p')?.textContent).toBe('see https://a.test and https://b.test for details');
    });

    it('does not nest anchors when the URL is already inside an <a>', () => {
        const root = setup('<a href="https://existing.test">https://existing.test</a>');

        // Still exactly one anchor — the inner text was not re-linkified.
        expect(root.querySelectorAll('a')).toHaveLength(1);
        expect(root.querySelector('a a')).toBeNull();
    });

    it('skips text inside <code> and <pre> blocks', () => {
        const root = setup('<code>https://code.test</code><pre>https://pre.test</pre><p>https://body.test</p>');

        const anchors = root.querySelectorAll('a');
        expect(anchors).toHaveLength(1);
        expect(anchors[0].getAttribute('href')).toBe('https://body.test');
        expect(root.querySelector('code')?.innerHTML).toBe('https://code.test');
        expect(root.querySelector('pre')?.innerHTML).toBe('https://pre.test');
    });

    it('linkifies https URLs using custom TLDs registered on the shared instance', () => {
        // linkify-it consults the TLD list when validating the host portion of
        // a URL — even with the explicit https: scheme, an unknown TLD would be
        // rejected. CUSTOM_TLDS adds 'cloud' and 'team' to that list; if it
        // ever regresses, this test fails.
        const root = setup('<p>visit https://proton.cloud or https://proton.team</p>');

        const hrefs = [...root.querySelectorAll('a')].map((a) => a.getAttribute('href'));
        expect(hrefs).toEqual(['https://proton.cloud', 'https://proton.team']);
    });

    it('does not linkify text that lacks a URL protocol', () => {
        // Bare hostnames and path-shaped tokens must render as plain text. Too
        // much innocent prose contains domain-shaped substrings (file names,
        // version numbers, abbreviations) for fuzzy matching to be safe.
        const root = setup('<p>visit proton.cloud, see example.com or path/to/file</p>');

        expect(root.querySelectorAll('a')).toHaveLength(0);
        expect(root.querySelector('p')?.textContent).toBe('visit proton.cloud, see example.com or path/to/file');
    });

    it('does not linkify URLs starting with http://', () => {
        // http: is disabled on the shared LinkifyIt instance — cleartext URLs
        // must render as plain text rather than become clickable.
        const root = setup('<p>see http://insecure.test or https://proton.me</p>');

        const anchors = root.querySelectorAll('a');
        expect(anchors).toHaveLength(1);
        expect(anchors[0].getAttribute('href')).toBe('https://proton.me');
        expect(root.querySelector('p')?.textContent).toBe('see http://insecure.test or https://proton.me');
    });

    it('does not linkify URLs starting with ftp://', () => {
        // ftp: is disabled on the shared LinkifyIt instance.
        const root = setup('<p>see ftp://files.test or https://proton.me</p>');

        const anchors = root.querySelectorAll('a');
        expect(anchors).toHaveLength(1);
        expect(anchors[0].getAttribute('href')).toBe('https://proton.me');
        expect(root.querySelector('p')?.textContent).toBe('see ftp://files.test or https://proton.me');
    });

    it('is idempotent — running twice does not double-wrap', () => {
        const root = document.createElement('div');
        root.innerHTML = '<p>visit https://proton.me</p>';

        transformRawLinks(root);
        const afterFirst = root.innerHTML;
        transformRawLinks(root);

        expect(root.innerHTML).toBe(afterFirst);
        expect(root.querySelectorAll('a')).toHaveLength(1);
    });
});
