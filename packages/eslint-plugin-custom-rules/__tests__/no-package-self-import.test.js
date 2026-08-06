import path from 'node:path';

import rule from '../no-package-self-import';

const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
    },
});

// Resolves to `eslint-plugin-custom-rules` via this package's own package.json.
const filename = path.join(import.meta.dirname, '..', 'some-rule.js');
const selfImport = (importPath) => ({
    messageId: 'selfImport',
    data: { importPath, packageName: 'eslint-plugin-custom-rules' },
});

ruleTester.run('no-package-self-import', rule, {
    valid: [
        { code: `import foo from './foo';`, filename },
        { code: `import foo from '../lib/foo';`, filename },
        // Cross-package imports must keep using the npm package name.
        { code: `import { Button } from '@proton/atoms/Button/Button';`, filename },
        { code: `import fs from 'node:fs';`, filename },
        // A package whose name only starts with this package's name is not a self-reference.
        { code: `import foo from 'eslint-plugin-custom-rules-extra';`, filename },
        { code: `export { foo } from './foo';`, filename },
        { code: `const foo = require('./foo');`, filename },
        // Dynamic imports built at runtime cannot be resolved statically.
        { code: `const mod = await import(somePath);`, filename },
        // Files outside any package are ignored.
        { code: `import foo from 'eslint-plugin-custom-rules';`, filename: '/foo.js' },
    ],
    invalid: [
        {
            code: `import foo from 'eslint-plugin-custom-rules';`,
            filename,
            errors: [selfImport('eslint-plugin-custom-rules')],
        },
        {
            code: `import foo from 'eslint-plugin-custom-rules/lib/foo';`,
            filename,
            errors: [selfImport('eslint-plugin-custom-rules/lib/foo')],
        },
        {
            code: `export { foo } from 'eslint-plugin-custom-rules/lib/foo';`,
            filename,
            errors: [selfImport('eslint-plugin-custom-rules/lib/foo')],
        },
        {
            code: `export * from 'eslint-plugin-custom-rules/lib/foo';`,
            filename,
            errors: [selfImport('eslint-plugin-custom-rules/lib/foo')],
        },
        {
            code: `const mod = await import('eslint-plugin-custom-rules/lib/foo');`,
            filename,
            errors: [selfImport('eslint-plugin-custom-rules/lib/foo')],
        },
        {
            code: `const foo = require('eslint-plugin-custom-rules/lib/foo');`,
            filename,
            errors: [selfImport('eslint-plugin-custom-rules/lib/foo')],
        },
        {
            code: `import 'eslint-plugin-custom-rules/lib/side-effect';`,
            filename,
            errors: [selfImport('eslint-plugin-custom-rules/lib/side-effect')],
        },
        {
            code: `
                import a from 'eslint-plugin-custom-rules/a';
                import b from 'eslint-plugin-custom-rules/b';
            `,
            filename,
            errors: [selfImport('eslint-plugin-custom-rules/a'), selfImport('eslint-plugin-custom-rules/b')],
        },
    ],
});

// TypeScript-only syntax cannot be parsed by RuleTester's default parser, so these visitors are
// driven directly with synthetic nodes rather than pulling in @typescript-eslint/parser.
describe('typescript-only syntax', () => {
    const runVisitor = (visitor, node) => {
        const reports = [];
        const listeners = rule.create({
            options: [],
            physicalFilename: filename,
            filename,
            report: (descriptor) => reports.push(descriptor),
        });

        listeners[visitor]?.(node);

        return reports;
    };

    const literal = (value) => ({ type: 'Literal', value });

    describe('TSImportType', () => {
        it('reports `let x: import("<self>").Foo`', () => {
            const reports = runVisitor('TSImportType', {
                type: 'TSImportType',
                source: literal('eslint-plugin-custom-rules/lib/foo'),
            });

            expect(reports).toHaveLength(1);
            expect(reports[0].data).toEqual({
                importPath: 'eslint-plugin-custom-rules/lib/foo',
                packageName: 'eslint-plugin-custom-rules',
            });
        });

        it('supports the pre-v8 `argument` field', () => {
            const reports = runVisitor('TSImportType', {
                type: 'TSImportType',
                argument: literal('eslint-plugin-custom-rules/lib/foo'),
            });

            expect(reports).toHaveLength(1);
        });

        it('ignores other packages', () => {
            const reports = runVisitor('TSImportType', {
                type: 'TSImportType',
                source: literal('@proton/atoms/Button/Button'),
            });

            expect(reports).toHaveLength(0);
        });
    });

    describe('TSImportEqualsDeclaration', () => {
        it('reports `import Foo = require("<self>")`', () => {
            const reports = runVisitor('TSImportEqualsDeclaration', {
                type: 'TSImportEqualsDeclaration',
                moduleReference: {
                    type: 'TSExternalModuleReference',
                    expression: literal('eslint-plugin-custom-rules/lib/foo'),
                },
            });

            expect(reports).toHaveLength(1);
            expect(reports[0].data).toEqual({
                importPath: 'eslint-plugin-custom-rules/lib/foo',
                packageName: 'eslint-plugin-custom-rules',
            });
        });

        it('ignores namespace aliases, which reference no module', () => {
            const reports = runVisitor('TSImportEqualsDeclaration', {
                type: 'TSImportEqualsDeclaration',
                moduleReference: { type: 'Identifier', name: 'SomeNamespace' },
            });

            expect(reports).toHaveLength(0);
        });
    });
});
