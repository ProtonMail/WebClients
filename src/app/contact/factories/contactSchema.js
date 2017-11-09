angular.module('proton.contact')
    .factory('contactSchema', (gettextCatalog) => {
        /* eslint new-cap: "off" */
        const contactAPI = { vCard: new vCard() };
        const group = ['Tel', 'Adr', 'Note'];
        const personnal = ['Bday', 'Title', 'Org', 'Nickname'];
        const all = group.concat(personnal);
        const buildEmailProperty = (property = {}) => ({ Email: property.valueOf(), Type: getType(property) });
        const formatEmails = (property = {}) => (Array.isArray(property) ? _.map(property, (prop) => buildEmailProperty(prop)) : [buildEmailProperty(property)]);
        const checkProperty = (property) => (Array.isArray(property) ? true : property && !property.isEmpty() && property.valueOf().trim());
        const UNKNOWN = gettextCatalog.getString('Unknown', null, 'Default display name vcard');

        function getType(property) {
            const type = property.getType();

            if (Array.isArray(type)) {
                return type;
            }

            return [type];
        }

        return {
            contactAPI,
            group,
            personnal,
            custom(key) {
                return all.indexOf(key) === -1;
            },
            prepare(contacts = []) {
                return _.reduce(contacts, (acc, contact) => {
                    const prepared = { Emails: [], vCard: contact };
                    const nameProperty = contact.get('fn');
                    const emailProperty = contact.get('email');

                    if (checkProperty(emailProperty)) {
                        prepared.Emails = formatEmails(emailProperty);
                    }

                    if (checkProperty(nameProperty)) {
                        prepared.Name = nameProperty.valueOf().trim();
                    } else {
                        const nameValue = prepared.Emails.length ? prepared.Emails[0].Email : UNKNOWN;

                        prepared.Name = nameValue;
                        prepared.vCard.set('fn', nameValue);
                    }

                    acc.push(prepared);

                    return acc;
                }, []);
            }
        };
    });
