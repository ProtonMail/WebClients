import { defineConfig } from 'eslint/config';

import { allGlobs } from './globs.js';

export default defineConfig({
    name: 'barrel-import-rules',
    files: allGlobs,
    rules: {
        'no-restricted-imports': [
            'warn',
            {
                paths: [
                    {
                        name: '@proton/atoms',
                        message: 'You should avoid barrel imports. Prefer full path imports.',
                    },
                    {
                        name: '@proton/components',
                        message: 'You should avoid barrel imports. Prefer full path imports.',
                    },
                    {
                        name: '@proton/icons',
                        message: 'You should avoid barrel imports. Prefer full path imports.',
                    },
                ],
            },
        ],
    },
});
