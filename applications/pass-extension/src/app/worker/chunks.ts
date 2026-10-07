/**
 * Dynamic imports need to be manually included in the extension's SW via importScript.
 * This file keeps track of the node_modules that are dynamically imported, by the path of the
 * chunk's root module (relative to its package, or to this app for local files).
 * The build script will trigger errors when it encounters new unhandled chunks.
 */

const chunkFilename = (chunkDesc: string) => `chunk.crypto-${chunkDesc}.js`;

const CRYPTO_CHUNKS: Record<string, string[]> = {
    [chunkFilename('nacl')]: ['@protontech/openpgp/dist/lightweight/nacl-fast.min.mjs'],
    [chunkFilename('pqc')]: ['@protontech/openpgp/dist/lightweight/noble_post_quantum.min.mjs'],
    [chunkFilename('noblehashes')]: ['@protontech/openpgp/dist/lightweight/noble_hashes.min.mjs'],
    [chunkFilename('noblecurves')]: ['@protontech/openpgp/dist/lightweight/noble_curves.min.mjs'],
    [chunkFilename('noblehashes_legacy')]: ['@noble/hashes/legacy.js'],
    [chunkFilename('argon2')]: ['vendor/argon2id.loader.ts', '@protontech/openpgp/dist/lightweight/argon2id.min.mjs'],
};

/** Dynamically imported crypto chunks that should
 * be registered during `importScripts` sequence */
export const CRYPTO_CHUNK_FILES = Object.keys(CRYPTO_CHUNKS);

/** Inverted map for webpack's `chunkFilename`  */
export const CRYPTO_DYNAMIC_IMPORTS_CHUNKS: Record<string, string> = Object.fromEntries(
    Object.entries(CRYPTO_CHUNKS).flatMap(([file, ids]) => ids.map((id) => [id, file]))
);

/** These are unused by the Pass extension and don't need to be manually handled */
export const IGNORED_DYNAMIC_IMPORTS_CHUNKS = new Set([
    'x2js/x2js.js',
    '@protontech/crypto/src/jsmimeparser/index.js',
    '@protontech/openpgp/dist/lightweight/legacy_ciphers.min.mjs',
    '@protontech/openpgp/dist/lightweight/unbzip2-stream.min.mjs',
]);
