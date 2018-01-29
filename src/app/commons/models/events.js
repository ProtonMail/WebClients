/* @ngInject */
function Events($http, url) {
    const requestURL = url.build('events');
    const get = (id) => $http.get(requestURL(id));
    const getLatestID = () => $http.get(requestURL('latest'));

    return { get, getLatestID };
}
export default Events;
