import { defineConfig, globalIgnores } from 'eslint/config';

import config from '@proton/eslint-config-proton/all';

export default defineConfig(config, globalIgnores(['src/background-blur-assets/**/*']));
