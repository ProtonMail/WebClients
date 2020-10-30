const path = require('path');

const getAlias = () => {
    const standard = [
        'react',
        'react-dom',
        'react-router',
        'react-router-dom',
        'react-refresh',
        'pmcrypto',
        'design-system',
        'react-components',
        'ttag',
        'date-fns',
        'proton-translations',
        '@babel/runtime'
        // Ensure that the correct package is used when symlinking
    ].reduce((acc, key) => ({ ...acc, [key]: path.resolve(`./node_modules/${key}`) }), {});

    return {
        ...standard,
        // Custom alias as we're building for the web (mimemessage)
        iconv: 'iconv-lite'
    };
};

module.exports = getAlias;
