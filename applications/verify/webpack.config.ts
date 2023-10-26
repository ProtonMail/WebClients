import webpack from 'webpack';

import getConfig from '@proton/pack/webpack.config';

const result = (env: any): webpack.Configuration => {
    const result = getConfig(env);

    return {
        ...result,
        target:
            result.mode === 'production'
                ? 'browserslist:>0.1%, IE 11, Firefox ESR, Safari 10, Chrome 50'
                : result.target,
    };
};

export default result;
