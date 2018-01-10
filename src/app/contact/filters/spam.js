import _ from 'lodash';

/* @ngInject */
function spam() {
    return (contacts = [], input = '') => {
        return input ? _.filter(contacts, (contact) => contact.Email.indexOf(input) > -1) : contacts;
    };
}
export default spam;
