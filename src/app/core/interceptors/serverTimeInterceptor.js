import { updateServerTime } from 'pmcrypto';

/* @ngInject */
function serverTimeInterceptor() {
    const handleResponse = (result) => {
        const dateHeader = result.headers('date');
        const serverTime = new Date(dateHeader);
        if (dateHeader !== null && !isNaN(+serverTime)) {
            updateServerTime(serverTime);
        }
        return result;
    };
    return {
        response: handleResponse
    };
}
export default serverTimeInterceptor;
