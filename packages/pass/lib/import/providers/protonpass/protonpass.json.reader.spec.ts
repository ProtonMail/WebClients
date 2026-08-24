import type { ItemImportIntent } from '../../../../types';
import { AutofillMode } from '../../../../types/protobuf';
import { readProtonPassJSON } from './protonpass.json.reader';

const makeLoginExport = (content: object, version = '1.20.0') =>
    JSON.stringify({
        userId: 'test-user-id',
        version,
        vaults: {
            vault1: {
                name: 'Test Vault',
                display: { color: 1, icon: 1 },
                items: [
                    {
                        itemId: 'item1',
                        shareId: 'share1',
                        state: 1,
                        contentFormatVersion: 1,
                        createTime: 1700000000,
                        modifyTime: 1700000001,
                        pinned: false,
                        shareCount: 0,
                        data: {
                            type: 'login',
                            metadata: { name: 'Test Login', note: '', itemUuid: 'uuid1' },
                            content: {
                                itemEmail: '',
                                itemUsername: '',
                                password: '',
                                totpUri: '',
                                passkeys: [],
                                ...content,
                            },
                            extraFields: [],
                            platformSpecific: undefined,
                        },
                    },
                ],
            },
        },
    });

const defaultPayload = { currentAliases: [], userId: 'test-user-id', onPassphrase: async () => '' };

const getLoginItem = (exportData: string) => {
    const result = readProtonPassJSON(exportData, defaultPayload, false);
    return result.vaults[0].items[0] as ItemImportIntent<'login'>;
};

describe('readProtonPassJSON — autofill URL migration', () => {
    it('migrates legacy urls array to Default-mode autofillUrls', () => {
        const data = makeLoginExport({ urls: ['https://example.com', 'https://proton.me'] });
        const item = getLoginItem(data);
        expect(item.content.autofillUrls).toEqual([
            { url: 'https://example.com/', mode: AutofillMode.Default },
            { url: 'https://proton.me/', mode: AutofillMode.Default },
        ]);
    });

    it('ignores legacy urls when autofillUrls is present (new duplicate format)', () => {
        const data = makeLoginExport({
            urls: ['https://example.com'],
            autofillUrls: [
                { url: 'https://example.com', mode: AutofillMode.Default },
                { url: 'https://exact.example.com', mode: AutofillMode.Exact },
            ],
        });
        const item = getLoginItem(data);
        expect(item.content.autofillUrls).toEqual([
            { url: 'https://example.com/', mode: AutofillMode.Default },
            { url: 'https://exact.example.com/', mode: AutofillMode.Exact },
        ]);
    });

    it('preserves autofillUrls with modes when no legacy urls field present', () => {
        const data = makeLoginExport({
            autofillUrls: [
                { url: 'https://example.com', mode: AutofillMode.Default },
                { url: 'https://exact.example.com', mode: AutofillMode.Exact },
                { url: 'https://neverme.com', mode: AutofillMode.Never },
            ],
        });
        const item = getLoginItem(data);
        expect(item.content.autofillUrls).toEqual([
            { url: 'https://example.com/', mode: AutofillMode.Default },
            { url: 'https://exact.example.com/', mode: AutofillMode.Exact },
            { url: 'https://neverme.com/', mode: AutofillMode.Never },
        ]);
    });

    it('drops urls with an unsupported scheme instead of importing them verbatim', () => {
        const data = makeLoginExport({
            autofillUrls: [
                { url: 'https://example.com', mode: AutofillMode.Default },
                { url: 'javascript:alert(1)', mode: AutofillMode.Default },
                { url: 'data:text/html,<script>alert(1)</script>', mode: AutofillMode.Never },
            ],
        });
        const item = getLoginItem(data);
        expect(item.content.autofillUrls).toEqual([{ url: 'https://example.com/', mode: AutofillMode.Default }]);
    });

    it('drops unsafe or invalid regex patterns instead of importing them verbatim', () => {
        const data = makeLoginExport({
            autofillUrls: [
                { url: 'https://example.com', mode: AutofillMode.Default },
                { url: '(a+)+$', mode: AutofillMode.RegularExpression }, // catastrophic backtracking
                { url: '(unclosed', mode: AutofillMode.RegularExpression }, // invalid syntax
                { url: 'sub\\d*\\.example\\.com', mode: AutofillMode.RegularExpression }, // safe
            ],
        });
        const item = getLoginItem(data);
        expect(item.content.autofillUrls).toEqual([
            { url: 'https://example.com/', mode: AutofillMode.Default },
            { url: 'sub\\d*\\.example\\.com', mode: AutofillMode.RegularExpression },
        ]);
    });

    it('drops entries with a corrupted or out-of-range mode instead of importing them verbatim', () => {
        const data = makeLoginExport({
            autofillUrls: [
                { url: 'https://example.com', mode: AutofillMode.Default },
                { url: 'https://blocked.example.com', mode: 99 as AutofillMode }, // out of enum range
            ],
        });
        const item = getLoginItem(data);
        expect(item.content.autofillUrls).toEqual([{ url: 'https://example.com/', mode: AutofillMode.Default }]);
    });

    it('drops malformed urls instead of importing them verbatim', () => {
        const data = makeLoginExport({
            autofillUrls: [
                { url: 'https://example.com', mode: AutofillMode.Default },
                { url: 'not a url', mode: AutofillMode.Default },
            ],
        });
        const item = getLoginItem(data);
        expect(item.content.autofillUrls).toEqual([{ url: 'https://example.com/', mode: AutofillMode.Default }]);
    });

    it('dedupes identical url+mode pairs coming from the export', () => {
        const data = makeLoginExport({
            autofillUrls: [
                { url: 'https://example.com', mode: AutofillMode.Default },
                { url: 'https://example.com', mode: AutofillMode.Default },
            ],
        });
        const item = getLoginItem(data);
        expect(item.content.autofillUrls).toEqual([{ url: 'https://example.com/', mode: AutofillMode.Default }]);
    });
});
