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

async function checkStatusExport() {
    const { stdout = '' } = await curl(getURL('export-status', 'json'));
    debug(stdout, 'Check status export');
    return JSON.parse(stdout);
}

async function createExport() {
    const request = curl(getURL('export'));

    // In can take a lot of time
    setTimeout(() => {
        console.log('Cancel request');
        request.cancel();
    }, 5000);

    try {
        await request;
    } catch (error) {
        if (!error.isCanceled) {
            throw error;
        }
    }
}

async function download() {
    const { stdout } = await curl(getURL('download/all.zip'), {}, { encoding: null });
    return stdout;
}

async function getStatus() {
    const { stdout = '' } = await curl(getURL('status', 'json'));
    debug(stdout, 'get status ouput');
    return JSON.parse(stdout);
}

async function getTopMember() {
    const { stdout = '' } = await curl(getURL('reports/top-members/export', 'format=csv&json'));
    debug(stdout, 'hash export top-members');
    const { hash, success } = JSON.parse(stdout);

    if (success) {
        const { stdout } = await curl(getURL('reports/top-members/download', `hash=${hash}`));
        debug(stdout, 'CSV export top-members');
        return stdout;
    }

    warn('export top-members is not available for now');
}

module.exports = {
    upload,
    download,
    getStatus,
    createExport,
    getTopMember,
    checkStatusExport
};
