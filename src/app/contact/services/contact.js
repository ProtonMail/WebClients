import _ from 'lodash';

import { ContactUpdateError } from '../../../helpers/errors';
import { createCancellationToken, runChunksDelayed } from '../../../helpers/promiseHelper';
import { getCategoriesEmail } from '../../../helpers/vcard';
import {
    CONTACTS_LIMIT_REQUESTS,
    CONTACTS_LIMIT_UPLOAD,
    EXPORT_CONTACTS_LIMIT,
    CONTACT_CARD_TYPE,
    CONTACT_EMAILS_LIMIT,
    CONTACTS_LIMIT,
    CONTACTS_REQUESTS_PER_SECOND
} from '../../constants';

const { ENCRYPTED, ENCRYPTED_AND_SIGNED } = CONTACT_CARD_TYPE;
const ENCRYPTED_MODES = [ENCRYPTED, ENCRYPTED_AND_SIGNED];

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
            // cf #7697 we need to unescape the html. We will replace it by unicode later
            contact.Name = _.unescape(sanitize.input(contact.Name));
            return contact;
        });
    }

    function request(route, params = {}, timeout) {
        return $http.get(route, { params, timeout }).then(({ data = {} } = {}) => data);
    }

    const requestPagesChunked = (amount, cb, startIndex = 0) => {
        const pages = [...new Array(amount)].map((a, i) => i + startIndex);
        const chunks = chunk(pages, CONTACTS_REQUESTS_PER_SECOND);
        return runChunksDelayed(chunks, cb, 1000);
    };

    /**
     * Query contacts throttled to not hit rate limiting
     * @param {String} route
     * @param {Number} PageSize
     * @param {String} key
     * @param {Number} timeout
     * @returns {Promise<Array>}
     */
    async function queryContacts(route = '', { PageSize, key = '' }, timeout) {
        const requestPage = (page) => request(route, { PageSize, Page: page }, timeout);

        const firstPage = await requestPage();
        const n = Math.ceil(firstPage.Total / PageSize) - 1; // We already load 1 or 2 pages

        const restPages = n > 0 ? await requestPagesChunked(n, requestPage, 1) : [];

        return [firstPage, ...restPages].reduce((acc, item) => acc.concat(item[key]), []);
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
                    (acc, { ID, Response = {} } = {}) => {
                        if (Response.Error) {
                            acc.errors.push({ ID, Error: Response.Error, Code: Response.Code });
                        } else {
                            acc.removed.push(ID);
                        }
                        return acc;
                    },
                    { removed: [], errors: [] }
                );
            });
    };

    const getIds = ({ data: { Responses = [] } } = {}) => {
        return Responses.reduce((acc, { Response = {} } = {}) => {
            const { Contact: { ID } = {} } = Response;
            ID && acc.push(ID);
            return acc;
        }, []);
    };

    const handleUpload = (total, mapCategories) => (result = []) => {
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

        return { created, errors, total, mapCategories };
    };

    function uploadContacts(cards = [], total, progressBar, cancellationToken) {
        // NOTE We start at 50% because the first part (encryption) is already done
        const reporter = progressBar ? contactProgressReporter(50, 100, total) : () => {};

        const MAP_CATEGORIES = getCategoriesEmail(cards);

        // Reduce the chunking size if there a not a lot of cards
        const contactsPerRequest = _.clamp(CONTACTS_LIMIT_UPLOAD, 5, cards.length / 5);
        const chunkedContacts = chunk(cards, contactsPerRequest);

        /*
            Limit the amount of requests at the same time to CONTACTS_LIMIT_REQUEST
            to not overload the server.
            Also ensure at least 3 steps to create a fluent progress bar
         */
        const parallelRequests = _.clamp(CONTACTS_LIMIT_REQUESTS, 1, chunkedContacts.length / 3);
        const threadedContacts = chunk(chunkedContacts, parallelRequests);

        const uploadThreadRecuder = (ids = []) => async (acc, chunks) => {
            const result = await acc;

            const requests = chunks.map(async (Contacts) => {
                const params = { Contacts, Groups: 1, Overwrite: 1, Labels: 0 };
                const data = await $http.post(requestURL(), params);

                !cancellationToken.isCancelled() && reporter(Contacts.length);
                return data;
            });

            const list = await Promise.all(requests);
            result.push(...list);
            ids.push(...list.map(getIds));

            // Re-sync so we don't get out of sync too much at the end
            await eventManager.call();
            // Check last so we can rollback at the latest moment possible
            cancellationToken.check();
            return acc;
        };

        const rollback = (IDs = []) => (error) => {
            if (error.isCancellationError) {
                const ciao = () => {
                    throw error;
                };
                return remove({ IDs })
                    .then(eventManager.call)
                    .then(ciao, ciao);
            }
            throw error;
        };

        const processedIds = [];

        return threadedContacts
            .reduce(uploadThreadRecuder(processedIds), [])
            .catch(rollback(processedIds))
            .then(handleUpload(total, MAP_CATEGORIES));
    }

    /**
     * Create new contacts
     * @param {Array} contacts
     * @param {Object} cancellationToken
     * @param {Boolean} progressBar
     * @return {Promise}
     */
    async function add(contacts = [], cancellationToken = createCancellationToken(), progressBar = false) {
        const list = await contactEncryption.encrypt(contacts, cancellationToken, progressBar);
        const data = await uploadContacts(list, contacts.length, progressBar, cancellationToken);
        dispatcher.contacts('contactsUpdated');
        return data;
    }

    /**
     * Update a contact without touching the encrypted part: allows you to keep the encrypted part intact if the encryption
     * becomes broken (e.g. password reset)
     * @param {Object} contact
     * @return {Promise}
     */
    async function updateUnencrypted(contact) {
        const contactURL = requestURL(contact.ID);
        const encryptPromise = contactEncryption.encrypt([contact]);
        const previousPromise = request(contactURL);

        const [[next], { Contact: previous }] = await Promise.all([encryptPromise, previousPromise]);

        const isEncrypted = (Type) => ENCRYPTED_MODES.includes(Type);
        const previousEncrypted = previous.Cards.filter(({ Type }) => isEncrypted(Type));

        next.Cards = next.Cards.filter(({ Type }) => !isEncrypted(Type)).concat(previousEncrypted);

        const { data = {} } = (await $http.put(contactURL, next)) || {};
        // NOTE We need to pass the cards to update the encrypted icon in the contact view
        data.cards = next.Cards;
        return data;
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
        const contacts = await queryContacts(requestURL('export'), {
            key: 'Contacts',
            PageSize
        });
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

    const labelEmails = async (cfg) => {
        const { data = {} } = await $http.put(requestURL('emails', 'label'), cfg);
        return data;
    };
    const unlabelEmails = (data) => $http.put(requestURL('emails', 'unlabel'), data);

    const label = async (cfg) => {
        const { data = {} } = await $http.put(requestURL('label'), cfg);
        return data;
    };
    const unlabel = (data) => $http.put(requestURL('unlabel'), data);

    async function exportGroup(LabelID) {
        const { data = {} } = await $http.get(requestURL('emails'), { params: { LabelID } });
        return data.ContactEmails;
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
        load,
        exportGroup,
        label,
        unlabel,
        labelEmails,
        unlabelEmails
    };
}
export default Contact;
