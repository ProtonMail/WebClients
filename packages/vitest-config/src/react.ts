import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ViteUserConfig } from 'vitest/config';

// React and the libraries built against it that tests must load from the app: shared packages otherwise resolve their
// own copy, which differs from the app's on the `react19` catalog. On top of the build's list (see
// packages/pack/webpack/react.ts), @testing-library/react renders with its own react-dom, and react-redux, which Node
// loads from node_modules, requires the React installed next to it.
const REACT_LIBRARIES = [
    'react',
    'react-dom',
    'react-router',
    'react-router-dom',
    '@unleash/proxy-client-react',
    '@reduxjs/toolkit',
    '@testing-library/react',
    'react-redux',
];

/**
 * For an app on the `react19` catalog, passing the folder of its vitest config: one React per test run, the app's.
 * vite resolves these imports from the project root instead of next to the importing file, so shared code gets the
 * app's copies, and the React those require(). The root defaults to the working directory, so tests must run from the
 * app's folder, as `pnpm --filter` does.
 */
export const getReactTestResolve = (appDir: string): NonNullable<ViteUserConfig['resolve']> => {
    for (const name of REACT_LIBRARIES) {
        // nosemgrep: path-join-resolve-traversal -- the app's own folder and a fixed package name, not user input
        if (!existsSync(join(appDir, 'node_modules', name))) {
            // Without the app's own link, shared code would keep its own copy and a second React or context
            throw new Error(`${name} isn't installed in ${appDir}: an app on the react19 catalog must declare it`);
        }
    }
    return { dedupe: REACT_LIBRARIES };
};
