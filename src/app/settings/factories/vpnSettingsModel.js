/* @ngInject */
function vpnSettingsModel(dispatchers, vpnSettingsApi) {
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

    const callApi = async (method, data) => {
        const vpnSettings = await vpnSettingsApi[method](data);
        set('all', vpnSettings);
        return get();
    };

    const fetch = () => callApi('fetch');
    const updateName = (data) => callApi('updateName', data);
    const updatePassword = (data) => callApi('updatePassword', data);

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
