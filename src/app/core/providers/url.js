angular.module('proton.core')
    .provider('url', function urlProvider() {
        // Set base url from grunt config
        let base;

        this.setBaseUrl = function (newUrl) {
            base = newUrl;
        };

        this.$get = function () {
            return {
                get() {
                    return base;
                },
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
                build(key) {
                    return (...path) => this.get() + [`/${key}`].concat(path).join('/');
                }
            };
        };
    });
