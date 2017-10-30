angular.module('proton.commons')
    .factory('networkUtils', (CONSTANTS) => {

        const { CANCEL_REQUEST } = CONSTANTS;

        /**
         * Check if the request is a self closed request
         * Ex: we kill the previous request
         * @param  {Object} options.config
         * @return {Boolean}
         */
        const isCancelledRequest = ({ config = {} } = {}) => {
            const { value } = (config.timeout || {}).$$state || {};
            return value === CANCEL_REQUEST;
        };

        return {
            isCancelledRequest
        };
    });
