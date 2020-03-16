const { sync } = require('./cli');

const getBuildCommit = () => {
    try {
        const { stdout = '' } = sync('git rev-parse HEAD');
        return stdout.trim();
    } catch (e) {
        return '';
    }
};

/**
 * Generate the DSN
 * Compat mode if you still use an old env
 * @todo  remove in a few weeks
 * @param  {String} options.prod Sentry DSN URL
 * @return {String}
 */
const getSentryDSN = ({ prod = '' }) => {
    if (prod.includes('@sentry')) {
        return prod;
    }

    return prod.replace(/@((mail|account).+\/)\d+/, (all, match) => all.replace(match, 'sentry/'));
};

/**
 * Get correct sentry UR/releaseL config for the current env
 * release can be undefined if we don't have a release available
 * - on dev it's based on the API you specify
 * - on deploy it's based on the branch name
 * @return {Object}
 */
function getSentryConfig({ sentry = {} }, api) {
    if (api === 'blue' || (process.env.NODE_ENV !== 'production' && api !== 'proxy')) {
        return {};
    }

    return { SENTRY_DSN: getSentryDSN(sentry), COMMIT_RELEASE: getBuildCommit() };
}

module.exports = getSentryConfig;
