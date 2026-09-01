import { FILTER_VERSION } from '@proton/components/containers/filters/constants';
import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import type { Filter } from '@proton/sieve/filterModel';

import type { MailToolDeps } from '../../toolModule';
import { updateFilterCardRenderer, updateFilterDefinition, updateFilterModule } from './updateFilter';

const NEWSLETTERS: Filter = {
    ID: 'FILTER_ID_1',
    Name: 'Newsletters',
    Status: 0,
    Priority: 3,
    Version: 1,
    Sieve: 'require ["fileinto"];\nfileinto "Newsletters";',
};

const SIEVE = 'require ["fileinto"];\nfileinto "News";';

const setUp = (filters: Filter[] = [NEWSLETTERS]) => {
    const references = createReferenceRegistry();
    const updateFilter = jest.fn().mockResolvedValue(undefined);
    const validateSieve = jest.fn().mockResolvedValue(undefined);
    const deps = { getFilters: () => filters, updateFilter, validateSieve } as unknown as MailToolDeps;

    const update = (filter: string) =>
        updateFilterModule.createHandler(deps)({ filter, name: 'News', sieve: SIEVE }, { references });

    return { references, updateFilter, validateSieve, update };
};

describe('updateFilterModule', () => {
    // Status is preserved (an update must not silently enable a disabled filter); Version is NOT — it has
    // to match the dialect `validateSieve` checked the script against, so a stored v1 is upgraded.
    it('preserves the stored Status but writes the validated dialect version', async () => {
        const { references, updateFilter, update } = setUp();

        await update(references.referenceFor('filter', 'FILTER_ID_1', { title: 'Newsletters' }));

        expect(updateFilter).toHaveBeenCalledWith('FILTER_ID_1', {
            ID: 'FILTER_ID_1',
            Name: 'News',
            Status: 0,
            Version: FILTER_VERSION,
            Sieve: SIEVE,
        });
    });

    // Writing first would store a script the user's incoming mail then runs against.
    it('validates the script before writing, and does not write when it is rejected', async () => {
        const { references, updateFilter, validateSieve, update } = setUp();
        validateSieve.mockRejectedValue(new ToolInputError('This Sieve script is invalid. line 2: unknown command'));

        await expect(
            update(references.referenceFor('filter', 'FILTER_ID_1', { title: 'Newsletters' }))
        ).rejects.toThrow('line 2: unknown command');
        expect(validateSieve).toHaveBeenCalledWith(SIEVE);
        expect(updateFilter).not.toHaveBeenCalled();
    });

    it('rejects a reference whose filter is no longer stored, without writing', async () => {
        const { references, updateFilter, update } = setUp([]);

        await expect(
            update(references.referenceFor('filter', 'FILTER_ID_1', { title: 'Newsletters' }))
        ).rejects.toThrow(ToolInputError);
        expect(updateFilter).not.toHaveBeenCalled();
    });

    it('rejects a reference of another kind before resolving it to an id', async () => {
        const { references, updateFilter, update } = setUp();

        await expect(
            update(references.referenceFor('folder', 'FILTER_ID_1', { title: 'Newsletters' }))
        ).rejects.toThrow(ToolInputError);
        expect(updateFilter).not.toHaveBeenCalled();
    });

    it('exempts the name and the script from the reference guard, leaving only the filter guarded', () => {
        const guarded = Object.keys(updateFilterDefinition.paramsSchema.properties).filter(
            (param) => !updateFilterDefinition.freeTextParams?.includes(param)
        );

        expect(guarded).toEqual(['filter']);
    });
});

describe('updateFilterCardRenderer', () => {
    it.each([
        ['an emptied name', { name: '  ', sieve: SIEVE }, false],
        ['an emptied script', { name: 'News', sieve: '' }, false],
        ['both fields filled in', { name: 'News', sieve: SIEVE }, true],
    ])('allows Confirm only when both fields are filled in: %s', (_case, params, applyable) => {
        expect(updateFilterCardRenderer.canApply?.(params)).toBe(applyable);
    });
});
