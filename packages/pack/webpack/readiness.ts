import type { IncomingMessage, ServerResponse } from 'http';
import type { Configuration } from 'webpack';

/** Lightweight health-check path used by local-sso HAProxy (see utilities/local-sso/local.cfg). */
const READINESS_PATH = '/__ready';

type SetupMiddlewares = NonNullable<Configuration['devServer']>['setupMiddlewares'];

/**
 * Returns 503 until the first webpack compile finishes, then 200.
 * Errors do not block readiness: a failed first compile should still route to the
 * local dev server so the overlay is visible, not silently fall back to remote *_api.
 * Avoids holding HAProxy health-check connections open through a full app bundle build.
 */
export const getReadinessSetupMiddlewares = (): SetupMiddlewares => {
    return (middlewares, devServer) => {
        let isReady = false;

        const { compiler } = devServer;
        if (!compiler) {
            throw new Error('webpack-dev-server compiler is required for /__ready');
        }

        compiler.hooks.done.tap('ProtonPackReadiness', () => {
            isReady = true;
        });

        middlewares.unshift({
            name: 'proton-pack-readiness',
            path: READINESS_PATH,
            middleware: (_req: IncomingMessage, res: ServerResponse) => {
                res.statusCode = isReady ? 200 : 503;
                res.end(isReady ? 'ok' : 'not ready');
            },
        });

        return middlewares;
    };
};
