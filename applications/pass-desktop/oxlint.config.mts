import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import {
    createExtraneousDependenciesRule,
    extraneousDependenciesDevDependencies,
} from '@proton/oxlint-config/extraneousDependencies';
import { allGlobs } from '@proton/oxlint-config/globs';

/**
 * lint-staged runs the linter from the monorepo root with repo-relative file paths
 * (e.g. `applications/pass-desktop/src/lib/**`). Duplicate each package-local
 * glob so `proton/no-extraneous-dependencies` still allows electron there.
 */
const withLintStagedPaths = (patterns: string[]) => patterns.flatMap((pattern) => [pattern, `**/pass-desktop/${pattern}`]);

/** Main-process sources import electron (devDependency required by Electron Forge). Renderer `src/app/**` is excluded. */
const passDesktopMainProcessDevDependencies = withLintStagedPaths([
    'src/main.ts',
    'src/preload.ts',
    'src/types.ts',
    'src/lib/**',
    'src/utils/platform.ts',
    'src/utils/squirrel.ts',
    'src/menu-view/**',
    'src/uninstallers/**',
]);

/** Build/config entry points that import devDependencies. */
const passDesktopDevDependencies = [
    ...extraneousDependenciesDevDependencies,
    ...passDesktopMainProcessDevDependencies,
    ...withLintStagedPaths([
        'forge.config.ts',
        'webpack.main.config.ts',
        'webpack.renderer.config.ts',
        'webpack.plugins.ts',
        'webpack.options.ts',
        'webpack.rules.ts',
        'electron-builder.config.js',
        'prettier.config.mjs',
    ]),
];

export default createOxlintConfig({
    ignorePatterns: ['native/target/**'],
    overrides: [
        {
            files: allGlobs,
            rules: {
                'no-console': ['error', { allow: ['warn', 'error'] }],
                curly: ['error', 'multi-line'],
                'proton/no-extraneous-dependencies': createExtraneousDependenciesRule({
                    devDependencies: passDesktopDevDependencies,
                }),
            },
        },
    ],
});
