const TEST_FILES_GLOB = '**/*.{test,spec}.{js,ts,tsx,jsx}';

export default {
    packages: {
        glob: 'packages/*',
        directory: 'packages',
        globIgnore: [TEST_FILES_GLOB, '__mocks__'],
        alias: true,
        scope: '@proton',
        config: [
            {
                name: 'polyfill',
                glob: 'index.js',
            },
            {
                name: 'srp',
                glob: 'lib/**/*.{js,jsx,ts,tsx}',
            },
            {
                name: 'shared',
                glob: 'lib/**/*.{js,jsx,ts,tsx}',
            },
            {
                name: 'key-transparency',
                glob: 'lib/**/*.{js,jsx,ts,tsx}',
            },
            {
                name: 'encrypted-search',
                glob: 'lib/**/*.{js,jsx,ts,tsx}',
            },
            {
                name: 'crypto',
                glob: 'lib/**/*.{js,jsx,ts,tsx}',
            },
            {
                name: 'cross-storage',
                glob: '{lib,*-impl}/**/*.{js,jsx,ts,tsx}',
            },
            {
                name: 'atoms',
                glob: '**/*.{js,jsx,ts,tsx}',
            },
            {
                name: 'hooks',
                glob: '**/*.{js,jsx,ts,tsx}',
            },
            {
                name: 'utils',
                glob: '**/*.{js,jsx,ts,tsx}',
            },
            {
                name: 'colors',
                glob: '**/*.{js,jsx,ts,tsx}',
            },
            {
                name: 'components',
                glob: '{{components,containers,helpers,hooks}/**/*,index}.{js,jsx,ts,tsx}',
            },
            {
                name: 'encrypted-search',
                glob: 'lib/**/*.{js,jsx,ts,tsx}',
            },
            {
                name: 'activation',
                glob: '{src/**/*,index}.{js,jsx,ts,tsx}',
            },
            {
                name: 'sieve',
                glob: '{src/**/*,index}.{js,jsx,ts,tsx}',
            },
        ],
        ignore: ['pack', 'config', 'i18n', 'eslint-config-proton', 'stylelint-config-proton', 'styles', 'testing'],
    },

    applications: {
        glob: 'applications/*',
        directory: 'applications',
        globIgnore: [TEST_FILES_GLOB],
        sourcesGlob: 'src/app/**/*.{js,jsx,ts,tsx}',
        ignore: ['storybook', 'pass-extension', 'preview-sandbox', 'pdf-ui'],
    },
};
