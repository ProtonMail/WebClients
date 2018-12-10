import '../src/app/vendor';
import '../src/app/vendorLazy';
import '../src/app/vendorLazy2';
import '../node_modules/angular-mocks/angular-mocks';
import './setupPmcrypto';

const templates = require.context('../src/templates', true, /\.html$/);
templates.keys().forEach(templates);
