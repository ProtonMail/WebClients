const { JEST_MAX_WORKERS, JEST_WORKER_IDLE_MEMORY_LIMIT, JEST_CACHE_DIRECTORY, COLLECT_COVERAGE } = process.env;

module.exports = {
    collectCoverage: COLLECT_COVERAGE === 'true',
    ...(JEST_MAX_WORKERS ? { maxWorkers: JEST_MAX_WORKERS } : {}),
    // Only set when the env var is present: any value here, even a generous one, stops jest
    // from running tests in the main process, so an unconditional default would cost every
    // small package a worker spawn.
    ...(JEST_WORKER_IDLE_MEMORY_LIMIT ? { workerIdleMemoryLimit: JEST_WORKER_IDLE_MEMORY_LIMIT } : {}),
    ...(JEST_CACHE_DIRECTORY ? { cacheDirectory: JEST_CACHE_DIRECTORY } : {}),
    transform: {
        '^.+\\.(ts|js|mjs)x?$': [
            require.resolve('@swc/jest'),
            {
                jsc: {
                    transform: {
                        react: {
                            runtime: 'automatic',
                        },
                    },
                    parser: {
                        jsx: true,
                        syntax: 'typescript',
                        tsx: true,
                    },
                },
                env: {
                    /**
                     * Tests run on Node, not in the browsers we ship to: compile for the running Node version.
                     * Without targets, swc falls back to old browser targets, downlevels every module (object
                     * spread, async, classes) and requires dozens of core-js polyfills per file.
                     */
                    targets: { node: process.versions.node },
                    /* polyfill what Node still lacks, e.g. typed-array base64 and hex functions */
                    mode: 'usage',
                    shippedProposals: true,
                    coreJs: require('core-js/package.json').version,
                },
            },
        ],
    },
};
