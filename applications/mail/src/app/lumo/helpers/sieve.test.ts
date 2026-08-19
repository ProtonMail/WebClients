import { assertSieveValid } from './sieve';

describe('assertSieveValid', () => {
    it('accepts a script the backend raised no issue against', () => {
        expect(() => assertSieveValid([])).not.toThrow();
    });

    it('names every issue and its 1-based line, so the model can correct its own script', () => {
        expect(() =>
            assertSieveValid([
                { from: { line: 0, ch: 0 }, message: 'Unknown command "fileinfo"' },
                { from: { line: 4, ch: 2 }, message: 'Missing require "imap4flags"' },
            ])
        ).toThrow('line 1: Unknown command "fileinfo"; line 5: Missing require "imap4flags"');
    });
});
