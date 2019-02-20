/* @ngInject */
function composerRequestModel() {
    const CHAINS_MAP = Object.create(null);
    const getKey = ({ uid }) => `key.${uid}`;
    const clear = (message) => delete CHAINS_MAP[getKey(message)];

    const add = (message, callback) => {
        const key = getKey(message);

        CHAINS_MAP[key] = CHAINS_MAP[key] || Promise.resolve();

        return (CHAINS_MAP[key] = CHAINS_MAP[key].then(callback).catch((error) => {
            clear(message);
            throw error;
        }));
    };

    const chain = (message) => {
        const key = getKey(message);
        return CHAINS_MAP[key] || Promise.resolve();
    };

    return { add, clear, chain };
}
export default composerRequestModel;
