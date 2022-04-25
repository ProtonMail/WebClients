const path = require('path');

module.exports = {
    entry: './tool/tool.ts',
    stats: 'minimal',
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.ts?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                    options: { configFile: 'tsconfig.tool.json' },
                },
            },
        ],
    },
    resolve: {
        extensions: ['.ts'],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'tool'),
    },
};
