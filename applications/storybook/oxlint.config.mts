import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';

export default createOxlintConfig({
    ignorePatterns: ['storybook-static/**'],
    overrides: [
        {
            // Same rules as `eslint-plugin-storybook`'s `flat/recommended`, which runs as an ESLint plugin in oxlint.
            files: ['**/*.stories.{ts,tsx,js,jsx,mjs,cjs}', '**/*.story.{ts,tsx,js,jsx,mjs,cjs}'],
            jsPlugins: ['eslint-plugin-storybook'],
            rules: {
                // Stories declare hooks in anonymous `render` functions.
                'react/rules-of-hooks': 'off',
                'storybook/await-interactions': 'error',
                'storybook/context-in-play-function': 'error',
                'storybook/default-exports': 'error',
                'storybook/hierarchy-separator': 'warn',
                'storybook/no-redundant-story-name': 'warn',
                'storybook/no-renderer-packages': 'error',
                'storybook/prefer-pascal-case': 'warn',
                'storybook/story-exports': 'error',
                'storybook/use-storybook-expect': 'error',
                'storybook/use-storybook-testing-library': 'error',
            },
        },
    ],
});
