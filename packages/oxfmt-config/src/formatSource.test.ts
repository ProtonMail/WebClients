import { formatSource } from './formatSource.ts';

describe('formatSource', () => {
    it('formats code with the shared options', async () => {
        expect(await formatSource('file.ts', 'const a = {b:"c"}')).toBe("const a = { b: 'c' };\n");
    });

    it('lets the caller override options', async () => {
        expect(await formatSource('file.ts', 'const a = 1', { semi: false })).toBe('const a = 1\n');
    });

    it('formats styles with tabs', async () => {
        expect(await formatSource('file.scss', '.a{color:red}')).toBe('.a {\n\tcolor: red;\n}\n');
    });

    it('throws on invalid source', async () => {
        await expect(formatSource('file.ts', 'const = ;')).rejects.toThrow('Could not format file.ts');
    });
});
