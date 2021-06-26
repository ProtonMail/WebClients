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
        '@babel/runtime/package.json'
        // Ensure that the correct package is used when symlinking
    ].reduce((acc, key) => {
        return { ...acc, [key]: path.dirname(require.resolve(key)) };
    }, {});

    return {
        ...standard,
        // Custom alias as we're building for the web (mimemessage)
        iconv: path.dirname(require.resolve('iconv-lite'))
    };
};

module.exports = getAlias;
