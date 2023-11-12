import webpack from 'webpack';

import getConfig from '@proton/pack/webpack.config';

const result = (env: any): webpack.Configuration => {
    const result = getConfig(env);

    result.plugins?.push(
        new webpack.DefinePlugin({
            ENV: JSON.stringify(process.env.NODE_ENV ?? 'development'),
        })
    );
    return result;
};

export default result;
