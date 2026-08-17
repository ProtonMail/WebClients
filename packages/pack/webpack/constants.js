const BABEL_INCLUDE_NODE_MODULES = [
    '@protontech/crypto',
    'proton-mail',
    '@proton/pack',
    '@proton/shared',
    '@proton/sieve',
    '@sentry/core',
    '@floating-ui/utils',
    '@floating-ui/core',
    '@floating-ui/dom',
    '@proton/components',
    '@protontech/mutex-browser',
    '@protontech/interval-tree',
    '@proton/recovery-kit',
    'emoji-mart',
    'idb',
    '@protontech/bip39',
    '@reduxjs/toolkit',
    'react-redux',
    'reselect',
    'immer',
    '@scure/base',
];
const BABEL_EXCLUDE_FILES = ['mailparser.js'];

// Matches reveal.js's own dist output specifically (not any other package's .js/.css), so it can
// be pulled in as a raw string (asset/source) instead of being transpiled/bundled normally — Lumo
// embeds this text as inline <script>/<style> content inside a sandboxed artifact iframe rather
// than loading it as a real module or stylesheet in the app itself.
const REVEAL_JS_RAW_SOURCE = /reveal\.js[\\/]dist[\\/](reveal\.(js|css)|theme[\\/]simple\.css)$/;

module.exports = {
    BABEL_EXCLUDE_FILES,
    BABEL_INCLUDE_NODE_MODULES,
    REVEAL_JS_RAW_SOURCE,
};
