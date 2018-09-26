/* @ngInject */
function Events($http, url) {
    const requestURL = url.build('events');

    const get = (id, options) => $http.get(requestURL(id), options).then(({ data } = {}) => data);

    const getLatestID = (options) => $http.get(requestURL('latest'), options).then(({ data } = {}) => data.EventID);

    return { get, getLatestID };
}
export default Events;
