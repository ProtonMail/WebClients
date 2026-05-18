/**
 * Dynamic imports need to be manually included in the extension's SW via importScript.
 * This file keeps track of the node_modules that are dynamically imported.
 * The build script will trigger errors when it encounters new unhandled chunks.
 */

const chunkFilename = (chunkDesc: string) => `chunk.crypto-${chunkDesc}.js`;

const CRYPTO_CHUNKS: Record<string, string[]> = {
    [chunkFilename('nacl')]: ['node_modules_openpgp_dist_lightweight_nacl-fast_min_mjs'],
    [chunkFilename('pqc')]: ['node_modules_openpgp_dist_lightweight_noble_post_quantum_min_mjs'],
    [chunkFilename('noblehashes')]: ['node_modules_openpgp_dist_lightweight_noble_hashes_min_mjs'],
    [chunkFilename('noblecurves')]: ['node_modules_openpgp_dist_lightweight_noble_curves_min_mjs'],
    [chunkFilename('noblehashes_legacy')]: ['node_modules_protontech_crypto_node_modules_noble_hashes_legacy_js'],
    [chunkFilename('argon2')]: ['vendor_argon2id_loader_ts', 'node_modules_openpgp_dist_lightweight_argon2id_min_mjs'],
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
    'node_modules_x2js_x2js_js',
    'node_modules_jsmimeparser_index_js',
    'node_modules_openpgp_dist_lightweight_legacy_ciphers_min_mjs',
    'node_modules_openpgp_dist_lightweight_unbzip2-stream_min_mjs',
]);
