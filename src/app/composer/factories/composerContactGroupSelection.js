/* @ngInject */
function composerContactGroupSelection(dispatchers) {
    let CACHE = Object.create(null);
    const { on } = dispatchers();

    const getCacheDefault = () => ({
        userSelection: Object.create(null),
        userSelectionEmails: Object.create(null),
        mapDraft: Object.create(null),
        mapDraftEmails: Object.create(null),
        draftConfig: Object.create(null),
        exist: false
    });

    /**
     * Create a cache/composer
     * It's usefull when you need to manage groups + emails
     * as the user can have a custom configuration.
     * Most of the time it's useless, it won't do anything.
     * @param  {String}  ComposerID
     * @return {Object}
     */
    function cacheFactory(ComposerID) {
        !CACHE[ComposerID] && (CACHE[ComposerID] = getCacheDefault());

        const LOCAL_CACHE = CACHE[ComposerID];

        const all = () => LOCAL_CACHE;
        const get = (ID) => LOCAL_CACHE.userSelection[ID];
        const clear = () => delete CACHE[ComposerID];
        const isEmpty = (ID) => !(LOCAL_CACHE.userSelection[ID] || []).length;

        const getEmail = (ID, { Email, Address } = {}) => {
            return (LOCAL_CACHE.userSelectionEmails[ID] || {})[Email || Address];
        };

        /**
         * Store the user selection for a contact group
         * @param  {String} options.ID  Contact Group ID
         * @param  {Array}  list        List of emails from the conract group selected
         */
        const save = ({ ID }, list = []) => {
            LOCAL_CACHE.userSelection[ID] = list;
            LOCAL_CACHE.userSelectionEmails[ID] = list.reduce((acc, item) => {
                acc[item.Email || item.Address] = item;
                return acc;
            }, Object.create(null));
        };

        /**
         * Store the config for a draft
         * @param  {String}  key    Scope of a draft (ToList/CCList/BCCList)
         * @param  {Object}  value  Map of {<groupID:String>: <emails:Array>}
         */
        const storeDraftConfig = (key, value) => {
            LOCAL_CACHE.draftConfig[key] = true;
            LOCAL_CACHE.mapDraft[key] = value;
            LOCAL_CACHE.mapDraftEmails[key] = Object.keys(value || {}).reduce((acc, id) => {
                acc[id] = value[id].reduce((acc, item) => {
                    acc[item.Email || item.Address] = item;
                    return acc;
                }, Object.create(null));
                return acc;
            }, Object.create(null));
        };

        const getDraftConfig = (key) => LOCAL_CACHE.mapDraft[key];
        const getDraftConfigGroup = (key, ID) => (LOCAL_CACHE.mapDraftEmails[key] || {})[ID] || {};
        const removeDraftConfig = (key) => {
            LOCAL_CACHE.draftConfig[key] = false;
            delete LOCAL_CACHE.mapDraft[key];
        };

        const remove = (ID) => {
            if (get(ID)) {
                delete LOCAL_CACHE.userSelection[ID];
                delete LOCAL_CACHE.mapEmail[ID];
                LOCAL_CACHE.exist = !!Object.keys(LOCAL_CACHE.userSelection).length;
            }
        };

        return {
            save,
            all,
            get,
            getEmail,
            isEmpty,
            clear,
            remove,
            storeDraftConfig,
            getDraftConfig,
            getDraftConfigGroup,
            removeDraftConfig
        };
    }

    const reset = () => (CACHE = Object.create(null));

    on('AppModel', (e, { type, data = {} }) => {
        type === 'loggedIn' && !data.value && reset();
    });

    return cacheFactory;
}
export default composerContactGroupSelection;
