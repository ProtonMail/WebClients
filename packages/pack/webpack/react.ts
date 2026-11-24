import fs from 'fs';
import path from 'path';
import type { Configuration } from 'webpack';

// React, and the libraries installed once per React version that both the app and shared packages import: two copies
// of react-router mean two router contexts, two copies of Unleash a flag provider the app's hooks can't see, and two
// copies of Redux Toolkit a bigger bundle. Tests need a few more, see packages/vitest-config/src/react.ts.
const REACT_LIBRARIES = [
    'react',
    'react-dom',
    'react-router',
    'react-router-dom',
    '@unleash/proxy-client-react',
    '@reduxjs/toolkit',
];

/**
 * For an app on the `react19` catalog, spread into its `resolve`, passing the folder of its webpack config. One React
 * per bundle, the app's: shared packages otherwise resolve their own copy of React and of these libraries, which
 * differ from the app's.
 */
export const getReactResolve = (appDir: string): Pick<NonNullable<Configuration['resolve']>, 'alias'> => ({
    alias: Object.fromEntries(
        REACT_LIBRARIES.map((name) => {
            // nosemgrep: path-join-resolve-traversal -- the app's own folder and a fixed package name, not user input
            const link = path.join(appDir, 'node_modules', name);
            // Without the app's own link, shared code would keep its own copy and a second React or context
            if (!fs.existsSync(link)) {
                throw new Error(`${name} isn't installed in ${appDir}: an app on the react19 catalog must declare it`);
            }
            return [name, fs.realpathSync(link)];
        })
    ),
});
