import config from '@proton/eslint-config-proton/all';

export default defineConfig([
    config,
    {
        rules: {
            'jsx-a11y/prefer-tag-over-role': 'off',
        },
    },
]);
