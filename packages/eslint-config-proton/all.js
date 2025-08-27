//@ts-check
import tseslint from 'typescript-eslint';

import base from './base.js';
import react from './react.js';

export default tseslint.config(base, react);
