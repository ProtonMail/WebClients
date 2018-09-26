import _ from 'lodash';

import { ContactUpdateError } from '../../../helpers/errors';
import { createCancellationToken } from '../../../helpers/promiseHelper';
import {
    CONTACTS_LIMIT_REQUESTS,
    CONTACTS_LIMIT_UPLOAD,
    EXPORT_CONTACTS_LIMIT,
    CONTACT_MODE,
    CONTACT_EMAILS_LIMIT,
    CONTACTS_LIMIT
} from '../../constants';

const ENCRYPTED_MODES = [CONTACT_MODE.ENCRYPTED, CONTACT_MODE.ENCRYPTED_AND_SIGNED];

/* @ngInject */
function Contact($http, dispatchers, url, chunk, contactEncryption, sanitize, eventManager, contactProgressReporter) {
    const requestURL = url.build('contacts');
    const { dispatcher } = dispatchers(['contacts']);

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
        return $http.get(route, { params, timeout }).then(({ data = {} } = {}) => data);
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

    /**
     * Delete array of contacts
     * @param {Object} contacts
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

    const getIds = ({ data: { Responses = [] } } = {}) => {
        return Responses.map(({ Response = {} } = {}) => {
            const { Contact: { ID } = {} } = Response;
            return ID;
        }).filter((id) => id);
    };

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

    /**
     * Clamp the function to the [min, max] range
     * @param min
     * @param max
     * @param value
     * @return {number}
     */
    const clamp = (min, max, value) => Math.floor(Math.max(min, Math.min(max, value)));

    function uploadContacts(cards = [], total, progressBar, cancellationToken) {
        // NOTE We start at 50% because the first part (encryption) is already done
        const reporter = progressBar ? contactProgressReporter(50, 100, total) : () => {};
        // Reduce the chunking size if there a not a lot of cards
        const contactsPerRequest = clamp(5, cards.length / 5, CONTACTS_LIMIT_UPLOAD);
        const chunkedContacts = chunk(cards, contactsPerRequest);
        // Limit the amount of requests at the same time to CONTACTS_LIMIT_REQUEST to not overload the server.
        // Also ensure at least 3 steps to create a fluent progress bar
        const parallelRequests = clamp(1, chunkedContacts.length / 3, CONTACTS_LIMIT_REQUESTS);
        const threadedContacts = chunk(chunkedContacts, parallelRequests);

        const ids = [];
        const uploadContactThread = async (lastUpload, chunkedContacts) => {
            const result = await lastUpload;
            await Promise.all(
                chunkedContacts.map(async (Contacts) => {
                    const params = { Contacts, Groups: 1, Overwrite: 1, Labels: 0 };
                    const data = await $http.post(requestURL(), params);

                    !cancellationToken.isCancelled() && reporter(Contacts.length);

                    ids.push(...getIds(data));
                    result.push(data);
                })
            );

            // Re-sync so we don't get out of sync too much at the end
            await eventManager.call();
            // Check last so we can rollback at the latest moment possible
            cancellationToken.check();
            return result;
        };

        const rollback = (error) => {
            if (error.isCancellationError) {
                return remove({ IDs: ids })
                    .then(eventManager.call)
                    .then(
                        () => {
                            throw error;
                        },
                        () => {
                            throw error;
                        }
                    );
            }
            throw error;
        };

        return threadedContacts
            .reduce(uploadContactThread, Promise.resolve([]))
            .catch(rollback)
            .then((list) => _.flatten(list))
            .then(handleUpload(total));
    }

    /**
     * Create new contacts
     * @param {Array} contacts
     * @param {Object} cancellationToken
     * @param {Boolean} progressBar
     * @return {Promise}
     */
    function add(contacts = [], cancellationToken = createCancellationToken(), progressBar = false) {
        return contactEncryption
            .encrypt(contacts, cancellationToken, progressBar)
            .then((result = []) => uploadContacts(result, contacts.length, progressBar, cancellationToken))
            .then((data) => {
                dispatcher.contacts('contactsUpdated');
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
     * Delete all contacts
     * @return {Promise}
     */
    const clear = () => $http.delete(requestURL());

    /**
     * Get all ContactData's for export
     * @return {Promise}
     */
    async function exportAll(PageSize = EXPORT_CONTACTS_LIMIT, cancellationToken = createCancellationToken()) {
        const contacts = await queryContacts(
            requestURL('export'),
            {
                key: 'Contacts',
                PageSize
            },
            cancellationToken.getCancelEvent()
        );
        return contactEncryption.decrypt(contacts, cancellationToken, true);
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

    /**
     * Get full Contact
     * @param {String} contactID
     * @return {Promise}
     */
    async function decrypt(Contact) {
        const [contact] = await contactEncryption.decrypt([Contact]);
        return contact;
    }

    return {
        hydrate,
        all,
        get,
        getMultiple,
        add,
        update,
        updateUnencrypted,
        remove,
        clear,
        exportAll,
        groups,
        decrypt,
        load
    };
}
export default Contact;
