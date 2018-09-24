import _ from 'lodash';

import { STATUS } from '../../constants';
import updateCollection from '../../utils/helpers/updateCollection';

const { DELETE, CREATE, UPDATE } = STATUS;

/* @ngInject */
function contactEmails(Contact, dispatchers, sanitize) {
    const CACHE = {
        emails: [],
        map: Object.create(null)
    };

    const syncMap = (diff = []) => {
        CACHE.map = _.reduce(
            diff,
            (acc, item) => {
                if (!acc[item.ContactID]) {
                    acc[item.ContactID] = [];
                }
                acc[item.ContactID].push({ ...item });
                return acc;
            },
            CACHE.map
        );
    };

    const set = (data) => {
        CACHE.emails.push(...data);
        syncMap(data);
    };

    const get = () => CACHE.emails.slice();
    const getMap = () => CACHE.map;
    const clear = () => ((CACHE.emails.length = 0), (CACHE.map = Object.create(null)));

    const findIndex = (ID) => _.findIndex(CACHE.emails, { ID });
    const findEmail = (email, normalizer = null) => {
        const norm = normalizer || _.identity;
        const normEmail = norm(email);
        const nonDefault = _.find(
            CACHE.emails,
            (contactEmail) => !contactEmail.Defaults && norm(contactEmail.Email) === normEmail
        );
        if (nonDefault) {
            return nonDefault;
        }
        return _.find(CACHE.emails, (contactEmail) => norm(contactEmail.Email) === normEmail);
    };

    const { dispatcher, on } = dispatchers(['contacts']);
    const emit = (contact) => dispatcher.contacts('refreshContactEmails', { ID: contact.ContactID });

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
        const cleanEvents = events.map((event) => ({ ...event, ContactEmail: cleanContact(event.ContactEmail) }));
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

    return { set, get, getMap, clear, findIndex, findEmail, load: loadCache, update };
}
export default contactEmails;
