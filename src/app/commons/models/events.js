/* @ngInject */
function Events($http, url) {
    const headers = { 'x-pm-apiversion': 3 };
    const requestURL = url.build('events');
    const get = (id) => $http.get(requestURL(id), { headers });
    const getLatestID = () => $http.get(requestURL('latest'), { headers });

    return { get, getLatestID };
}
export default Events;
