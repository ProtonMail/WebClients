import type { PassConfig } from '../../hooks/usePassConfig';
import { readProtonPassJSON } from '../../lib/import/providers/protonpass/protonpass.json.reader';
import { itemBuilder } from '../../lib/items/item.builder';
import { ContentFormatVersion, ItemState } from '../../types';
import type { ItemImportIntent } from '../../types';
import { ShareType } from '../../types/data/shares';
import { AutofillMode } from '../../types/protobuf';
import type { State } from '../types';
import { selectExportData } from './export';

const SHARE_ID = 'testShare';

const mockState = {
    user: { user: null, plan: null },
    organization: null,
    items: {
        byShareId: {
            [SHARE_ID]: {
                item1: {
                    itemId: 'item1',
                    shareId: SHARE_ID,
                    state: ItemState.Active,
                    aliasEmail: null,
                    contentFormatVersion: ContentFormatVersion.Item,
                    createTime: 1700000000,
                    modifyTime: 1700000001,
                    pinned: false,
                    shareCount: 0,
                    data: itemBuilder('login').set('content', (content) =>
                        content.set('autofillUrls', [
                            { url: 'https://example.com', mode: AutofillMode.Default },
                            { url: 'https://exact.example.com', mode: AutofillMode.Exact },
                            { url: 'https://never.example.com', mode: AutofillMode.Never },
                        ])
                    ).data,
                },
            },
            optimistic: { history: [], checkpoint: undefined },
        },
    },
    shares: {
        [SHARE_ID]: {
            shareId: SHARE_ID,
            targetType: ShareType.Vault,
            owner: true,
            content: { name: 'My Vault', description: '', display: {} },
        },
    },
} as unknown as State;

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
