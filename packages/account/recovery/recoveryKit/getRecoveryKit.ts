export const getRecoveryKit = async () => {
    // Note: This chunkName is important as it's used in the chunk plugin to avoid splitting it into multiple files
    return import(/* webpackChunkName: "recovery-kit" */ '@proton/recovery-kit');
};
