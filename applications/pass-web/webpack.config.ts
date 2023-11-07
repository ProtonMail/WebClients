import webpack from 'webpack';

import getConfig from '@proton/pack/webpack.config';

const result = (env: any): webpack.Configuration => {
    const result = getConfig(env);
    return result;
};

export default result;
