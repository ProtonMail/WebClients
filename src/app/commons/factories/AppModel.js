/* @ngInject */
function AppModel($rootScope) {
    const MODEL = {};
    const dispatch = (type, data = {}) => $rootScope.$emit('AppModel', { type, data });

    const set = (key = '', value) => {
        const previous = MODEL[key];
        MODEL[key] = value;
        previous !== value && dispatch(key, { value });
    };
    const is = (key = '') => !!MODEL[key];
    const get = (key = '') => MODEL[key];
    const store = (key = '', value) => (MODEL[key] = value);

    return { is, set, store, get };
}
export default AppModel;
