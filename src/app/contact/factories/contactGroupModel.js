import _ from 'lodash';
import { flow, filter, reduce } from 'lodash/fp';

import { LABEL_TYPE } from '../../constants';

/* @ngInject */
function contactGroupModel(dispatchers, labelCache, Contact, gettextCatalog, contactEmails) {
    const I18N = {
        getNumbers(ID) {
            const n = getNumber(ID);
            return gettextCatalog.getPlural(n, '{{$count}} Member', '{{$count}} Members', {}, 'Info');
        }
    };

    const CACHE_GROUPS = {
        EMAILS: {},
        NUMBERS: {}
    };

    const { dispatcher, on } = dispatchers(['contactGroupModel']);

    const dispatch = (type, data = {}) => dispatcher.contactGroupModel(type, data);
    const cache = labelCache(dispatch, LABEL_TYPE.CONTACT_GROUP);

    /**
     * Compute how many contacts we have by group (count emails inside)
     * @return {void}
     */
    const syncNumbers = () => {
        const collection = flow(
            filter(({ LabelIDs }) => LabelIDs.length),
            reduce((acc, { LabelIDs }) => (acc.push(...LabelIDs), acc), [])
        )(contactEmails.get());

        CACHE_GROUPS.NUMBERS = _.countBy(collection);
        dispatcher.contactGroupModel('counter.update');
    };

    function getNumber(ID) {
        return CACHE_GROUPS.NUMBERS[ID] || 0;
    }

    cache.getNumber = getNumber;

    /**
     * Get list of emails attached to a Contact group
     * Store it inside a cache as we can ask for this list often
     * @param  {String} ID Id of the group
     * @return {Array}
     */
    cache.getExport = async (ID) => {
        if (CACHE_GROUPS.EMAILS[ID]) {
            return CACHE_GROUPS.EMAILS[ID];
        }

        const list = await Contact.exportGroup(ID);
        CACHE_GROUPS.EMAILS[ID] = list;
        return list;
    };

    /**
     * I18N output as we need it inside 2 filters
     * @param {String} ID id of the group
     * @return {String}
     */
    cache.getNumberString = I18N.getNumbers;

    /**
     * Extend the config.
     * Ex: we create a draft with a group, then we remove our contacts. When we open the composer we still wants to display the group with contacts.
     * @param  {Object} map Old config draft
     * @return {void}
     */
    cache.extend = (map) => {
        Object.keys(CACHE_GROUPS.EMAILS).forEach((ID) => {
            if (map[ID]) {
                CACHE_GROUPS.EMAILS[ID].push(...map[ID]);
                CACHE_GROUPS.NUMBERS[ID] = CACHE_GROUPS.EMAILS[ID].length;
            }
        });
    };

    /**
     * Create a local cache for contacts groups to know how many contacts
     * are inside a group and a list of email/group
     * When we need to sync again, it means we need to clear our cache for
     * emails as it's not valid anymore. We will build it later if we need to
     */
    const sync = () => {
        syncNumbers();
        CACHE_GROUPS.EMAILS = {};
    };

    on('AppModel', (e, { type, data = {} }) => {
        type === 'loggedIn' && !data.value && cache.set();
    });

    on('contacts', (e, { type }) => {
        type === 'contactsUpdated' && sync();
    });

    on('contactGroupModel', (e, { type }) => {
        /^cache\.(load|refresh)$/.test(type) && sync();
    });

    return cache;
}
export default contactGroupModel;
