/* @ngInject */
function paymentsInterceptor() {
    return {
        request(config = {}) {
            if (/\/payments\//.test(config.url)) {
                config.headers['x-pm-apiversion'] = 3;
            }

            return config;
        }
    };
}
export default paymentsInterceptor;
