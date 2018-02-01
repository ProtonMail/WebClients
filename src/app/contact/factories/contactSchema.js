import _ from 'lodash';

/* @ngInject */
function contactSchema(gettextCatalog) {
    /* eslint new-cap: "off" */
    const contactAPI = { vCard: new vCard() };
    const group = ['Tel', 'Adr', 'Note'];
    const personnal = ['Bday', 'Title', 'Org', 'Nickname'];
    const I18N = {
        UNKNOWN: gettextCatalog.getString('Unknown', null, 'Default display name vcard')
    };

    const all = group.concat(personnal);

    const buildEmailProperty = (property = {}) => ({
        Email: property.valueOf(),
        Type: getType(property)
    });

    const formatName = (property = {}) => {
       if (Array.isArray(property)) {
           return property[0].valueOf().trim();
       }
       return property.valueOf().trim();
   };

    const formatEmails = (property = {}) => {
        if (Array.isArray(property)) {
            return _.map(property, buildEmailProperty);
        }
        return [buildEmailProperty(property)];
    };

    const checkProperty = (property) => {
        if (!Array.isArray(property)) {
            return property && !property.isEmpty() && property.valueOf().trim();
        }
        return true;
    };

    function getType(property) {
        const type = property.getType();
        return Array.isArray(type) ? type : [type];
    }

    return {
        contactAPI,
        group,
        personnal,
        custom(key) {
            return all.indexOf(key) === -1;
        },
        prepare(contacts = []) {
            return _.reduce(
                contacts,
                (acc, contact) => {
                    const prepared = { Emails: [], vCard: contact };
                    const nameProperty = contact.get('fn');
                    const emailProperty = contact.get('email');

                    if (checkProperty(emailProperty)) {
                        prepared.Emails = formatEmails(emailProperty);
                    }

                    if (checkProperty(nameProperty)) {
                        prepared.Name = formatName(nameProperty);
                    } else {
                        const nameValue = prepared.Emails.length ? prepared.Emails[0].Email : I18N.UNKNOWN;

                        prepared.Name = nameValue;
                        prepared.vCard.set('fn', nameValue);
                    }

                    acc.push(prepared);

                    return acc;
                },
                []
            );
        }
    };
}
export default contactSchema;
