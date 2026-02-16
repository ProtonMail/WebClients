import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { atomsPackage, componentsPackage, createBarrelConfig, iconsPackage } from '@proton/eslint-config-proton/barrel';

export default defineConfig([
    defaultConfig,
    createBarrelConfig({ packages: [atomsPackage, iconsPackage, componentsPackage] }),
    {
        rules: {
            'react-hooks/exhaustive-deps': 'error',
            'no-restricted-syntax': [
                'error',
                {
                    selector: "VariableDeclarator[id.type='ObjectPattern'][init.name=/^[A-Z_]+$/]",
                    message:
                        'Destructuring of enum-like constants is not allowed. Use CONSTANT.PROPERTY instead to maintain code readability.',
                },
            ],
        },
    },
]);
