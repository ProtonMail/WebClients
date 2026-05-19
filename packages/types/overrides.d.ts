// TODO: Import from @proton/shared
declare module 'ical.js';

declare module 'pm-srp';
declare module 'is-valid-domain';

// Used to replace Node bundled punycode library which is now deprecated
declare module 'punycode.js';

// date-fns CJS internals
declare module 'date-fns/_lib/format/formatters';
declare module 'date-fns/_lib/format/longFormatters';

// Untyped ESLint plugins (@proton/eslint-config-proton)
declare module 'eslint-plugin-jsx-a11y';
declare module 'eslint-plugin-lodash';
declare module 'eslint-plugin-monorepo-cop';
declare module 'eslint-plugin-no-only-tests';
declare module '@protontech/eslint-plugin-enforce-uint8array-arraybuffer';

// Untyped webpack plugins
declare module 'webpack-bundle-analyzer';
declare module 'circular-dependency-plugin';
