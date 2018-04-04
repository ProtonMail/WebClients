/* @ngInject */
function serverTimeInterceptor(pmcw, $q) {
    const handleResponse = (result) => {
        const dateHeader = result.headers('date');
        const serverTime = new Date(dateHeader);
        if (dateHeader !== null && !isNaN(+serverTime)) {
            pmcw.updateServerTime(serverTime);
        }
        return result;
    };
    return {
        response: handleResponse,
        responseError: (result) => $q.reject(handleResponse(result))
    };
}
export default serverTimeInterceptor;
