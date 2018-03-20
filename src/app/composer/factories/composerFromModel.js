import _ from 'lodash';

import { flow, filter, sortBy } from 'lodash/fp';
import { ADDRESS_TYPE } from '../../constants';

/* @ngInject */
function composerFromModel(addressesModel, authentication, confirmModal, gettextCatalog, plusAliasModel) {
    const PREMIUM_ADDRESS_ITEM = 'protonmail_premium_address';
    const I18N = {
        CONFIRM: gettextCatalog.getString("Don't remind me again", null, 'Action'),
        TITLE: gettextCatalog.getString('Warning', null, 'Title'),
        error(email) {
            return gettextCatalog.getString('Sending messages from @pm.me address is a paid feature. Your message will be sent from your default address {{email}}', { email }, 'Error');
        }
    };
    /**
     * Return list of addresses available in the FROM select
     * @param  {Object} message
     * @return {Object}
     */
    function get({ xOriginalTo, AddressID }) {
        const plusAddress = plusAliasModel.getAddress(xOriginalTo);
        const addresses = flow(filter({ Status: 1, Receive: 1 }), sortBy('Order'))(addressesModel.get());

        if (plusAddress) {
            // It's important to unshift the plus address to be found first with find()
            addresses.unshift(plusAddress);
        }

        return { addresses, address: find(addresses, AddressID) };
    }

    function displayWarning(email) {
        confirmModal.activate({
            params: {
                title: I18N.TITLE,
                message: I18N.error(email),
                confirmText: I18N.CONFIRM,
                confirm() {
                    confirmModal.deactivate();
                    localStorage.setItem(PREMIUM_ADDRESS_ITEM, 'dontRemind');
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    }

    /**
     * Return the address selected in the FROM select
     * @param  {Array} addresses
     * @param  {String} ID AddressID
     * @return {Object}
     */
    function find(addresses = [], ID) {
        const isPmMeAddress = _.some(addresses, { ID, Type: ADDRESS_TYPE.PREMIUM });

        if (!authentication.hasPaidMail()) {
            const onlySend = _.filter(addresses, { Send: 1 });
            const address = _.find(onlySend, { ID });

            if (!address) {
                isPmMeAddress && !localStorage.getItem(PREMIUM_ADDRESS_ITEM) && displayWarning(onlySend[0].Email);
                return onlySend[0];
            }

            return address;
        }

        if (ID) {
            return _.find(addresses, { ID }) || addresses[0];
        }

        return addresses[0];
    }

    return { get };
}
export default composerFromModel;
