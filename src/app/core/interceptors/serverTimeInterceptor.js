/* @ngInject */
function serverTimeInterceptor(pmcw) {
    const handleResponse = (result) => {
        const dateHeader = result.headers('date');
        const serverTime = new Date(dateHeader);
        if (dateHeader !== null && !isNaN(+serverTime)) {
            pmcw.updateServerTime(serverTime);
        }
        return result;
    };
    return {
        response: handleResponse
    };
}
export default serverTimeInterceptor;
