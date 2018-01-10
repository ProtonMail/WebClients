import _ from 'lodash';

/* @ngInject */
function contact(gettextCatalog, authentication) {
    const getContact = (Email) => _.find(authentication.user.Contacts, { Email }) || {};

    const getContactFromUser = (nameContact, Address) => {
        const { Name = '', Email } = getContact(Address);

        if (Name && Name !== Email) {
            return Name;
        }

        return nameContact || Address;
    };

    const fillContact = (Name, Address) => {
        const contact = getContact(Address);
        if (Address === Name || !Name) {
            return Address;
        }
        if (angular.isString(contact.Name) && contact.Name) {
            return `${contact.Name} <${Address}>`;
        }
    };

    return (sender, parameter) => {
        // The sender might be null
        const { Name = '', Address = '' } = sender || {};

        if (parameter === 'Address') {
            return `<${Address}>`;
        }

        if (parameter === 'Name') {
            return getContactFromUser(Name, Address);
        }

        return fillContact(Name, Address) || `${Name} <${Address}>`;
    };
}
export default contact;
