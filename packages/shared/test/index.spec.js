import { init } from 'pmcrypto';
import * as openpgp from 'openpgp';

init(openpgp);

const testsContext = require.context('.', true, /.spec.(js|tsx?)$/);
testsContext.keys().forEach(testsContext);
