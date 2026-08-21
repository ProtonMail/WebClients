import { defineConfig } from 'eslint/config';

import config from '@proton/eslint-config-proton/all';
import { createBarrelConfig } from '@proton/eslint-config-proton/barrel';

export default defineConfig([
    config,
    createBarrelConfig(),
    {
        rules: {
            // The design library sits below @proton/components and must never reach up into the
            // framework UI, the engine, or any product code — that is what keeps it pure presentation
            // and reusable by Lumo and any other product (strategy doc §2).
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['@proton/components', '@proton/components/*'],
                            message: '@proton/lumo-ui must stay below @proton/components — pure presentation only.',
                        },
                        {
                            group: ['@proton/llm', '@proton/llm/*'],
                            message: '@proton/lumo-ui must not depend on the agent engine or any product code.',
                        },
                    ],
                },
            ],
        },
    },
]);
