//@ts-check
import json from '@eslint/json';
import customRules from 'eslint-plugin-custom-rules';
import { defineConfig } from 'eslint/config';

export default defineConfig({
    name: 'package-json',
    files: ['**/package.json'],
    ignores: ['**/node_modules/**'],
    plugins: {
        json,
        'custom-rules': customRules,
    },
    language: 'json/json',
    rules: {
        'custom-rules/no-nested-packages': [
            'error',
            {
                allowedPaths: [
                    'applications/lumo/src/app/lib/lumo-api-client',
                    'applications/pass-desktop/native',
                    'packages/pass/docs/starlight',
                    'packages/wasm/andromeda',
                    'tests/packages/gmail-token',
                ],
            },
        ],
    },
});
