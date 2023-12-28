import { Configuration } from 'webpack';

import getConfig from '@proton/pack/webpack.config';
import { addDevEntry } from '@proton/pack/webpack/entries';

const result = (env: any): Configuration => {
    const config = getConfig(env);
    if (env.appMode === 'standalone') {
        addDevEntry(config);
    }
    return config;
};

export default result;
