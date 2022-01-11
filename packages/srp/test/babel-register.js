const register = require('@babel/register').default;

register({
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    ignore: [/node_modules\/(?!(asmcrypto|pmcrypto))/],
});
