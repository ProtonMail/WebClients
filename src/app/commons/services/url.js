import CONFIG from '../../config';
/* @ngInject */
function url() {
    const make = (key, prefix = '') => (...path) => {
        const args = path.filter((item) => item === 0 || item);
        return [`${prefix}/${key}`.trim(), ...args].join('/');
    };

    const host = () => {
        const link = document.createElement('a');
        link.href = CONFIG.apiUrl;
        return link.host;
    };

    const get = () => CONFIG.apiUrl;

    /**
     * Factory to build urls for a scope
     *     ex:
     *         const getUrl = url.build('contact')
     *         getUrl(1) === xxx/contact/1
     *         getUrl(1, 2) === xxx/contact/1/2
     *         getUrl() === xxx/contact
     *
     * @param  {String} key Scope
     * @return {Function}
     */
    const build = (key) => make(key, get());

    return { get, make, build, host };
}

export default url;
