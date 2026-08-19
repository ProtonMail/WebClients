import type { ApiImporter } from '../../api/api.interface';
import { ApiImportProvider, ApiImporterState } from '../../api/api.interface';
import { ImportType } from '../../interface';
import { normalizeImporter, normalizeImporters } from './importers.helpers';

const buildImporter = (overrides: Partial<ApiImporter> = {}): ApiImporter => ({
    ID: 'importer-1',
    Account: 'john@example.com',
    Provider: ApiImportProvider.GOOGLE,
    Product: [ImportType.DRIVE],
    ModifyTime: 1601053249,
    Email: 'john@example.com',
    ...overrides,
});

describe('normalizeImporter', () => {
    it('Should map Drive ImportedBytes to importedBytes on the active importer', () => {
        const apiImporter = buildImporter({
            Product: [ImportType.DRIVE],
            Active: {
                [ImportType.DRIVE]: {
                    CreateTime: 1601053249,
                    State: ApiImporterState.RUNNING,
                    ImportedBytes: 2048,
                },
            },
        });

        const { activeImporters } = normalizeImporter(apiImporter);

        expect(activeImporters).toHaveLength(1);
        expect(activeImporters[0]).toMatchObject({
            localID: 'importer-1-Drive',
            product: ImportType.DRIVE,
            importState: ApiImporterState.RUNNING,
            importedBytes: 2048,
        });
    });

    it('Should leave importedBytes undefined when the API omits it', () => {
        const apiImporter = buildImporter({
            Product: [ImportType.MAIL],
            Active: {
                [ImportType.MAIL]: {
                    CreateTime: 1601053249,
                    State: ApiImporterState.RUNNING,
                    Total: 80,
                },
            },
        });

        const { activeImporters } = normalizeImporter(apiImporter);

        expect(activeImporters[0].importedBytes).toBeUndefined();
        expect(activeImporters[0].total).toBe(80);
    });

    it('Should preserve importedBytes of 0 while a Drive import is starting', () => {
        const apiImporter = buildImporter({
            Active: {
                [ImportType.DRIVE]: {
                    CreateTime: 1601053249,
                    State: ApiImporterState.RUNNING,
                    ImportedBytes: 0,
                },
            },
        });

        const { activeImporters } = normalizeImporter(apiImporter);

        expect(activeImporters[0].importedBytes).toBe(0);
    });

    it('Should return no active importers when Active is absent', () => {
        const { activeImporters } = normalizeImporter(buildImporter({ Active: undefined }));

        expect(activeImporters).toEqual([]);
    });
});

describe('normalizeImporters', () => {
    it('Should index active importers by localID including importedBytes', () => {
        const { activeImportersMap } = normalizeImporters({
            Code: 1000,
            Importers: [
                buildImporter({
                    Active: {
                        [ImportType.DRIVE]: {
                            CreateTime: 1601053249,
                            State: ApiImporterState.RUNNING,
                            ImportedBytes: 4096,
                        },
                    },
                }),
            ],
        });

        expect(activeImportersMap['importer-1-Drive'].importedBytes).toBe(4096);
    });
});
