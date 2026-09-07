import { FILTER_VERSION } from '@proton/components/containers/filters/constants';
import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import { FILTER_STATUS } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces';
import type { Filter } from '@proton/sieve/filterModel';

import type { MailToolDeps } from '../../toolModule';
import { createFilterCardRenderer, createFilterDefinition, createFilterModule } from './createFilter';
import { hasEveryFilterFieldFilled, renderFilterFields } from './filterCard';

const ENABLED_FILTER: Filter = {
    ID: 'FILTER_ID_1',
    Name: 'Newsletters',
    Status: FILTER_STATUS.ENABLED,
    Priority: 3,
    Version: 2,
    Sieve: 'require ["fileinto"];\nfileinto "Newsletters";',
};

const SIEVE = 'require ["fileinto"];\nfileinto "Travel";';

const setUp = ({ hasPaidMail = true, filters = [] as Filter[] } = {}) => {
    const references = createReferenceRegistry();
    // The server normalises the name, so it deliberately differs from the requested one.
    const addFilter = jest.fn().mockResolvedValue({ ID: 'SERVER_ID', Name: 'Travel' } as Filter);
    const validateSieve = jest.fn().mockResolvedValue(undefined);
    const deps = {
        getUser: () => ({ hasPaidMail }) as UserModel,
        getFilters: () => filters,
        addFilter,
        validateSieve,
    } as unknown as MailToolDeps;

    const create = () => createFilterModule.createHandler(deps)({ name: 'travel', sieve: SIEVE }, { references });

    return { references, addFilter, validateSieve, create };
};

describe('createFilterModule', () => {
    // The model chooses neither Status nor Version: a filter it created disabled would silently do nothing,
    // and the version has to be the dialect `validateSieve` checked the script against.
    it('creates the filter enabled, on the validated dialect version, with the id the endpoint assigns', async () => {
        const { addFilter, create } = setUp();

        await create();

        expect(addFilter).toHaveBeenCalledWith({
            ID: '',
            Name: 'travel',
            Status: FILTER_STATUS.ENABLED,
            Version: FILTER_VERSION,
            Sieve: SIEVE,
        });
    });

    // Chaining "make the rule, now check it" only works if the reference resolves to what the server
    // stored — the requested name never reaches the model.
    it('mints the reference from the created filter, not from the requested name', async () => {
        const { references, create } = setUp();

        const { reference, name } = await create();

        expect(references.idFor(reference)).toBe('SERVER_ID');
        expect(name).toBe('Travel');
    });

    // Writing first would store a script the user's incoming mail then runs against.
    it('validates the script before writing, and does not write when it is rejected', async () => {
        const { addFilter, validateSieve, create } = setUp();
        validateSieve.mockRejectedValue(new ToolInputError('This Sieve script is invalid. line 2: unknown command'));

        await expect(create()).rejects.toThrow('line 2: unknown command');
        expect(validateSieve).toHaveBeenCalledWith(SIEVE);
        expect(addFilter).not.toHaveBeenCalled();
    });

    // Ungated, the tool would be a paywall bypass; and the refusal has to name the limit, or the model
    // cannot tell the user why nothing happened.
    it('refuses without validating or writing when the plan has no active filter left', async () => {
        const { addFilter, validateSieve, create } = setUp({ hasPaidMail: false, filters: [ENABLED_FILTER] });

        await expect(create()).rejects.toThrow('active-filter limit (1)');
        expect(validateSieve).not.toHaveBeenCalled();
        expect(addFilter).not.toHaveBeenCalled();
    });

    it('lets a paid user past the limit that stops a free one', async () => {
        const { addFilter, create } = setUp({ hasPaidMail: true, filters: [ENABLED_FILTER] });

        await create();

        expect(addFilter).toHaveBeenCalled();
    });

    it('exempts every param from the reference guard, since all of them are user words', () => {
        const guarded = Object.keys(createFilterDefinition.paramsSchema.properties).filter(
            (param) => !createFilterDefinition.freeTextParams?.includes(param)
        );

        expect(guarded).toEqual([]);
    });
});

describe('createFilterCardRenderer', () => {
    it('shares the filter card body and its Confirm guard with update_filter', () => {
        expect(createFilterCardRenderer.renderBody).toBe(renderFilterFields);
        expect(createFilterCardRenderer.canApply).toBe(hasEveryFilterFieldFilled);
    });
});
