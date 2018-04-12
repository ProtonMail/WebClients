import _ from 'lodash';

/* @ngInject */
function contactEmails(Contact, dispatchers) {
    const emails = [];

    const set = (data) => emails.push(...data);
    const get = () => angular.copy(emails);
    const clear = () => (emails.length = 0);
    const findIndex = (ID) => _.findIndex(emails, { ID });
    const findEmail = (email, normalizer = null) => {
        const norm = normalizer || _.identity;
        const normEmail = norm(email);
        const nonDefault = _.find(
            emails,
            (contactEmail) => !contactEmail.Defaults && norm(contactEmail.Email) === normEmail
        );
        if (nonDefault) {
            return nonDefault;
        }
        return _.find(emails, (contactEmail) => norm(contactEmail.Email) === normEmail);
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

    on('updateContactEmail', (event, ID, contactEmail) => {
        const index = findIndex(ID);

        if (index !== -1) {
            emails[index] = contactEmail;
        } else {
            emails.push(contactEmail);
        }

        emit(contactEmail);
    });

    on('deleteContactEmail', (event, ID) => {
        const index = findIndex(ID);
        if (index !== -1) {
            emails.splice(index, 1);
            dispatcher.contacts('deletedContactEmail', { ID });
        }
    });

    on('resetContactEmails', () => {
        reset();
    });

    on('logout', () => {
        clear();
    });

    return { set, get, clear, findIndex, findEmail, load: loadCache };
}
export default contactEmails;
