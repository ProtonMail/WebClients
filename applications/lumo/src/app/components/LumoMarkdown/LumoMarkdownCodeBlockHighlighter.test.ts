import fs from 'node:fs';
import path from 'node:path';

const getInstalledPackageVersion = (packageName: string): string => {
    let dir = path.dirname(require.resolve(packageName));

    while (!fs.existsSync(path.join(dir, 'package.json'))) {
        const parent = path.dirname(dir);
        if (parent === dir) {
            throw new Error(`Could not find package.json for ${packageName}`);
        }
        dir = parent;
    }

    return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).version as string;
};

describe('LumoMarkdownCodeBlockHighlighter stack', () => {
    it('keeps react-syntax-highlighter v16 prism deep-import paths used by the lazy chunk', () => {
        const packageRoot = path.dirname(require.resolve('react-syntax-highlighter/package.json'));

        expect(fs.existsSync(path.join(packageRoot, 'dist/esm/prism.js'))).toBe(true);
        expect(fs.existsSync(path.join(packageRoot, 'dist/esm/styles/prism/one-dark.js'))).toBe(true);
        expect(fs.existsSync(path.join(packageRoot, 'dist/esm/styles/prism/one-light.js'))).toBe(true);
    });

    it('pulls refractor 5 and prismjs 1.30+ (GHSA-x7hr-w5r2-h6wg fix)', () => {
        const refractorVersion = getInstalledPackageVersion('refractor');
        const prismVersion = getInstalledPackageVersion('prismjs');
        const [prismMajor, prismMinor] = prismVersion.split('.').map(Number);

        expect(refractorVersion.startsWith('5.')).toBe(true);
        expect(prismMajor).toBe(1);
        expect(prismMinor).toBeGreaterThanOrEqual(30);
    });
});
