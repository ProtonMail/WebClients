import { removeEmailAlias, addPlusAlias } from '../../../helpers/string';

/* @ngInject */
function plusAliasModel(addressesModel) {
    /**
     * Detect if the email address is a valid plus alias and returns the address model appropriate
     * First check if the email address is a valid +alias
     * @param  {String} email (ex: panda+news@pm.me)
     * @return {Object} address model with Email set with the value passed
     */
    const getAddress = (email = '') => {
        const plusIndex = email.indexOf('+');
        const atIndex = email.indexOf('@');

        if (plusIndex === -1 || atIndex === -1) {
            return;
        }

        // Remove the plus alias part to find a match with existing addresses
        const address = addressesModel.getByEmail(removeEmailAlias(email));
        const { Status, Receive, Send } = address || {};

        if (!Status || !Receive || !Send) {
            // pm.me addresses on free accounts (Send = 0)
            return;
        }

        const plusPart = email.substring(plusIndex, atIndex);

        // Returns an address where the Email is build to respect the exising capitalization and add the plus part
        return { ...address, Email: addPlusAlias(address.Email, plusPart) };
    };

    return { getAddress };
}
export default plusAliasModel;
