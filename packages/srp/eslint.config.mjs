import { defineConfig, globalIgnores } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/base';

export default defineConfig(defaultConfig, globalIgnores(['test/**/*data.js']));
