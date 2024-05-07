import webpack from 'webpack';

import getConfig from '@proton/pack/webpack.config';

const result = (env: any): webpack.Configuration => {
    const isProduction = process.env.NODE_ENV === 'production';
    return getConfig({
        ...env,
        browserslist: isProduction ? '>0.1%, IE 11, Firefox ESR, Safari 10, Chrome 50' : undefined,
    });
};

export default result;
