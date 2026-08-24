import { AutofillMode } from '../../../types/protobuf';
import { createNewUrlItem, fromItems, getFirstUrl } from './autofill';

describe('`createNewUrlItem`', () => {
    test('keeps a valid url unchanged', () => {
        const result = createNewUrlItem({ url: 'https://example.com', mode: AutofillMode.Default });
        expect(result.url).toBe('https://example.com');
        expect(result.mode).toBe(AutofillMode.Default);
    });

    test('keeps an already-persisted url that fails sanitization instead of blanking it', () => {
        const result = createNewUrlItem({ url: 'not a valid url', mode: AutofillMode.Default });
        expect(result.url).toBe('not a valid url');
    });

    test('assigns a distinct id to each entry', () => {
        const a = createNewUrlItem({ url: 'https://example.com', mode: AutofillMode.Default });
        const b = createNewUrlItem({ url: 'https://example.com', mode: AutofillMode.Default });
        expect(a.id).not.toEqual(b.id);
    });
});

describe('`getFirstUrl`', () => {
    test('returns the Default-mode url first', () => {
        const result = getFirstUrl([
            { url: 'https://never.example.com', mode: AutofillMode.Never },
            { url: 'https://exact.example.com', mode: AutofillMode.Exact },
            { url: 'https://default.example.com', mode: AutofillMode.Default },
        ]);
        expect(result).toEqual('https://default.example.com');
    });

    test('falls back to another url-type entry, excluding `Never`', () => {
        const result = getFirstUrl([
            { url: 'https://never.example.com', mode: AutofillMode.Never },
            { url: 'https://exact.example.com', mode: AutofillMode.Exact },
        ]);
        expect(result).toEqual('https://exact.example.com');
    });

    test('returns null if only `Never` entries are present', () => {
        const result = getFirstUrl([{ url: 'https://never.example.com', mode: AutofillMode.Never }]);
        expect(result).toBeNull();
    });

    test('returns null for an empty list', () => {
        expect(getFirstUrl([])).toBeNull();
        expect(getFirstUrl()).toBeNull();
    });
});

describe('`fromItems`', () => {
    test('maps UrlItems to AutofillUrls stripping id and deduplicating', () => {
        const result = fromItems(
            [
                { id: 'a', url: 'https://example.com', mode: AutofillMode.Default },
                { id: 'b', url: 'https://example.com', mode: AutofillMode.Default },
                { id: 'c', url: 'https://other.com', mode: AutofillMode.Exact },
            ],
            'https://example.com'
        );

        expect(result).toEqual([
            { url: 'https://example.com', mode: AutofillMode.Default },
            { url: 'https://other.com', mode: AutofillMode.Exact },
        ]);
    });

    test('not appends an empty entry when the url parameter is empty', () => {
        const result = fromItems([{ id: 'a', url: 'https://example.com', mode: AutofillMode.Exact }], '');

        expect(result).toEqual([{ url: 'https://example.com', mode: AutofillMode.Exact }]);
    });

    test('appends an entry when the url parameter is not empty', () => {
        const result = fromItems(
            [{ id: 'a', url: 'https://example.com', mode: AutofillMode.Exact }],
            'https://other.com'
        );

        expect(result).toEqual([
            { url: 'https://other.com', mode: AutofillMode.Default },
            { url: 'https://example.com', mode: AutofillMode.Exact },
        ]);
    });

    test('put the mode default in the beginning but keep the order', () => {
        const result = fromItems(
            [
                { id: 'a', url: 'https://example-a.com', mode: AutofillMode.Exact },
                { id: 'b', url: 'https://example-b.com', mode: AutofillMode.Default },
                { id: 'c', url: 'https://example-c.com', mode: AutofillMode.Never },
                { id: 'd', url: 'https://example-d.com', mode: AutofillMode.Default },
                { id: 'e', url: 'https://example-e.com', mode: AutofillMode.StartWith },
                { id: 'f', url: 'https://example-f.com', mode: AutofillMode.Default },
            ],
            ''
        );

        expect(result).toEqual([
            { url: 'https://example-b.com', mode: AutofillMode.Default },
            { url: 'https://example-d.com', mode: AutofillMode.Default },
            { url: 'https://example-f.com', mode: AutofillMode.Default },
            { url: 'https://example-a.com', mode: AutofillMode.Exact },
            { url: 'https://example-c.com', mode: AutofillMode.Never },
            { url: 'https://example-e.com', mode: AutofillMode.StartWith },
        ]);
    });
});
