const path = require('path');
const tar = require('tar');

const { success, warn, info, debug } = require('./helpers/log')('proton-i18n');
const { bash, curl } = require('./helpers/cli');
const { hasDirectory } = require('./helpers/file');
const websiteLocaleFormator = require('./formators/website');
const { getPackageApp, getEnv, isClientV4, isBetaAngularV4, isWebsite } = require('../config');

const { name: APP_NAME, config: { publicPathFlag } = {} } = getPackageApp();
const { I18N_DEPENDENCY_REPO, I18N_DEPENDENCY_BRANCH } = getEnv();
const OUTPUT_CLONE = path.join('node_modules', 'proton-translations');

/**
 * Compat HASHES MAP for translations as we version.json doesn't log the version yet.
 * @type {Object}
 */
const COMPAT_HASHES_MAP = {
    'protonmail-web': '59ec715f9100b4412917e0a86c745adb272fff86',
    'protonmail-web-v4': 'aac2baaadd06b04fea46c5e330adf62834162679',
    'proton-calendar': '49efd660fb00f0d5077e64b6d4c746443e7c8ab2',
    'proton-contacts': '2c7f0fb2349d87aa38a32a4c764f9009c400691f',
    'proton-mail-settings': 'c21c22834aed6a56240ab329b50aefad5fa653da'
};

const getAppEnvInfo = () => {
    if (isBetaAngularV4()) {
        return { compatAppName: `${APP_NAME}-v4` };
    }

    const [, scopeUrl = ''] = publicPathFlag.split('=');
    return { compatAppName: APP_NAME, scopeUrl };
};

/**
 * Get deployed config for a project
 * we look for the version.json so we can extract the correct HASH
 * @return {Object}
 */
const getConfigApp = () => {
    const versionUrl = 'https://mail.protonmail.com/assets/version.json';

    if (!isClientV4()) {
        return { compatAppName: APP_NAME, versionUrl };
    }

    const { scopeUrl, compatAppName } = getAppEnvInfo();
    const newUrl = scopeUrl ? versionUrl.replace('/assets', `${scopeUrl}assets`) : versionUrl;
    return { compatAppName, versionUrl: newUrl.replace('mail.', 'beta.') };
};

/**
 * We load locales from what's available live
 * We download files for a commit and we extract it inside proton-translations
 */
async function getDeployedLocales() {
    const falseError = (e) => {
        warn(`we failed to get the latest version: ${e.message}`, false);
        info('it will not break the application but no locales are going to be available', false);
    };

    try {
        let hasError = false;

        const { compatAppName, versionUrl } = getConfigApp();

        debug({ compatAppName, versionUrl }, 'app config version');

        const { stdout } = await curl(versionUrl);
        const { locales = COMPAT_HASHES_MAP[compatAppName], buildDate, version } = JSON.parse(stdout || '');

        info(`installing locales: ${version} from ${new Date(buildDate)}`, false);

        curl(`https://api.github.com/repos/ProtonMail/proton-translations/tarball/${locales}`, ['-L'], {
            encoding: null
        })
            .stdout.pipe(
                tar.x({
                    strip: 1,
                    C: OUTPUT_CLONE // alias for cwd:'some-dir', also ok
                })
            )
            .on('error', (e) => {
                hasError = true;
                falseError(e);
            })
            .on('end', () => {
                console.log();
                !hasError && success(`installed latest translations available live for ${compatAppName}`);
            });
    } catch (e) {
        falseError(e);
    }
}

/**
 * We can "extend" the locales, ex for a branch as we might be more up-to-date than
 * default locales
 * @return {Promise}
 */
async function formatCustom() {
    isWebsite() && (await websiteLocaleFormator(OUTPUT_CLONE));
}

async function main() {
    if (!I18N_DEPENDENCY_REPO || !I18N_DEPENDENCY_BRANCH) {
        const warningSpaces = false;
        console.log();
        await hasDirectory(OUTPUT_CLONE, true, { warningSpaces });
        warn(
            'you need the variable I18N_DEPENDENCY_REPO + I18N_DEPENDENCY_BRANCH available inside env to install translations',
            warningSpaces
        );
        console.log();
        info('we will try to load the locales from the version available live', false);
        return getDeployedLocales();
    }

    const commands = [
        `rm -rf ${OUTPUT_CLONE} || echo`,
        `git clone ${I18N_DEPENDENCY_REPO} --depth 1 --branch ${I18N_DEPENDENCY_BRANCH} ${OUTPUT_CLONE}`,
        `cd ${OUTPUT_CLONE} && git log --format="%H" -n 1 > .version && cd -`,
        `rm -rf ${path.join(OUTPUT_CLONE, '.git')}`
    ].join(' && ');

    await bash(commands);
    success(`added translations inside ${OUTPUT_CLONE}`);

    return formatCustom();
}

module.exports = main;
