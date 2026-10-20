import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { RuleTester } from 'oxlint/plugins-dev';

import rule from './noExtraneousDependencies.ts';

/**
 * Fixture layout:
 *   app/package.json          `@proton/app`; declares `declared`, `@proton/declared-workspace`, dev `dev-only`,
 *                             optional `optional-only`, peer `peer-only`
 *   node_modules/<package>    real directories, so they count as external
 *   node_modules/@proton/<workspace> -> ../../workspace (symlinks, like pnpm workspace links)
 */
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'no-extraneous-dependencies-'));
const app = path.join(root, 'app');
fs.mkdirSync(path.join(app, 'src'), { recursive: true });
fs.writeFileSync(
    path.join(app, 'package.json'),
    JSON.stringify({
        name: '@proton/app',
        dependencies: { declared: '1.0.0', '@proton/declared-workspace': 'workspace:^' },
        devDependencies: { 'dev-only': '1.0.0' },
        optionalDependencies: { 'optional-only': '1.0.0' },
        peerDependencies: { 'peer-only': '1.0.0' },
    })
);
for (const name of ['declared', 'dev-only', 'optional-only', 'peer-only', 'undeclared', '@scope/undeclared']) {
    fs.mkdirSync(path.join(root, 'node_modules', name), { recursive: true });
}
fs.mkdirSync(path.join(root, 'workspace'));
fs.mkdirSync(path.join(root, 'node_modules', '@proton'), { recursive: true });
for (const name of ['workspace', 'declared-workspace']) {
    fs.symlinkSync(path.join(root, 'workspace'), path.join(root, 'node_modules', '@proton', name));
}

const sourceFile = path.join(app, 'src', 'index.ts');
const testFile = path.join(app, 'src', 'index.test.ts');
const options = [{ devDependencies: ['**/*.test.ts'], optionalDependencies: false, peerDependencies: true }];

const ruleTester = new RuleTester();

ruleTester.run('no-extraneous-dependencies', rule, {
    valid: [
        { code: `import declared from 'declared';`, filename: sourceFile, options },
        { code: `import peer from 'peer-only';`, filename: sourceFile, options },
        { code: `import dev from 'dev-only';`, filename: testFile, options },
        { code: `import fs from 'node:fs'; import path from 'path';`, filename: sourceFile, options },
        { code: `import local from './local';`, filename: sourceFile, options },
        { code: `import workspace from '@proton/declared-workspace/lib/thing';`, filename: sourceFile, options },
        { code: `import self from '@proton/app/lib/thing';`, filename: sourceFile, options },
        { code: `import notInstalled from 'not-installed';`, filename: sourceFile, options },
        { code: `import type { Type } from 'undeclared';`, filename: sourceFile, options },
        { code: `import { type Type } from 'undeclared';`, filename: sourceFile, options },
        { code: `export type { Type } from 'undeclared';`, filename: sourceFile, options },
        { code: `import dev from 'dev-only';`, filename: sourceFile, options: [{ devDependencies: true }] },
        { code: `import optional from 'optional-only';`, filename: sourceFile },
    ],
    invalid: [
        {
            code: `import workspace from '@proton/workspace/lib/thing';`,
            filename: sourceFile,
            options,
            errors: [{ messageId: 'missing', data: { packageName: '@proton/workspace' } }],
        },
        {
            code: `import undeclared from 'undeclared';`,
            filename: sourceFile,
            options,
            errors: [{ messageId: 'missing', data: { packageName: 'undeclared' } }],
        },
        {
            code: `import thing from '@scope/undeclared/deep/path';`,
            filename: sourceFile,
            options,
            errors: [{ messageId: 'missing', data: { packageName: '@scope/undeclared' } }],
        },
        {
            code: `import dev from 'dev-only';`,
            filename: sourceFile,
            options,
            errors: [{ messageId: 'devDependency', data: { packageName: 'dev-only' } }],
        },
        {
            code: `import optional from 'optional-only';`,
            filename: sourceFile,
            options,
            errors: [{ messageId: 'optionalDependency', data: { packageName: 'optional-only' } }],
        },
        {
            code: `import peer from 'peer-only';`,
            filename: sourceFile,
            options: [{ peerDependencies: false }],
            errors: [{ messageId: 'missing', data: { packageName: 'peer-only' } }],
        },
        {
            code: `import undeclared from 'undeclared';`,
            filename: testFile,
            options,
            errors: [{ messageId: 'missing', data: { packageName: 'undeclared' } }],
        },
        {
            code: `export { thing } from 'undeclared'; export * from 'undeclared';`,
            filename: sourceFile,
            options,
            errors: [{ messageId: 'missing' }, { messageId: 'missing' }],
        },
        {
            code: `const lazy = () => import('undeclared'); const required = require('undeclared');`,
            filename: sourceFile,
            options,
            errors: [{ messageId: 'missing' }, { messageId: 'missing' }],
        },
    ],
});
