/* @ngInject */
function loggedOutSessions() {
    const CACHE = {};
    const addUID = (uid) => (CACHE[uid] = true);
    const hasUID = (uid) => !!CACHE[uid];

    return { addUID, hasUID };
}
export default loggedOutSessions;
