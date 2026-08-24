import Papa from 'papaparse';

import type { PassConfig } from '../../hooks/usePassConfig';
import { selectExportData } from '../../store/selectors/export';
import type { State } from '../../store/types';
import type { ItemImportIntent } from '../../types';
import { ContentFormatVersion, ItemState } from '../../types';
import { ShareType } from '../../types/data/shares';
import { AutofillMode } from '../../types/protobuf';
import { readProtonPassCSV } from '../import/providers/protonpass/protonpass.csv.reader';
import { itemBuilder } from '../items/item.builder';
import { createPassExportCSV } from './csv';
import type { ExportCSVItem } from './types';

const SHARE_ID = 'testShare';
const mockConfig = { APP_VERSION: '1.20.0' } as PassConfig;

const mockStateWith = (autofillUrls: { url: string; mode: AutofillMode }[]): State =>
    ({
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
                        data: itemBuilder('login')
                            .set('content', (content) => content.set('autofillUrls', autofillUrls))
                            .set('metadata', (metadata) => metadata.set('name', 'Bank login')).data,
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
    }) as unknown as State;

const exportRow = async (state: State): Promise<ExportCSVItem> => {
    const exportData = selectExportData(mockConfig)(state)({});
    const csv = await (await createPassExportCSV(exportData)).text();
    return (Papa.parse(csv, { header: true }).data as ExportCSVItem[])[0];
};

const reimport = async (state: State): Promise<ItemImportIntent<'login'>> => {
    const exportData = selectExportData(mockConfig)(state)({});
    const csv = await (await createPassExportCSV(exportData)).text();
    const result = await readProtonPassCSV(new File([csv], 'export.csv'));
    return result.vaults[0].items[0] as ItemImportIntent<'login'>;
};

describe('createPassExportCSV — autofill URL modes', () => {
    const mixedModes = [
        { url: 'https://example.com/', mode: AutofillMode.Default },
        { url: 'https://exact.example.com/', mode: AutofillMode.Exact },
        { url: 'https://never.example.com/', mode: AutofillMode.Never },
    ];

    it('keeps `url` Default-only and serializes the full set into the `autofillUrls` column', async () => {
        const row = await exportRow(mockStateWith(mixedModes));

        expect(row.url).toBe('https://example.com/');
        expect(JSON.parse(row.autofillUrls)).toEqual(mixedModes);
    });

    it('serializes into `autofillUrls` even for a Default-only login', async () => {
        const row = await exportRow(mockStateWith([{ url: 'https://example.com/', mode: AutofillMode.Default }]));

        expect(row.url).toBe('https://example.com/');
        expect(JSON.parse(row.autofillUrls)).toEqual([{ url: 'https://example.com/', mode: AutofillMode.Default }]);
    });

    it('leaves the `autofillUrls` column empty when there are no urls', async () => {
        const row = await exportRow(mockStateWith([]));

        expect(row.url).toBe('');
        expect(row.autofillUrls).toBe('');
    });

    it('preserves all modes through a full export → CSV → import round-trip', async () => {
        const login = await reimport(mockStateWith(mixedModes));
        expect(login.content.autofillUrls).toEqual(mixedModes);
    });

    it('falls back to Default entries when the `autofillUrls` column is absent (legacy CSV)', async () => {
        const csv = Papa.unparse([
            {
                type: 'login',
                name: 'Legacy login',
                url: 'https://example.com/',
                username: 'john',
                email: 'john@example.com',
                password: 'hunter2',
                note: '',
                totp: '',
                createTime: '1700000000',
                modifyTime: '1700000001',
                vault: 'Personal',
            },
        ]);

        const result = await readProtonPassCSV(new File([csv], 'legacy.csv'));
        const login = result.vaults[0].items[0] as ItemImportIntent<'login'>;

        expect(login.content.autofillUrls).toEqual([{ url: 'https://example.com/', mode: AutofillMode.Default }]);
    });
});
