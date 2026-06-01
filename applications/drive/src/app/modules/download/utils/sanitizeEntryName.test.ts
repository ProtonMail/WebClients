import { sanitizeEntryName } from './sanitizeEntryName';

describe('sanitizeEntryName', () => {
    it('passes through a normal file name unchanged', () => {
        expect(sanitizeEntryName('hello.txt')).toBe('hello.txt');
    });

    it('replaces forward slashes with underscores', () => {
        expect(sanitizeEntryName('../../evil.exe')).toBe('.._.._evil.exe');
    });

    it('replaces backslashes with underscores', () => {
        expect(sanitizeEntryName('..\\..\\evil.exe')).toBe('.._.._evil.exe');
    });

    it('replaces a pure dot-only name with underscore', () => {
        expect(sanitizeEntryName('..')).toBe('_');
        expect(sanitizeEntryName('.')).toBe('_');
    });

    it('replaces an empty name with underscore', () => {
        expect(sanitizeEntryName('')).toBe('_');
    });

    it('keeps a name that starts with a dot but has other characters', () => {
        expect(sanitizeEntryName('.hidden')).toBe('.hidden');
    });
});
