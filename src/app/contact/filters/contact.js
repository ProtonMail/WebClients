/* @ngInject */
function contact(contactEmails, contactGroupModel) {
    const getContact = (email) => contactEmails.findEmail(email) || {};

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
        const { Name = '', Address = '', isContactGroup, Email } = sender || {};

        const adr = Address || Email;

        if (parameter === 'Address') {
            return `<${adr}>`;
        }

        if (parameter === 'Raw') {
            return !isContactGroup ? adr : contactGroupModel.getNumberString(Address);
        }

        if (parameter === 'Name') {
            return getContactFromUser(Name, adr);
        }

        return fillContact(Name, adr) || `${Name} <${adr}>`;
    };
}
export default contact;
