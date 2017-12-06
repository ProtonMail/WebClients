/* @ngInject */
function paymentModalModel() {
    let cache;
    const get = () => cache;
    const set = (data = {}) => (cache = data);
    const clear = () => (cache = {});
    return { get, set, clear };
}
export default paymentModalModel;
