import _ from 'lodash';

/* @ngInject */
function contactEmails($rootScope, Contact) {
    const emails = [];
    const set = (data) => emails.push(...data);
    const fetch = () => emails;
    const clear = () => (emails.length = 0);
    const findIndex = (ID) => _.findIndex(emails, { ID });

    const emit = (contact) => {
        $rootScope.$emit('contacts', {
            type: 'refreshContactEmails',
            data: { ID: contact.ContactID }
        });
    };

    /**
     * Load first 100 emails via the user auth process
     * @return {Promise}
     */
    const loadCache = async () => {
        const list = await Contact.hydrate();
        set(list);
        return fetch();
    };

    const reset = () => {
        clear();
        return loadCache();
    };

    $rootScope.$on('updateContactEmail', (event, ID, contactEmail) => {
        const index = findIndex(ID);

        if (index !== -1) {
            emails[index] = contactEmail;
        } else {
            emails.push(contactEmail);
        }

        emit(contactEmail);
    });

    $rootScope.$on('deleteContactEmail', (event, ID) => {
        const index = findIndex(ID);
        if (index !== -1) {
            emails.splice(index, 1);
            $rootScope.$emit('contacts', { type: 'deletedContactEmail', data: { ID } });
        }
    });

    $rootScope.$on('resetContactEmails', () => {
        reset();
    });

    $rootScope.$on('logout', () => {
        clear();
    });

    return { set, fetch, clear, findIndex, load: loadCache };
}
export default contactEmails;
