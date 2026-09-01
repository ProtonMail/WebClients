/** The three catalogue reads share one shape, so they share one harness. */
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import { FILTER_STATUS } from '@proton/shared/lib/constants';
import { buildFilter } from '@proton/testing/builders/filter';
import { buildFolder } from '@proton/testing/builders/folder';
import { buildLabel } from '@proton/testing/builders/label';

import type { MailToolDeps } from '../../toolModule';
import { createListFiltersHandler, listFiltersDefinition } from './listFilters';
import { createListFoldersHandler, listFoldersDefinition } from './listFolders';
import { createListLabelsHandler, listLabelsDefinition } from './listLabels';

/** These serializers never resolve a reference, so an empty registry is enough. */
const emptyReferences = createReferenceRegistry();

const deps = (overrides: Partial<MailToolDeps> = {}) =>
    ({ getFolders: () => [], getLabels: () => [], getFilters: () => [], ...overrides }) as MailToolDeps;

const run = <Result>(handler: (params: any, deps: any) => Promise<Result>) => {
    const references = createReferenceRegistry();
    return handler({}, { references }).then((result) => ({ result, references }));
};

describe('list_folders', () => {
    const folders = [
        buildFolder({ ID: 'FOLDER_1', Name: 'Travel', Path: 'Travel' }),
        buildFolder({ ID: 'FOLDER_2', Name: 'Hotels', Path: 'Travel/Hotels', ParentID: 'FOLDER_1' }),
    ];

    it('mints a reference per folder and records its name for the confirm cards', async () => {
        const { result, references } = await run(createListFoldersHandler(deps({ getFolders: () => folders })));

        expect(result.folders).toHaveLength(2);
        expect(references.idFor(result.folders[0].reference)).toBe('FOLDER_1');
        expect(references.labelFor(result.folders[0].reference)?.title).toBe('Travel');
    });

    it('expresses nesting through the parent folder REFERENCE, never a raw id', async () => {
        const { result } = await run(createListFoldersHandler(deps({ getFolders: () => folders })));

        expect(result.folders[0].parent).toBeNull();
        expect(result.folders[1].parent).toBe(result.folders[0].reference);

        const serialized = listFoldersDefinition.serializeForLumo(result, emptyReferences);
        expect(serialized).toContain('top-level');
        expect(serialized).toContain(`parent: ${result.folders[0].reference}`);
        expect(serialized).not.toContain('FOLDER_1');
    });

    it('says so plainly when there are no custom folders', async () => {
        const { result } = await run(createListFoldersHandler(deps()));
        expect(listFoldersDefinition.serializeForLumo(result, emptyReferences)).toBe('The user has no custom folders.');
    });
});

describe('list_labels', () => {
    const labels = [buildLabel({ ID: 'LABEL_1', Name: 'Receipts', Path: 'Receipts', Color: '#c44800' })];

    it('returns each label with its reference, name and colour', async () => {
        const { result, references } = await run(createListLabelsHandler(deps({ getLabels: () => labels })));

        expect(references.idFor(result.labels[0].reference)).toBe('LABEL_1');
        const serialized = listLabelsDefinition.serializeForLumo(result, emptyReferences);
        expect(serialized).toContain('"Receipts"');
        expect(serialized).toContain('#c44800');
    });

    it('says so plainly when there are no labels', async () => {
        const { result } = await run(createListLabelsHandler(deps()));
        expect(listLabelsDefinition.serializeForLumo(result, emptyReferences)).toBe('The user has no labels.');
    });
});

describe('list_filters', () => {
    const filters = [
        buildFilter({
            ID: 'FILTER_1',
            Name: 'Newsletters',
            Status: FILTER_STATUS.ENABLED,
            Sieve: 'require ["fileinto"];',
        }),
        buildFilter({ ID: 'FILTER_2', Name: 'Old rule', Status: FILTER_STATUS.DISABLED, Sieve: undefined }),
    ];

    it('reports enabled state from the API status and carries the Sieve script', async () => {
        const { result } = await run(createListFiltersHandler(deps({ getFilters: () => filters })));

        expect(result.filters[0].enabled).toBe(true);
        expect(result.filters[1].enabled).toBe(false);

        const serialized = listFiltersDefinition.serializeForLumo(result, emptyReferences);
        expect(serialized).toContain('enabled');
        expect(serialized).toContain('disabled');
        expect(serialized).toContain('require ["fileinto"];');
    });

    it('says so plainly when there are no filters', async () => {
        const { result } = await run(createListFiltersHandler(deps()));
        expect(listFiltersDefinition.serializeForLumo(result, emptyReferences)).toBe('The user has no filters.');
    });
});

describe('the catalogue reads', () => {
    it('are all reads taking no params', () => {
        [listFoldersDefinition, listLabelsDefinition, listFiltersDefinition].forEach((definition) => {
            expect(definition.kind).toBe('read');
            expect(definition.paramsSchema.additionalProperties).toBe(false);
            expect(definition.paramsSchema.required).toEqual([]);
        });
    });
});
