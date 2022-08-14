import * as openpgp from 'openpgp';
import { init } from 'pmcrypto';

const staticRandom = new Uint32Array(255);
for (let i = 0; i < 255; ++i) {
    staticRandom[i] = i;
}

const mockRandomValues = (buf) => {
    for (let i = 0; i < buf.length; ++i) {
        // eslint-disable-next-line
        buf[i] = staticRandom[i];
    }
    return buf;
};

window.crypto.getRandomValues = mockRandomValues;

init(openpgp);

const testsContext = require.context('.', true, /.spec.(js|tsx?)$/);
testsContext.keys().forEach(testsContext);
