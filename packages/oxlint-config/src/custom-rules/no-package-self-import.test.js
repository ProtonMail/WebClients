import path from 'node:path';
import { RuleTester } from 'oxlint/plugins-dev';

import rule from './no-package-self-import.js';

const ruleTester = new RuleTester({
    languageOptions: {
        sourceType: 'module',
    },
});

// Resolves to `@proton/oxlint-config` via this package's own package.json.
const filename = path.join(import.meta.dirname, '..', 'some-rule.js');
const selfImport = (importPath) => ({
    messageId: 'selfImport',
    data: { importPath, packageName: '@proton/oxlint-config' },
});

ruleTester.run('no-package-self-import', rule, {
    valid: [
        { code: `import foo from './foo';`, filename },
        { code: `import foo from './lib/foo.js';`, filename },
        // Cross-package imports must keep using the npm package name.
        { code: `import { Button } from '@proton/atoms/Button/Button';`, filename },
        { code: `import fs from 'node:fs';`, filename },
        // A package whose name only starts with this package's name is not a self-reference.
        { code: `import foo from '@proton/oxlint-config-extra';`, filename },
        { code: `export { foo } from './foo';`, filename },
        { code: `const foo = require('./foo');`, filename },
        // Dynamic imports built at runtime cannot be resolved statically.
        { code: `const mod = await import(somePath);`, filename },
        // Files outside any package are ignored.
        { code: `import foo from '@proton/oxlint-config';`, filename: '/foo.js' },
    ],
    invalid: [
        {
            code: `import foo from '@proton/oxlint-config';`,
            filename,
            errors: [selfImport('@proton/oxlint-config')],
        },
        {
            code: `import foo from '@proton/oxlint-config/lib/foo';`,
            filename,
            errors: [selfImport('@proton/oxlint-config/lib/foo')],
        },
        {
            code: `export { foo } from '@proton/oxlint-config/lib/foo';`,
            filename,
            errors: [selfImport('@proton/oxlint-config/lib/foo')],
        },
        {
            code: `export * from '@proton/oxlint-config/lib/foo';`,
            filename,
            errors: [selfImport('@proton/oxlint-config/lib/foo')],
        },
        {
            code: `const mod = await import('@proton/oxlint-config/lib/foo');`,
            filename,
            errors: [selfImport('@proton/oxlint-config/lib/foo')],
        },
        {
            code: `const foo = require('@proton/oxlint-config/lib/foo');`,
            filename,
            errors: [selfImport('@proton/oxlint-config/lib/foo')],
        },
        {
            code: `import '@proton/oxlint-config/lib/side-effect';`,
            filename,
            errors: [selfImport('@proton/oxlint-config/lib/side-effect')],
        },
        {
            code: `
                import a from '@proton/oxlint-config/a';
                import b from '@proton/oxlint-config/b';
            `,
            filename,
            errors: [selfImport('@proton/oxlint-config/a'), selfImport('@proton/oxlint-config/b')],
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
                source: literal('@proton/oxlint-config/lib/foo'),
            });

            expect(reports).toHaveLength(1);
            expect(reports[0].data).toEqual({
                importPath: '@proton/oxlint-config/lib/foo',
                packageName: '@proton/oxlint-config',
            });
        });

        it('supports the pre-v8 `argument` field', () => {
            const reports = runVisitor('TSImportType', {
                type: 'TSImportType',
                argument: literal('@proton/oxlint-config/lib/foo'),
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
                    expression: literal('@proton/oxlint-config/lib/foo'),
                },
            });

            expect(reports).toHaveLength(1);
            expect(reports[0].data).toEqual({
                importPath: '@proton/oxlint-config/lib/foo',
                packageName: '@proton/oxlint-config',
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
