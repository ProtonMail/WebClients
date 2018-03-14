import _ from 'lodash';

/* @ngInject */
function plusAliasModel(addressesModel) {
    /**
     * Detect if the email address is a valid plus alias and returns the address model appropriate
     * @param  {String} email
     * @return {Object} address model with Email set with the value passed
     */
    function getAddress(email = '') {
        const address = isValid(email);

        return address ? _.extend({}, address, { Email: email }) : undefined;
    }

    /**
     * Check if the email address is a valid +alias
     * @param  {String} email
     * @return {Boolean}
     */
    function isValid(email = '') {
        const plusIndex = email.indexOf('+');
        const atIndex = email.indexOf('@');

        if (plusIndex === -1 || atIndex === -1) {
            return false;
        }

        // remove the + stuff
        const Email = `${email.substring(0, plusIndex)}${email.substring(atIndex, email.length)}`;
        const address = _.find(addressesModel.get(), { Status: 1, Receive: 1, Email });

        if (!address) {
            return false;
        }

        // pm.me addresses on free accounts (Send = 0)
        if (!address.Send) {
            return false;
        }

        return address;
    }

    return { getAddress, isValid };
}
export default plusAliasModel;
