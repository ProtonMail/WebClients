const { curl } = require('./cli');
const { debug, warn } = require('./log')('proton-i18n');
const { getFiles, getCrowdin } = require('../../config');

const { KEY_API, FILE_NAME, PROJECT_NAME } = getCrowdin();
const { TEMPLATE_FILE_FULL } = getFiles();

const getURL = (scope, flag = '') => {
    const customFlag = flag ? `&${flag}` : '';
    return `https://api.crowdin.com/api/project/${PROJECT_NAME}/${scope}?key=${KEY_API}${customFlag}`.trim();
};

async function upload() {
    const file = {
        input: TEMPLATE_FILE_FULL,
        output: FILE_NAME
    };

    const { stdout } = await curl(getURL('update-file', 'json'), { file });
    debug(stdout, 'update file');
    const { success, error: { code } = {} } = JSON.parse(stdout);

    // File doesn't exist
    if (!success && code === 8) {
        warn('Cannot update it, we need to create it');
        const { stdout } = await curl(getURL('add-file', 'json'), { file });
        debug(stdout, 'Add file');
        const { success } = JSON.parse(stdout);
        return { success, type: 'create' };
    }
    return { success, type: 'update' };
}

module.exports = {
    upload
};
