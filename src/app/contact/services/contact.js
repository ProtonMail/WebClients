import _ from 'lodash';

import { ContactUpdateError } from '../../../helpers/errors';
import {
    CONTACTS_LIMIT_UPLOAD,
    EXPORT_CONTACTS_LIMIT,
    CONTACT_MODE,
    CONTACT_EMAILS_LIMIT,
    CONTACTS_LIMIT
} from '../../constants';

const ENCRYPTED_MODES = [CONTACT_MODE.ENCRYPTED, CONTACT_MODE.ENCRYPTED_AND_SIGNED];

/* @ngInject */
function Contact($http, $rootScope, url, chunk, contactEncryption, sanitize) {
    const requestURL = url.build('contacts');

    /**
     * Clean contact datas
     * @param  {String} data
     * @return {Object}
     */
    function clearContacts(contacts = []) {
        return contacts.map((contact) => {
            contact.Email = sanitize.input(contact.Email);
            contact.Name = sanitize.input(contact.Name);
            return contact;
        });
    }

    function request(route, params = {}, timeout) {
        return $http
            .get(route, { params, timeout })
            .then(({ data = {} } = {}) => data)
            .catch(({ data = {} } = {}) => {
                throw new Error(data.Error);
            });
    }

    async function queryContacts(route = '', { PageSize, key = '' }, timeout) {
        const data = await request(route, { PageSize }, timeout);
        const promises = [Promise.resolve(data[key])];
        const n = Math.ceil(data.Total / PageSize) - 1; // We already load 1 or 2 pages

        if (n > 0) {
            const list = _.times(n, (index) => {
                return request(
                    route,
                    {
                        PageSize,
                        Page: index + 1
                    },
                    timeout
                ).then((data) => data[key]);
            });
            promises.push(...list);
        }

        const list = await Promise.all(promises);
        return list.reduce((acc, item) => acc.concat(item), []);
    }

    /**
     * Get a list of Contact Emails right after Login
     * @return {Promise}
     */
    function hydrate(PageSize = CONTACT_EMAILS_LIMIT) {
        return queryContacts(requestURL('emails'), {
            key: 'ContactEmails',
            PageSize
        }).then(clearContacts);
    }

    /**
     * Get a list of Contacts minus their Data
     * @return {Promise}
     */
    const all = (PageSize = CONTACTS_LIMIT) => {
        return queryContacts(requestURL(), {
            key: 'Contacts',
            PageSize
        });
    };
    /**
     * Get a list of Contacts minus their Data
     * @return {Promise}
     */
    const load = (type = '') => {
        const url = type ? requestURL(type) : requestURL();
        const PageSize = type ? CONTACT_EMAILS_LIMIT : CONTACTS_LIMIT / 10;
        return request(url, { PageSize });
    };

    /**
     * Get full Contact
     * @param {String} contactID
     * @return {Promise}
     */
    async function get(contactID, timeout) {
        const { Contact } = await request(requestURL(contactID), {}, timeout);
        const [contact] = await contactEncryption.decrypt([Contact]);
        return contact;
    }

    const handleUpload = (total) => (result = []) => {
        const { created, errors } = _.reduce(
            result,
            (acc, { data = {} } = {}) => {
                _.each(data.Responses, ({ Response = {} }) => {
                    if (Response.Error) {
                        return acc.errors.push({
                            code: Response.Code,
                            name: Response.Name,
                            emails: Response.Emails,
                            error: Response.Error
                        });
                    }
                    acc.created.push(Response.Contact);
                });

                return acc;
            },
            { created: [], errors: [] }
        );

        return { created, errors, total };
    };

    function uploadContacts(cards = [], total) {
        let progress = 50; // NOTE We start at 50% because the first part (encryption) is already done
        const chunkCards = chunk(cards, CONTACTS_LIMIT_UPLOAD);
        const promises = _.map(chunkCards, (Contacts) => {
            const params = { Contacts, Groups: 1, Overwrite: 1, Labels: 1 };

            return $http.post(requestURL(), params).then((data) => {
                progress += Math.floor(Contacts.length * 50 / total);
                $rootScope.$emit('progressBar', { type: 'contactsProgressBar', data: { progress } });

                return data;
            });
        });

        return Promise.all(promises).then(handleUpload(total));
    }

    /**
     * Create new contacts
     * @param {Array} contacts
     * @return {Promise}
     */
    function add(contacts = []) {
        return contactEncryption
            .encrypt(contacts)
            .then((result = []) => uploadContacts(result, contacts.length))
            .then((data) => {
                $rootScope.$emit('contacts', { type: 'contactsUpdated' });
                return data;
            });
    }

    /**
     * Update a contact without touching the encrypted part: allows you to keep the encrypted part intact if the encryption
     * becomes broken (e.g. password reset)
     * @param {Object} contact
     * @return {Promise}
     */
    function updateUnencrypted(contact) {
        const encryptPromise = contactEncryption.encrypt([contact]);
        const oldContactPromise = request(requestURL(contact.ID));

        return Promise.all([encryptPromise, oldContactPromise]).then(([[newContact], { Contact: oldContact }]) => {
            newContact.Cards = newContact.Cards.filter(({ Type }) => !ENCRYPTED_MODES.includes(Type)).concat(
                oldContact.Cards.filter(({ Type }) => ENCRYPTED_MODES.includes(Type))
            );
            return $http.put(requestURL(contact.ID), newContact).then(({ data = {} } = {}) => {
                if (data.Error) {
                    throw new Error(data.Error);
                }
                // NOTE We need to pass the cards to update the encrypted icon in the contact view
                data.cards = newContact.Cards;
                return data;
            });
        });
    }

    /**
     * Update a contact
     * @param {Object} contact
     * @return {Promise}
     */
    function update(contact) {
        return contactEncryption.encrypt([contact]).then((contacts) => {
            return $http
                .put(requestURL(contact.ID), contacts[0])
                .then(({ data = {} } = {}) => {
                    // NOTE We need to pass the cards to update the encrypted icon in the contact view
                    data.cards = contacts[0].Cards;
                    return data;
                })
                .catch(({ data = {} } = {}) => {
                    throw new ContactUpdateError(data.Error);
                });
        });
    }

    /**
     * Delete array of contacts
     * @param {Array} contacts
     * @return {Promise}
     */
    const remove = (contacts) => {
        return $http
            .put(requestURL('delete'), contacts)
            .then(({ data = {} } = {}) => data)
            .then(({ Responses = [] }) => {
                return Responses.reduce(
                    (agg, { ID, Response = {} } = {}) => {
                        if (Response.Error) {
                            agg.errors.push({ ID, Error: Response.Error, Code: Response.Code });
                        } else {
                            agg.removed.push(ID);
                        }
                        return agg;
                    },
                    { removed: [], errors: [] }
                );
            });
    };

    /**
     * Delete all contacts
     * @return {Promise}
     */
    const clear = () => $http.delete(requestURL());

    /**
     * Get all ContactData's for export
     * @return {Promise}
     */
    async function exportAll(PageSize = EXPORT_CONTACTS_LIMIT, timeout) {
        const contacts = await queryContacts(
            requestURL('export'),
            {
                key: 'Contacts',
                PageSize
            },
            timeout
        );
        return contactEncryption.decrypt(contacts);
    }

    /**
     * Get multiple contact by ids
     * @param {Array} ids
     * @param {number} timeout in ms
     * @return {Promise}
     */
    function getMultiple(ids, timeout) {
        return Promise.all(ids.map((id) => get(id, timeout)));
    }

    /**
     * Get groups and their emails
     * @return {Promise}
     */
    const groups = () => $http.get(requestURL('groups'));

    return { hydrate, all, get, getMultiple, add, update, updateUnencrypted, remove, clear, exportAll, groups, load };
}
export default Contact;
