import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { buildSandboxed, productionTargets } from './buildSandboxed';

describe('buildSandboxed', () => {
    let root: string;

    const addSandboxed = (file: string, code = 'export const answer = 42;') => {
        const target = path.join(root, file);
        mkdirSync(path.dirname(target), { recursive: true });
        writeFileSync(target, code);
    };

    beforeEach(() => {
        root = mkdtempSync(path.join(os.tmpdir(), 'sandboxed-libraries-'));
    });

    afterEach(() => {
        rmSync(root, { recursive: true, force: true });
    });

    it('names each bundle after its sandboxed file', async () => {
        addSandboxed('modules/pdf/pdfPreview.sandboxed.ts');

        const { manifest, bundles } = await buildSandboxed({ cwd: root });

        expect(manifest).toEqual({ pdfPreview: 'pdfPreview.sandboxed.js' });
        expect(bundles).toHaveLength(1);
    });

    it('puts a content hash in the filename for production', async () => {
        addSandboxed('modules/pdf/pdfPreview.sandboxed.ts');

        const { manifest } = await buildSandboxed({ cwd: root, hash: true });

        expect(manifest.pdfPreview).toMatch(/^pdfPreview\.sandboxed\.[0-9a-f]{8}\.js$/);
    });

    it('targets the production browsers, so a sandboxed library still parses on Chrome 80', async () => {
        addSandboxed(
            'modules/pdf/pdfPreview.sandboxed.ts',
            'Object.assign(globalThis, { fill: (options: { size?: number }) => { options.size ??= 1; return options; } });'
        );

        const { bundles } = await buildSandboxed({ cwd: root });

        expect(productionTargets()).toEqual(expect.arrayContaining(['chrome80', 'safari14', 'ios14']));
        expect(bundles[0].code).not.toContain('??=');
    });

    it('fails when two sandboxed libraries share a name, instead of one silently winning', async () => {
        addSandboxed('modules/a/preview.sandboxed.ts');
        addSandboxed('modules/b/preview.sandboxed.ts');

        await expect(buildSandboxed({ cwd: root })).rejects.toThrow(/Duplicate sandboxed library names.*preview/);
    });
});
