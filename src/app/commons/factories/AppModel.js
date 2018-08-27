/* @ngInject */
function AppModel(dispatchers) {
    const MODEL = {};
    const { dispatcher } = dispatchers(['AppModel']);
    /* eslint new-cap: "off" */
    const dispatch = (type, data = {}) => dispatcher.AppModel(type, data);

    const set = (key = '', value) => {
        const previous = MODEL[key];
        MODEL[key] = value;
        previous !== value && dispatch(key, { value });
    };
    const is = (key = '') => !!MODEL[key];
    const get = (key = '') => MODEL[key];
    const query = () => angular.copy(MODEL);
    const store = (key = '', value) => (MODEL[key] = value);

    return { is, set, store, get, query };
}
export default AppModel;
