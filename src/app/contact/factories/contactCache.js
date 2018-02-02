import _ from 'lodash';

import { flow, filter, map } from 'lodash/fp';
import updateCollection from '../../utils/helpers/updateCollection';

/* @ngInject */
function contactCache(
    $rootScope,
    $state,
    $stateParams,
    networkActivityTracker,
    CONSTANTS,
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

    const { CONTACTS_PER_PAGE } = CONSTANTS;
    const getItem = (ID) => _.find(CACHE.contacts, { ID });
    const findIndex = (ID) => _.findIndex(CACHE.contacts, { ID });
    const emit = () => $rootScope.$emit('contacts', { type: 'contactsUpdated', data: { all: get() } });
    const orderBy = (contacts = []) => {
        const parameter = $stateParams.sort || 'Name';
        const reverseOrder = parameter.indexOf('-') > -1;
        const key = parameter.replace('-', '');

        return contacts.slice().sort((a, b) => {
            if (reverseOrder) {
                return b[key].localeCompare(a[key]);
            }

            return a[key].localeCompare(b[key]);
        });
    };
    const lowerCase = (word = '') => word.toLowerCase();
    const filterEmails = (emails = [], value = '') => _.filter(emails, ({ Email = '' }) => lowerCase(Email).indexOf(value) > -1);
    const total = () => ($stateParams.keyword ? CACHE.map.filtered.length : CACHE.contacts.length);
    const isHydrated = () => CACHE.hydrated;

    function selected(ID = $stateParams.id) {
        const selected = flow(filter(({ selected }) => selected), map('ID'))(get());

        if (!selected.length && ID) {
            return [ ID ];
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
            return angular.copy(CACHE.contacts);
        }
        return _.map(CACHE.map[key], (contactID) => CACHE.map.all[contactID]);
    }

    /**
     * Call the BE to get the contact list
     * @return {Array} contacts
     */
    function hydrate(force) {
        if (isHydrated() && !force) {
            sync();
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

    function find(id) {
        const promise = Contact.get(id);
        networkActivityTracker.track(promise);
        return promise;
    }

    /**
     * Sync the collection and auto select the last contact
     * added if it exists
     * @param  {Object} [ { ID }
     */
    function sync([ { ID } = {} ] = []) {
        const emails = contactEmails.fetch();

        // Synchronise emails
        CACHE.contacts = _.map(get(), (contact) => {
            contact.Emails = _.filter(emails, { ContactID: contact.ID });
            contact.emails = contact.Emails.map(({ Email = '' }) => Email).join(', ');
            return contact;
        });

        // Create maps
        CACHE.map = {
            all: _.reduce(get(), (acc, contact) => ((acc[contact.ID] = contact), acc), {}),
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

    function search(keyword = '', contacts = []) {
        const value = lowerCase(keyword);

        return _.filter(contacts, ({ Name = '', Emails = [] }) => {
            return lowerCase(Name).indexOf(value) > -1 || filterEmails(Emails, value).length;
        });
    }

    function searchingContact() {
        CACHE.map.filtered = filtered();
        emit();
    }

    function selectContacts({ contactIDs = [], isChecked }) {
        CACHE.contacts = _.map(get(), (contact) => {
            if (contactIDs.indexOf(contact.ID) > -1) {
                contact.selected = isChecked;
            }
            return contact;
        });

        sync();
        emit();
    }

    function contactEvents({ events = [] }) {
        const { collection, todo } = updateCollection(CACHE.contacts, events, 'Contact');

        CACHE.contacts = collection;

        sync(todo.create);
        emit();
    }

    $rootScope.$on('contacts', (event, { type, data = {} }) => {
        type === 'contactEvents' && contactEvents(data);
        type === 'refreshContactEmails' && refreshContactEmails(data);
        type === 'deletedContactEmail' && deletedContactEmail(data);
        type === 'resetContacts' && resetContacts();
        type === 'importContacts' && contactImporter(data.contactID);
        type === 'exportContacts' && contactDownloader(data.contactID);
        type === 'selectContacts' && selectContacts(data);
        type === 'searchingContact' && searchingContact(data);
    });

    $rootScope.$on('logout', () => {
        clear();
    });

    return { hydrate, isHydrated, clear, get, total, paginate, load, find, getItem };
}
export default contactCache;
