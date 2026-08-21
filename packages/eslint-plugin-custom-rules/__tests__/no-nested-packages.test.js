import path from 'node:path';

import { checkNestedPackagePath, normalizePackagePath } from '../lib/is-nested-package-path.js';
import rule from '../no-nested-packages.js';

const repoRoot = path.resolve(import.meta.dirname, '../../..');
const defaultAllowedPaths = [
    'applications/lumo/src/app/lib/lumo-api-client',
    'applications/pass-desktop/native',
    'packages/pass/docs/starlight',
    'packages/wasm/andromeda',
];

describe('normalizePackagePath', () => {
    it('strips a trailing package.json segment', () => {
        expect(normalizePackagePath('packages/atoms/package.json')).toBe('packages/atoms');
    });

    it('normalizes root package.json to an empty string', () => {
        expect(normalizePackagePath('package.json')).toBe('');
    });
});

describe('checkNestedPackagePath', () => {
    it('allows top-level application packages', () => {
        expect(checkNestedPackagePath('applications/mail')).toEqual({
            isViolation: false,
            category: 'applications',
        });
    });

    it('allows top-level packages', () => {
        expect(checkNestedPackagePath('packages/atoms')).toEqual({
            isViolation: false,
            category: 'packages',
        });
    });

    it('flags nested packages under applications/', () => {
        expect(checkNestedPackagePath('applications/pass-desktop/native')).toEqual({
            isViolation: true,
            category: 'applications',
        });
    });

    it('flags nested packages under packages/', () => {
        expect(checkNestedPackagePath('packages/pass/docs/starlight')).toEqual({
            isViolation: true,
            category: 'packages',
        });
    });

    it('allows allowlisted nested packages', () => {
        expect(checkNestedPackagePath('packages/wasm/andromeda', defaultAllowedPaths)).toEqual({
            isViolation: false,
            category: 'packages',
        });
    });

    it('ignores paths outside applications/ and packages/', () => {
        expect(checkNestedPackagePath('utilities/ci-scripts')).toEqual({
            isViolation: false,
            category: null,
        });
    });

    it('ignores the repository root package.json', () => {
        expect(checkNestedPackagePath('')).toEqual({
            isViolation: false,
            category: null,
        });
    });
});

describe('no-nested-packages rule', () => {
    const runRule = (packageJsonPath, allowedPaths = defaultAllowedPaths) => {
        const reports = [];
        const listeners = rule.create({
            options: [{ allowedPaths }],
            physicalFilename: packageJsonPath,
            filename: packageJsonPath,
            cwd: repoRoot,
            report: (descriptor) => reports.push(descriptor),
        });

        listeners['Program:exit']?.({ type: 'Program' });
        listeners.Object?.({ type: 'Object' });

        return reports;
    };

    it('reports nested package.json files under packages/', () => {
        const reports = runRule(path.join(repoRoot, 'packages/foo/bar/package.json'), []);

        expect(reports).toHaveLength(1);
        expect(reports[0].message).toBe(
            'Nested packages are not allowed under packages/. Move this package to a top-level workspace (e.g. packages/<name>).'
        );
    });

    it('allows top-level package.json files', () => {
        const reports = runRule(path.join(repoRoot, 'packages/atoms/package.json'));

        expect(reports).toHaveLength(0);
    });

    it('allows grandfathered nested package.json files', () => {
        const reports = runRule(path.join(repoRoot, 'packages/wasm/andromeda/package.json'));

        expect(reports).toHaveLength(0);
    });
});
