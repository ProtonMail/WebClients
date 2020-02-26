const apiCrowdin = require('./helpers/apiCrowdin');
const { success } = require('./helpers/log')('proton-i18n');
const { getEnv } = require('../config');

/**
 * Update latest translations to crowdin
 */
async function update() {
    if (getEnv().IS_DRY_RUN) {
        return;
    }
    const { success: isSuccess, type } = await apiCrowdin.upload();

    if (isSuccess && type === 'update') {
        success('Update crowdin with latest template');
    }

    if (isSuccess && type === 'create') {
        success('Create new template on crowdin');
    }
}

module.exports = { update };
