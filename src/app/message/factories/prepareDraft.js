/* @ngInject */
function prepareDraft(addressesModel, authentication, dispatchers, messageBuilder) {
    const { on } = dispatchers();
    const CACHE = {};

    /**
     * Store the promise to prepare the draft
     * @param {Promise} promise to prepare the draft
     */
    const store = (promise) => (CACHE.messagePrepared = promise);

    /**
     * Clear promise cached
     */
    const clear = () => delete CACHE.messagePrepared;

    /**
     * Prepare the default draft for the composer
     * Called each time we store the addresses: addressesModel.set()
     * @return {Promise}
     */
    const init = () => {
        const promise = messageBuilder
            .create('new')
            .then((message) => {
                const { ID } = addressesModel.getFirst();
                const publicKeys = authentication.getPublicKeys(ID)[0];

                return message.encryptBody(publicKeys.armor()).then(() => message);
            })
            .catch((err) => {
                clear();
                throw err;
            });

        store(promise);

        return promise;
    };

    /**
     * Return prepare draft promise
     * @return {Promise}
     */
    const get = () => {
        if (CACHE.messagePrepared) {
            return CACHE.messagePrepared;
        }

        return init();
    };

    on('logout', () => {
        clear();
    });

    on('prepareDraft', (e, { type }) => {
        if (type === 'init') {
            init();
        }
    });

    return { init, get };
}
export default prepareDraft;
