/* @ngInject */
function labelsModel(dispatchers, labelCache) {
    const { dispatcher, on } = dispatchers(['labelsModel']);

    const cache = labelCache((type, data = {}) => {
        dispatcher.labelsModel(type, data);
    });

    on('AppModel', (e, { type, data = {} }) => {
        type === 'loggedIn' && !data.value && cache.set();
    });

    return cache;
}

export default labelsModel;
