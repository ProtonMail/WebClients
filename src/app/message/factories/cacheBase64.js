/* @ngInject */
function cacheBase64($cacheFactory, dispatchers) {
    const cache = $cacheFactory('base64');
    const { on } = dispatchers();

    on('logout', cache.removeAll);

    return cache;
}
export default cacheBase64;
