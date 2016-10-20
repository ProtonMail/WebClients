angular.module('proton.filters')
    .filter('contact', (gettextCatalog, authentication) => {

        const getContact = (Email) => _.findWhere(authentication.user.Contacts, { Email }) || {};

        const getContactFromUser = (nameContact, Address) => {
            const { Name = '', Email } = getContact(Address);
            if (angular.isString(Name) && Name !== Email) {
                return Name;
            }
            return nameContact || Address;
        };

        const fillContact = (Name, Address) => {
            const contact = getContact(Address);
            if ((Address === Name) || !Name) {
                return Address;
            }
            if (angular.isString(contact.Name) && contact.Name) {
                return `${contact.Name} <${Address}>`;
            }
        };

        return ({ Name = '', Address } = {}, parameter) => {

            if (parameter === 'Address') {
                return `<${Address}>`;
            }

            if (parameter === 'Name') {
                return getContactFromUser(Name, Address);
            }

            return fillContact(Name, Address) || `${Name} <${Address}>`;
        };
    });
