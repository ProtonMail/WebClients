import { CANCEL_REQUEST } from '../../constants';

/* @ngInject */
function networkUtils() {
    /**
     * Check if the request is a self closed request
     * Ex: we kill the previous request
     * @param  {Object} options.config
     * @return {Boolean}
     */
    const isCancelledRequest = ({ xhrStatus = '', config = {} } = {}) => {
        if (xhrStatus === 'abort') {
            return true;
        }
        const { value } = (config.timeout || {}).$$state || {};
        return value === CANCEL_REQUEST;
    };

    return {
        isCancelledRequest
    };
}
export default networkUtils;
