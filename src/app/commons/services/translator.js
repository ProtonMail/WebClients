/* @ngInject */
function translator($rootScope) {
    const callbacks = [];

    $rootScope.$on('gettextLanguageChanged', () => {
        callbacks.forEach((cb) => cb());
    });

    return (cb) => {
        if (typeof cb !== 'function') {
            throw new Error(
                '[commons@translator] Translator service takes a callback as param. This callback must return an object'
            );
        }

        const CACHE = cb();

        /**
         * Mutate the cache to keep the ref valid
         */
        const refresh = () => Object.assign(CACHE, cb());

        callbacks.push(refresh);

        return CACHE;
    };
}

export default translator;
