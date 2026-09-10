const { JEST_MAX_WORKERS, JEST_WORKER_IDLE_MEMORY_LIMIT } = process.env;

module.exports = {
    ...(JEST_MAX_WORKERS ? { maxWorkers: JEST_MAX_WORKERS } : {}),
    // Only set when the env var is present: any value here, even a generous one, stops jest
    // from running tests in the main process, so an unconditional default would cost every
    // small package a worker spawn.
    ...(JEST_WORKER_IDLE_MEMORY_LIMIT ? { workerIdleMemoryLimit: JEST_WORKER_IDLE_MEMORY_LIMIT } : {}),
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
                    /* polyfill typed-array base64 and hex functions */
                    mode: 'usage',
                    shippedProposals: true,
                    coreJs: require('core-js/package.json').version,
                },
            },
        ],
    },
};
