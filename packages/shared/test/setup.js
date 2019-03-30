import { init } from 'pmcrypto';
import * as openpgp from 'openpgp';

init(openpgp);

function AbortController() {
    return {
        abort: () => {}
    };
}
global.AbortController = AbortController;
