import './setup';

const testsContext = require.context('.', true, /.spec.(js|tsx?)$/);
testsContext.keys().forEach(testsContext);
