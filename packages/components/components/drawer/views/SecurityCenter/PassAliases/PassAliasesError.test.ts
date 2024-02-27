import { ApiError } from '@proton/shared/lib/fetch/ApiError';

import PassAliasesError, { PASS_ALIASES_ERROR_STEP } from './PassAliasesError';

describe('PassAliasesError', () => {
    it('should create an instance of PassAliasesError', () => {
        const error = new Error('Test error');
        const step = PASS_ALIASES_ERROR_STEP.INIT_BRIDGE;
        const passAliasesError = new PassAliasesError(error, step);

        expect(passAliasesError).toBeInstanceOf(PassAliasesError);
        expect(passAliasesError).toBeInstanceOf(Error);
        expect(passAliasesError.name).toBe(step);
        expect(passAliasesError.message).toBe('Error: Test error');
        expect(passAliasesError.stack).toBe(error.stack);
    });

    it('should set the error message from full ApiError', () => {
        const apiError = new ApiError('custom error message', 400, 'Error name');
        apiError.data = { Code: 400, Error: 'dude' };
        const step = PASS_ALIASES_ERROR_STEP.CREATE_ALIAS;
        const passAliasesError = new PassAliasesError(apiError, step);

        expect(passAliasesError.name).toBe(PASS_ALIASES_ERROR_STEP.CREATE_ALIAS);
        expect(passAliasesError.message).toBe('API Error 400 - Error name: dude');
        expect(passAliasesError.stack).toBe(apiError.stack);
    });

    it('should set the error message from partial ApiError', () => {
        const apiError = new ApiError('custom error message', 400, 'Error name');
        const step = PASS_ALIASES_ERROR_STEP.CREATE_ALIAS;
        const passAliasesError = new PassAliasesError(apiError, step);

        expect(passAliasesError.name).toBe(PASS_ALIASES_ERROR_STEP.CREATE_ALIAS);
        expect(passAliasesError.message).toBe('API Error - Error name: custom error message');
        expect(passAliasesError.stack).toBe(apiError.stack);
    });
});
