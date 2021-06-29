const path = require('path');

const getAlias = () => {
    const standard = [
        'react',
        'react-dom',
        'react-router',
        'react-router-dom',
        'react-refresh',
        '@proton/styles/package.json',
        '@proton/components',
        'ttag',
        'date-fns',
        'proton-translations/package.json',
        '@babel/runtime/package.json',
    ].reduce((acc, key) => {
        // Resolve with precedence from cwd
        return {
            ...acc,
            [key.replace('/package.json', '')]: path.dirname(require.resolve(key, { paths: [process.cwd()] })),
        };
    }, {});

    return {
        ...standard,
        // Custom alias as we're building for the web (mimemessage)
        iconv: path.dirname(require.resolve('iconv-lite', { paths: [process.cwd()] })),
    };
};

module.exports = getAlias;
