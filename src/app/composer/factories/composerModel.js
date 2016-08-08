angular.module('proton.composer')
  .factory('composerRequestModel', (Message) => {

    let MAP_REQUEST = {};

    /**
     * Get the list of requests for a composer
     * @param  {Number} key uid
     * @return {Array}
     */
    const read = (key) => MAP_REQUEST[`key.${key}`];

    /**
     * Get the list of pending requests for a composer
     * @param  {Number} message.uid
     * @return {Array}
     */
    const find = ({ uid }) => (read(uid) || []).filter(({ promise }) => $$state.status === 0);

    /**
     * Check if there are pendings request
     * @param  {Number} options.uid
     * @return {Boolean}
     */
    const has = ({ uid }) => Array.isArray(read(uid)) && read(uid).length;

    /**
     * Kill each pending requests
     * @param  {Number} uid
     * @return {void}
     */
    const kill = (uid) => {
        const list = read(uid) || [];
        list.length && list.forEach((promise) => promise.resolve()); // Kill them all !
    };

    /**
     * Clear map for a message
     * @param  {Number} options.uid
     * @return {void}
     */
    const clear = ({ uid }) => {
        kill(uid);
        delete MAP_REQUEST[`key.${uid}`];
    };

    /**
     * Save a new pending request for a message
     * @param  {Message} message
     * @param  {Promise} deferred
     * @return {void}
     */
    const save = (message, deferred) => {
        const key = `key.${message.uid}`;
        MAP_REQUEST[key] = MAP_REQUEST[key] || [];
        kill();
        MAP_REQUEST[key].push(deferred);
    };

    /**
     * Attach an action to trigger when a request is resolved
     * @param  {Number}   options.uid
     * @param  {Function} cb
     * @return {Array}               List of requests
     */
    const map = ({ uid }, cb) => (read(uid).forEach(p => p.promise.then(cb, cb)), read(uid));

    return { save, has, find, clear, map };
  });