import type { Configuration } from 'webpack';

import { type WebpackEnvArguments, getWebpackOptions } from '@proton/pack/lib/config';
import { getConfig } from '@proton/pack/webpack.config';

import appConfig from './appConfig';

const result = (opts: WebpackEnvArguments): Configuration => {
    const webpackOptions = getWebpackOptions(opts, { appConfig });

    return getConfig({
        ...webpackOptions,
        browserslist: webpackOptions.isProduction
            ? '>0.1%, IE 11, Firefox ESR, Safari 10, Chrome 50'
            : webpackOptions.browserslist,
    });
};

export default result;
