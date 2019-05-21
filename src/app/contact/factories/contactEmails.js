import _ from 'lodash';

import { STATUS } from '../../constants';
import updateCollection from '../../utils/helpers/updateCollection';
import { normalizeEmail } from '../../../helpers/string';

const { DELETE, CREATE, UPDATE } = STATUS;

const getCacheDefault = () => ({
    emails: [],
    map: Object.create(null),
    emailMap: Object.create(null)
});

/* @ngInject */
function contactEmails(Contact, dispatchers, sanitize) {
    let CACHE = getCacheDefault();

    const { dispatcher, on } = dispatchers(['contacts']);
    const emit = (contact) => dispatcher.contacts('refreshContactEmails', { ID: contact.ContactID, contact });

    const syncMap = (diff = []) => {
        const { map, emailMap } = _.reduce(
            diff,
            (acc, item) => {
                if (!acc.map[item.ContactID]) {
                    acc.map[item.ContactID] = [];
                }
                acc.map[item.ContactID].push({ ...item });
                acc.emailMap[item.ID] = item;
                return acc;
            },
            CACHE
        );
        CACHE.map = map;
        CACHE.emailMap = emailMap;
    };

    const set = (data) => {
        CACHE.emails.push(...data);
        syncMap(data);
    };

    const get = () => CACHE.emails.slice();
    const getEmail = (ID) => CACHE.emailMap[ID];
    const getMap = () => CACHE.map;
    const clear = () => (CACHE = getCacheDefault());

    const loadFilterEmails = (input, format = _.identity, ID) => {
        const email = format(input);
        const match = (input, ContactID) => {
            const isContact = ID ? ID === ContactID : true;
            return format(input) === email && isContact;
        };
        return {
            noDefault({ Defaults, Email, ContactID }) {
                return !Defaults && match(Email, ContactID);
            },
            match: ({ Email, ContactID }) => match(Email, ContactID)
        };
    };

    const findIndex = (ID) => _.findIndex(CACHE.emails, { ID });

    /**
     * Find contacts from an email.
     * Available API method:
     *     - filter for All -> Array
     *     - find for one -> Object
     * @param  {String} method  Type of method to get them.
     * @param {Boolean} forceMatch True to force the match of all matching emails
     * @return {Function}
     */
    const finderByEmail = (method, forceMatch) => (email, normalizer = _.identity, ContactID) => {
        const { noDefault, match } = loadFilterEmails(email, normalizer, ContactID);
        const getMethod = method === 'find' ? _.find : _.filter;

        if (!forceMatch) {
            const nonDefault = getMethod(CACHE.emails, noDefault);
            if (Array.isArray(nonDefault) ? nonDefault.length : nonDefault) {
                return nonDefault;
            }
        }

        return getMethod(CACHE.emails, match);
    };

    const findEmail = finderByEmail('find');
    // Force match all as we want all off them
    const findAllByEmail = finderByEmail('filter', true);

    const findEmailByContactID = (email, { ID }) => {
        return findEmail(email, _.identity, ID);
    };

    const findByEmailVcard = ({ value, type = '' }, contactID) => {
        const list = findAllByEmail(value, _.identity, contactID);
        return list.find((contact) => {
            const { Type = [] } = contact;

            if (Type.length) {
                return Type.some((key) => {
                    // Sometimes upper, sometimes lower :/
                    const testKey = type.toLowerCase();
                    return testKey.includes(key.toLowerCase());
                });
            }

            return true;
        });
    };

    const findEmails = (list = [], format = normalizeEmail) => {
        /*
            Can be a list of undefined
            ex: a draft with a group but then the user removes all the contacts.
         */
        return list.map((email) => findEmail(email, format)).filter(Boolean);
    };

    /**
     * Load first 100 emails via the user auth process
     * @return {Promise}
     */
    const loadCache = async () => {
        const list = await Contact.hydrate();
        set(list);
        return get();
    };

    const reset = () => {
        clear();
        return loadCache();
    };

    /**
     * Clean contact datas
     * @param  {Object} contact
     * @return {Object}
     */
    function cleanContact(contact = {}) {
        contact.Name = sanitize.input(contact.Name);
        contact.Email = sanitize.input(contact.Email);
        return contact;
    }

    const update = (events = []) => {
        const cleanEvents = events.map((event) => ({
            ...event,
            ContactEmail: cleanContact(event.ContactEmail)
        }));
        const { collection } = updateCollection(CACHE.emails, cleanEvents, 'ContactEmail');

        clear();
        set(collection);

        cleanEvents.forEach((event) => {
            event.Action === DELETE && dispatcher.contacts('deletedContactEmail', { ID: event.ID });
            (event.Action === CREATE || event.Action === UPDATE) && emit(event.ContactEmail);
        });

        events.length && dispatcher.contacts('contactEmails.updated');
    };

    on('resetContactEmails', () => {
        reset();
    });

    on('logout', () => {
        clear();
    });

    return {
        set,
        get,
        getMap,
        getEmail,
        clear,
        load: loadCache,
        update,
        findIndex,
        findEmail,
        findEmails,
        findAllByEmail,
        findEmailByContactID,
        findByEmailVcard
    };
}
export default contactEmails;
