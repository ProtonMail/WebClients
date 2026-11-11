import { createOxfmtConfig } from './createOxfmtConfig.ts';

describe('createOxfmtConfig', () => {
    it('keeps the import groups in the expected order', () => {
        const { sortImports } = createOxfmtConfig();
        const groups = (typeof sortImports === 'object' ? (sortImports.groups ?? []) : []).flat();
        const position = (name: string) => groups.indexOf(name as never);

        // react, then third party, then codemirror, @proton, proton-mail, relative, then styles.
        const order = ['react', 'external', 'codemirror', 'proton', 'proton-mail', 'sibling', 'proton-style'];
        expect(order.map(position)).toEqual([...order.map(position)].sort((a, b) => a - b));
        expect(order.map(position)).not.toContain(-1);
    });

    it('lets a workspace override options', () => {
        expect(createOxfmtConfig({ printWidth: 100 }).printWidth).toBe(100);
    });

    it('keeps the shared overrides when a workspace adds its own', () => {
        const files = ['**/*.ts'];
        const { overrides } = createOxfmtConfig({ overrides: [{ files, options: { semi: false } }] });

        expect(overrides?.at(0)?.files).toEqual(['**/*.scss']);
        expect(overrides?.at(-1)?.files).toEqual(files);
    });
});
