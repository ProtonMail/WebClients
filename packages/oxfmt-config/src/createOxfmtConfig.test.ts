import prettierConfig from '@proton/prettier-config-proton';

import { createOxfmtConfig } from './createOxfmtConfig.ts';

describe('createOxfmtConfig', () => {
    it('uses the same formatting options as prettier', () => {
        const config = createOxfmtConfig();

        for (const key of [
            'printWidth',
            'arrowParens',
            'singleQuote',
            'trailingComma',
            'tabWidth',
            'proseWrap',
        ] as const) {
            expect(config[key], key).toBe(prettierConfig[key]);
        }
    });

    it('keeps the import groups in the order of the prettier importOrder', () => {
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
});
