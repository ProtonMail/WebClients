/**
 * Dynamic imports need to be manually included in the extension's SW via importScript.
 * This file keeps track of the node_modules that are dynamically imported.
 * The build script will trigger errors when it encounters new unhandled chunks.
 */

const getCryptoChunkName = (chunkDesc: string) => `chunk.crypto-${chunkDesc}.js`;

export const CRYPTO_DYNAMIC_IMPORTS_CHUNKS_MAP: Record<string, string> = {
    vendor_argon2id_loader_ts: getCryptoChunkName('argon2'),
    'node_modules_openpgp_dist_lightweight_nacl-fast_min_mjs': getCryptoChunkName('nacl'),
    node_modules_openpgp_dist_lightweight_noble_post_quantum_min_mjs: getCryptoChunkName('pqc'),
    node_modules_openpgp_dist_lightweight_noble_hashes_min_mjs: getCryptoChunkName('noblehashes'),
    node_modules_openpgp_dist_lightweight_noble_curves_min_mjs: getCryptoChunkName('noblecurves'),
    node_modules_protontech_crypto_node_modules_noble_hashes_legacy_js: getCryptoChunkName('noblehashes_legacy'),
};

/** These are unused by the Pass extension and don't need to be manually handled */
export const IGNORED_DYNAMIC_IMPORTS_CHUNKS = new Set([
    'node_modules_x2js_x2js_js',
    'node_modules_jsmimeparser_index_js',
    'node_modules_openpgp_dist_lightweight_legacy_ciphers_min_mjs',
    'node_modules_openpgp_dist_lightweight_unbzip2-stream_min_mjs',
]);
