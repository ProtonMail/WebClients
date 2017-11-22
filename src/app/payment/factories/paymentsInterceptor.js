angular.module('proton.payment')
    .factory('paymentsInterceptor', () => {
        return {
            request(config = {}) {
                if (/\/payments\//.test(config.url)) {
                    config.headers['x-pm-apiversion'] = 3;
                }

                return config;
            }
        };
    });
