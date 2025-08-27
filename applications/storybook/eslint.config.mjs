import storybookConfig from 'eslint-plugin-storybook';
import { defineConfig, globalIgnores } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';

export default defineConfig(defaultConfig, storybookConfig.configs['flat/recommended'], globalIgnores(['.storybook']));
