/* @ngInject */
function vpnSettingsModel(dispatchers, vpnSettingsApi, vpnApi) {
    let CACHE = {};

    const { on, dispatcher } = dispatchers(['vpnSettings']);
    const get = (key = 'all') => angular.copy(key === 'all' ? CACHE : CACHE[key]);
    const clear = () => (CACHE = {});

    const set = (key = 'all', value) => {
        if (key === 'all') {
            CACHE = { ...CACHE, ...value };
        } else {
            CACHE[key] = value;
        }

        dispatcher.vpnSettings('updated', get());
    };

    const callApi = (method, init) => async (data) => {
        // No need to call it everytime, once is enough.
        if (init && !get('initApiCredentials')) {
            /*
                When we fetch settings, we need to call this method first in order
                to generate missing credentials for OpenVPN.
                They don't exist if you create an account on ProtonMail (cf Type)
            */
            await vpnApi.get();
            set('initApiCredentials', true);
        }
        const vpnSettings = await vpnSettingsApi[method](data);
        set('all', vpnSettings);
        return get();
    };

    const fetch = callApi('fetch', true);
    const updateName = callApi('updateName');
    const updatePassword = callApi('updatePassword');

    on('logout', clear);

    return {
        get,
        set,
        fetch,
        updateName,
        updatePassword
    };
}

export default vpnSettingsModel;
