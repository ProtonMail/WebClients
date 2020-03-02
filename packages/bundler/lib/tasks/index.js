const { getHooks } = require('../config');
const bundleProcess = require('./bundle');
const deployProcess = require('./deploy');

function getTasks({
    PKG,
    argv,
    config: { branch, flowType = 'single', appMode, isRemoteBuild, featureFlags, isDeployGit, isOnlyDeployGit }
}) {
    const { getCustomHooks, customTasks } = getHooks();
    const { hookPreTasks, hookPostTasks, hookPostTaskClone, hookPostTaskBuild, customConfigSetup } = getCustomHooks(
        customTasks({
            branch,
            flowType,
            appMode,
            isRemoteBuild,
            featureFlags
        })
    );

    if (isOnlyDeployGit) {
        return deployProcess({ branch, argv, hookPostTaskClone });
    }

    const list = bundleProcess({
        argv,
        config: {
            appMode,
            isRemoteBuild,
            PKG
        },
        customConfigSetup,
        hookPreTasks,
        hookPostTaskBuild,
        hookPostTasks
    });

    if (isDeployGit) {
        return list.concat(deployProcess({ branch, argv, hookPostTaskClone }));
    }

    return list;
}

module.exports = getTasks;
