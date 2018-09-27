import _ from 'lodash';
import { flow, filter, map } from 'lodash/fp';

import updateCollection from '../../utils/helpers/updateCollection';
import { CONTACTS_PER_PAGE } from '../../constants';

/* @ngInject */
function contactCache(
    $state,
    $stateParams,
    dispatchers,
    networkActivityTracker,
    Contact,
    contactDownloader,
    contactEmails,
    contactImporter
) {
    const CACHE = {
        hydrated: false,
        contacts: [],
        map: {
            all: {},
            selected: [],
            filtered: []
        }
    };

    const { dispatcher, on } = dispatchers(['contacts']);
    const CONTACT_STATES = ['secured.contacts'];
    const getItem = (ID) => _.find(CACHE.contacts, { ID });
    const findIndex = (ID) => _.findIndex(CACHE.contacts, { ID });
    const emit = () => dispatcher.contacts('contactsUpdated', { all: get() });
    const orderBy = (contacts = []) => {
        if (!$state.includes('secured.contacts')) {
            return contacts;
        }

        const parameter = $stateParams.sort || 'Name';
        const reverseOrder = parameter.indexOf('-') > -1;
        const key = parameter.replace('-', '');

        // Sort is a key not defined inside a contact
        if (!_.has(contacts[0], key)) {
            return contacts;
        }

        return contacts.slice().sort((a, b) => {
            if (reverseOrder) {
                return b[key].localeCompare(a[key]);
            }
            return a[key].localeCompare(b[key]);
        });
    };
    const lowerCase = (word = '') => word.toLowerCase();

    const total = () => ($stateParams.keyword ? CACHE.map.filtered.length : CACHE.contacts.length);
    const isHydrated = () => CACHE.hydrated;

    function selected(ID = $stateParams.id) {
        const selected = flow(
            filter(({ selected }) => selected),
            map('ID')
        )(get());

        if (!selected.length && ID) {
            return [ID];
        }

        return selected;
    }

    function filtered() {
        const keyword = $stateParams.keyword || '';

        if (keyword) {
            return _.map(orderBy(search(keyword, get())), 'ID');
        }

        return _.map(orderBy(get()), 'ID');
    }

    function get(key = 'all') {
        if (key === 'all') {
            return CACHE.contacts;
        }
        return _.map(CACHE.map[key], (contactID) => CACHE.map.all[contactID]);
    }

    /**
     * Call the BE to get the contact list
     * @return {Array} contacts
     */
    function hydrate(force) {
        if (isHydrated() && !force) {
            const key = $state.is('secured.contacts.details') && 'contact.details';
            const key2 = $stateParams.sort && $state.is('secured.contacts') && 'contacts.sort';
            sync([], key || key2);
            emit();
            return Promise.resolve();
        }

        const promise = Contact.all()
            .then((contacts = []) => {
                CACHE.hydrated = true;
                CACHE.contacts = contacts;
                sync();
                return get();
            })
            .then(() => emit());
        networkActivityTracker.track(promise);
        return promise;
    }

    function load() {
        const promise = Contact.load()
            .then(({ Contacts = [] }) => {
                CACHE.contacts = Contacts;
                sync();
                return get();
            })
            .then(() => emit());
        networkActivityTracker.track(promise);
        return promise;
    }

    /**
     * Sync the collection and auto select the last contact
     * added if it exists.
     * Warning: the sort is expensive.
     *     - On load/update create a full refresh of the cache
     *     - On select contact/open contact: refresh the selected list
     *     - On sort: refresh only the filtered list
     * @param  {Object} [ { ID }
     * @param  {String} type: type of sync to perform
     */
    function sync([{ ID } = {}] = [], type) {
        const MAP_EMAILS = contactEmails.getMap();

        if (type === 'contact.details' || type === 'selected') {
            CACHE.map.selected = selected(ID);
            return;
        }

        if (type === 'contacts.sort') {
            CACHE.map.filtered = filtered();
            return;
        }

        const { list, all } = _.reduce(
            get(),
            (acc, contact) => {
                contact.Emails = MAP_EMAILS[contact.ID] || [];
                contact.emails = contact.Emails.map(({ Email = '' }) => Email).join(', ');
                acc.all[contact.ID] = { ...contact };
                acc.list.push(acc.all[contact.ID]);
                return acc;
            },
            { list: [], all: Object.create(null) }
        );

        CACHE.contacts = list;
        CACHE.map = {
            all,
            selected: selected(ID),
            filtered: filtered()
        };
    }

    /*
         * Clear the contacts array and reset Hydrated
         */
    function clear() {
        CACHE.contacts.length = 0;
        CACHE.hydrated = false;
    }

    function create(contact) {
        CACHE.contacts.push(contact);
        CACHE.map.all[contact.ID] = contact;
    }

    function update(contact, index) {
        CACHE.contacts[index] = contact;
        CACHE.map.all[contact.ID] = contact;
    }

    function deleteContactEmail(EmailID) {
        const contact = _.find(get(), (contact) => {
            return _.some(contact.Emails, { ID: EmailID });
        });
        contact && updateContact({ ID: contact.ID, contact });
    }

    function updateContact({ ID, contact }) {
        const index = findIndex(ID);

        if (index !== -1) {
            update(contact, index);
        } else {
            create(contact);
        }

        emit();
    }

    function refreshContactEmails({ ID }) {
        const index = findIndex(ID);

        if (index !== -1) {
            const contact = CACHE.contacts[index];
            updateContact({ ID, contact });
        }
    }

    function paginate(contacts = []) {
        const currentPage = $stateParams.page || 1;
        const begin = (currentPage - 1) * CONTACTS_PER_PAGE;
        const end = begin + CONTACTS_PER_PAGE;

        return contacts.slice(begin, end);
    }

    function deletedContactEmail({ ID }) {
        if (CACHE.contacts.length > 0) {
            deleteContactEmail(ID);
        }
    }

    function resetContacts() {
        clear();
        hydrate();
    }

    const hasEmails = (emails = [], value = '') => {
        return _.some(emails, ({ Email = '' }) => lowerCase(Email).includes(value));
    };
    function search(keyword = '', contacts = []) {
        const value = lowerCase(keyword);

        return _.filter(contacts, ({ Name = '', Emails = [] }) => {
            return lowerCase(Name).indexOf(value) > -1 || hasEmails(Emails, value);
        });
    }

    function searchingContact() {
        CACHE.map.filtered = filtered();
        emit();
    }

    /**
     * Check or uncheck contacts
     * @param  {Array} contactIDs by default contains all contact ID
     * @param  {Boolean} isChecked check / uncheck
     */
    function selectContacts({ contactIDs = [], isChecked }) {
        if (!contactIDs.length) {
            CACHE.contacts = _.map(get(), (contact) => {
                contact.selected = isChecked;
                return contact;
            });
        }

        contactIDs.forEach((id) => {
            CACHE.map.all[id] && (CACHE.map.all[id].selected = isChecked);
        });
        sync([], 'selected');
    }

    function contactEvents({ events = [] }) {
        const { collection, todo } = updateCollection(CACHE.contacts, events, 'Contact');

        CACHE.contacts = collection;

        sync(todo.create);
        emit();
    }

    on('contacts', (event, { type, data = {} }) => {
        type === 'contactEvents' && contactEvents(data);
        type === 'refreshContactEmails' && refreshContactEmails(data);
        type === 'deletedContactEmail' && deletedContactEmail(data);
        type === 'resetContacts' && resetContacts();
        type === 'importContacts' && contactImporter(data.contactID);
        type === 'exportContacts' && contactDownloader(data.contactID);
        type === 'selectContacts' && selectContacts(data);
        type === 'searchingContact' && searchingContact(data);
    });

    on('$stateChangeSuccess', (event, toState) => {
        if (!CONTACT_STATES.includes(toState.name)) {
            selectContacts({ isChecked: false });
        }
    });

    on('logout', () => {
        clear();
    });

    return { hydrate, isHydrated, clear, get, total, paginate, load, getItem };
}
export default contactCache;
