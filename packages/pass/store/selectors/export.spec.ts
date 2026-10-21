import type { PassConfig } from '../../hooks/usePassConfig';
import { readProtonPassJSON } from '../../lib/import/providers/protonpass/protonpass.json.reader';
import { itemBuilder } from '../../lib/items/item.builder';
import type { ItemImportIntent } from '../../types/data/items.dto';
import { AutofillMode } from '../../types/protobuf';
import { createTestItem } from '../../utils/tests/fixtures/items';
import { createTestShare } from '../../utils/tests/fixtures/shares';
import { createTestState } from '../../utils/tests/state';
import { selectExportData } from './export';

const SHARE_ID = 'testShare';

const mockState = createTestState({
    shares: [
        createTestShare({
            shareId: SHARE_ID,
            owner: true,
            content: { name: 'My Vault', description: '', display: {} },
        }),
    ],
    items: [
        createTestItem('login', {
            itemId: 'item1',
            shareId: SHARE_ID,
            data: itemBuilder('login').set('content', (content) =>
                content.set('autofillUrls', [
                    { url: 'https://example.com', mode: AutofillMode.Default },
                    { url: 'https://exact.example.com', mode: AutofillMode.Exact },
                    { url: 'https://never.example.com', mode: AutofillMode.Never },
                ])
            ).data,
        }),
    ],
});

const mockConfig = { APP_VERSION: '1.20.0' } as PassConfig;

describe('selectExportData — autofill URL modes', () => {
    it('duplicates Default urls into legacy urls while autofillUrls keeps the full set of modes', () => {
        const exportData = selectExportData(mockConfig)(mockState)({});
        const [vault] = Object.values(exportData.vaults);
        const [item] = vault.items;

        expect((item.data.content as any).urls).toEqual(['https://example.com']);
        expect((item.data.content as any).autofillUrls).toEqual([
            { url: 'https://example.com', mode: AutofillMode.Default },
            { url: 'https://exact.example.com', mode: AutofillMode.Exact },
            { url: 'https://never.example.com', mode: AutofillMode.Never },
        ]);
    });

    it('preserves all modes through a full export → import round-trip', () => {
        const exportData = selectExportData(mockConfig)(mockState)({});
        const json = JSON.stringify(exportData);

        const result = readProtonPassJSON(json, { currentAliases: [], onPassphrase: async () => '' }, false);
        const login = result.vaults[0].items[0] as ItemImportIntent<'login'>;

        expect(login.content.autofillUrls).toEqual([
            { url: 'https://example.com/', mode: AutofillMode.Default },
            { url: 'https://exact.example.com/', mode: AutofillMode.Exact },
            { url: 'https://never.example.com/', mode: AutofillMode.Never },
        ]);
    });
});
