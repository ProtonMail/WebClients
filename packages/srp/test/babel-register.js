const register = require('@babel/register').default;

register({
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
    ignore: [/node_modules\/(?!(asmcrypto|pmcrypto|openpgp|@openpgp\/web-stream-tools|@openpgp\/asmcrypto.js))/],
});
