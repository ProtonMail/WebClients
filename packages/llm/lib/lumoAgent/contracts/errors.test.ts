import { ToolInputError, UnknownReferenceError } from './errors';

describe('framework errors', () => {
    describe('UnknownReferenceError', () => {
        it('carries the offending reference and a self-correcting message', () => {
            const error = new UnknownReferenceError('email-a3f9k2');
            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('UnknownReferenceError');
            expect(error.reference).toBe('email-a3f9k2');
            expect(error.message).toContain('email-a3f9k2');
            expect(error.message).toContain('not returned by any earlier tool');
        });
    });

    describe('ToolInputError', () => {
        it('reaches the model with the handler message verbatim', () => {
            const error = new ToolInputError('Unknown sort "oldest". Valid sorts are: newest, size.');
            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('ToolInputError');
            expect(error.message).toBe('Unknown sort "oldest". Valid sorts are: newest, size.');
        });

        it('is distinguishable from UnknownReferenceError so the engine can branch on it', () => {
            expect(new ToolInputError('bad input')).not.toBeInstanceOf(UnknownReferenceError);
        });
    });
});
