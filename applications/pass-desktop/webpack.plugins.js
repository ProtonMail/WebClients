const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { DefinePlugin } = require('webpack');

module.exports = [
    new DefinePlugin({
        ENV: JSON.stringify(process.env.NODE_ENV ?? 'development'),
        BUILD_TARGET: JSON.stringify('desktop'),
    }),
    new ForkTsCheckerWebpackPlugin({
        async: true,
        formatter: 'basic',
        issue: {
            include: (issue) => {
                const warningLogs = true;
                const errorLogs = true;

                if (warningLogs && issue.severity === 'warning') {
                    return true;
                }

                if (errorLogs && issue.severity === 'error') {
                    return true;
                }

                return false;
            },
        },
    }),
];
