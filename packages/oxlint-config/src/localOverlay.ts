import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { OxlintConfig } from 'oxlint';

/**
 * Optional, per-engineer lint rules that are off for everyone by default.
 * An engineer opts in by copying `oxlint.local.example.mts` to the gitignored `oxlint.local.mts` at the repo root.
 * See README.md.
 *
 * No `import.meta` and no top-level `await`: workspaces that type-check as CommonJS import this file too.
 */
export type LocalOverlay = Pick<OxlintConfig, 'jsPlugins' | 'rules'>;

/** Oxlint runs from a workspace folder or the repo root, so walk up to the folder holding the workspace file. */
const findRepoRoot = (directory: string): string | undefined => {
    if (existsSync(path.join(directory, 'pnpm-workspace.yaml'))) {
        return directory;
    }

    const parent = path.dirname(directory);

    return parent === directory ? undefined : findRepoRoot(parent);
};

const loadLocalOverlay = (): LocalOverlay | undefined => {
    // The pre-commit hook sets this so personal rules never block or autofix a commit
    if (process.env.PROTON_OXLINT_NO_LOCAL) {
        return undefined;
    }

    const repoRoot = findRepoRoot(process.cwd());
    const overlayPath = repoRoot && path.join(repoRoot, 'oxlint.local.mts');

    if (!overlayPath || !existsSync(overlayPath)) {
        return undefined;
    }

    const overlayModule: { default: LocalOverlay } = createRequire(overlayPath)(overlayPath);

    return overlayModule.default;
};

/** `undefined` when the engineer did not opt in, which is the case on CI. */
export const localOverlay = loadLocalOverlay();

/** Oxlint accepts aliases for the same rule, so compare canonical names: `eslint/foo` is `foo`, `@typescript-eslint/foo` is `typescript/foo`. */
const normalizeRuleName = (ruleName: string) => {
    if (ruleName.startsWith('eslint/')) {
        return ruleName.slice('eslint/'.length);
    }

    if (ruleName.startsWith('@typescript-eslint/')) {
        return `typescript/${ruleName.slice('@typescript-eslint/'.length)}`;
    }

    return ruleName;
};

/**
 * Only adds rules. A rule the shared config already sets keeps its shared value, so a local file can't hide
 * a finding that CI would report.
 */
export const getLocalOverlayConfig = (shared: Pick<OxlintConfig, 'rules' | 'overrides'>) => {
    if (!localOverlay) {
        return {};
    }

    const sharedRuleNames = new Set(
        [
            ...Object.keys(shared.rules ?? {}),
            ...(shared.overrides ?? []).flatMap((override) => Object.keys(override.rules ?? {})),
        ].map(normalizeRuleName)
    );
    const addedRules = Object.fromEntries(
        Object.entries(localOverlay.rules ?? {}).filter(
            ([ruleName]) => !sharedRuleNames.has(normalizeRuleName(ruleName))
        )
    );

    return { jsPlugins: localOverlay.jsPlugins, rules: addedRules };
};
