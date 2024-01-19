import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';

export const getSupportedEntry = () => {
    return require.resolve('@proton/shared/lib/supported/supported.ts');
};

export const getIndexChunks = (target: string) => {
    return ['pre', target, 'unsupported'];
};

export const getEntries = () => {
    return {
        // The order is important. The pre.js listens to index.js, and supported.js file sets a global variable that is used by unsupported.js to detect if the main bundle could be parsed.
        pre: [require.resolve('@proton/shared/lib/supported/pre.ts')],
        index: [path.resolve('./src/app/index.tsx'), getSupportedEntry()],
        unsupported: [require.resolve('@proton/shared/lib/supported/unsupported.ts')],
    };
};

export const mergeEntry = (originalEntry: any, entry: any) => {
    const { pre, ...rest } = originalEntry;
    return {
        pre,
        ...entry,
        ...rest,
    };
};

export const addDevEntry = (config: any) => {
    if (config.mode === 'production') {
        return;
    }
    // @ts-ignore
    config.entry.dev = [require.resolve('@proton/components/containers/app/StandaloneApp.tsx')];
    config.plugins.push(
        new HtmlWebpackPlugin({
            filename: 'login.html',
            templateContent: `<html><body><div class="app-root"></div></body></html>`,
            chunks: ['dev'],
            inject: 'body',
        })
    );
    // @ts-ignore
    config.devServer.historyApiFallback.rewrites = config.devServer.historyApiFallback.rewrites || [];
    // @ts-ignore
    config.devServer.historyApiFallback.rewrites.push({
        from: '/login',
        to: '/login.html',
    });
};
