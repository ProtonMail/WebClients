/* @ngInject */
function composerRequestModel() {
    const MAP_REQUEST = {};

    /**
     * Get the list of requests for a composer
     * @param  {Number} uid
     * @return {Array}
     */
    const read = (uid) => MAP_REQUEST[`key.${uid}`] || [];

    /**
     * Clear map for a message
     * @param  {Number} options.uid
     * @return {void}
     */
    const clear = ({ uid }) => {
        delete MAP_REQUEST[`key.${uid}`];
    };

    /**
     * Save a new pending request for a message
     * @param  {Message} message
     * @param  {Promise} promise
     * @return {void}
     */
    const save = (message, promise) => {
        const key = `key.${message.uid}`;

        MAP_REQUEST[key] = MAP_REQUEST[key] || [];
        MAP_REQUEST[key].push(promise);
    };

    /**
     * Resolve all the previous promises and allow chaining
     * @param  {Number}   options.uid
     * @return {Promise}
     */
    const chain = ({ uid }) => {
        const list = read(uid).map(({ promise }) => promise);
        return Promise.all(list);
    };

    return { save, clear, chain };
}
export default composerRequestModel;
