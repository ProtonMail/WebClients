import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { createBarrelConfig } from '@proton/eslint-config-proton/barrel';

export default defineConfig([defaultConfig, createBarrelConfig()]);
