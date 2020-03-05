import '@babel/polyfill';
import 'unfetch/polyfill/index'; // https://github.com/developit/unfetch/issues/101

import { check, redirect } from '../helpers/compat';

import '../sass/app.scss';
import { loadOpenpgp } from './loadOpenpgp';
import CONFIG from './config';

(async () => {
    if (!check()) {
        return redirect();
    }
    const [app] = await Promise.all([import('./app'), loadOpenpgp()]);
    app.default(CONFIG);
})();
