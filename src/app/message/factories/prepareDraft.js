/* @ngInject */
function prepareDraft(addressesModel, keysModel, dispatchers, messageBuilder, messageModel) {
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
     * Get prepared body
     * @return {Promise<String>}
     */
    const getBody = async () => {
        const { Body } = await CACHE.messagePrepared;
        return Body;
    };

    /**
     * Prepare the default draft for the composer
     * Called each time we store the addresses: addressesModel.set()
     * @return {Promise}
     */
    const init = () => {
        const { active = [] } = addressesModel.getActive();

        // Key can be missing if the member didn't yet created the key
        if (!active.length) {
            return Promise.resolve();
        }

        const [{ ID }] = active;
        const [publicKeys] = keysModel.getPublicKeys(ID);
        const promise = messageBuilder
            .create('new')
            .then((message) => message.encryptBody(publicKeys.armor()).then(() => message))
            .catch((err) => {
                clear();
                throw err;
            });

        store(promise);

        return promise;
    };

    /**
     * Return prepare draft promise
     * @param {Object} message
     * @return {Promise} messageModel
     */
    const getMessage = async (message = messageModel()) => {
        if (message.isPGPMIME()) {
            return message;
        }

        if (CACHE.messagePrepared) {
            // Make sure to return a messageModel Object
            return messageModel({ Body: await getBody(), ...message }); // If the message.Body is defined, we have to keep it.
        }

        return init();
    };

    on('logout', () => {
        clear();
    });

    on('keysModel', (e, { type }) => {
        if (type === 'updated') {
            init();
        }
    });

    return { init, getMessage };
}
export default prepareDraft;
