import _ from 'lodash';

import { flow, filter, sortBy } from 'lodash/fp';

/* @ngInject */
function composerFromModel(addressesModel, authentication, confirmModal, gettextCatalog, plusAliasModel) {
    const PM_ADDRESS_ITEM = 'protonmail_pm_address';
    const I18N = {
        OK: gettextCatalog.getString('OK', null, 'Action'),
        DONT_SHOW_AGAIN: gettextCatalog.getString("Don't show this again", null, 'Action'),
        TITLE: gettextCatalog.getString('Sending notice', null, 'Title'),
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
                cancelText: I18N.OK,
                confirmText: I18N.DONT_SHOW_AGAIN,
                confirm() {
                    confirmModal.deactivate();
                    localStorage.setItem(PM_ADDRESS_ITEM, 'dontShowAgain');
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    }

    const isPmMeAddress = ({ Email = '' } = {}) => Email.endsWith('@pm.me');
    const findOrFirst = (addresses = [], ID) => _.find(addresses, { ID }) || _.first(addresses);

    /**
     * Return the address selected in the FROM select
     * @param  {Array} addresses
     * @param  {String} ID AddressID
     * @return {Object}
     */
    function find(addresses = [], ID) {
        const address = findOrFirst(addresses, ID);

        if (!authentication.hasPaidMail() && isPmMeAddress(address)) {
            const onlySend = _.find(addresses, { Send: 1 });

            if (!localStorage.getItem(PM_ADDRESS_ITEM)) {
                displayWarning(onlySend.Email);
            }

            return onlySend;
        }

        return address;
    }

    return { get };
}
export default composerFromModel;
