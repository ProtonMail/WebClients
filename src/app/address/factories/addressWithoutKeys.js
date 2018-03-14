import _ from 'lodash';

/* @ngInject */
function addressWithoutKeys(memberModel, addressesModel, authentication, AppModel) {
    const isDirtyAddress = ({ Keys, Status }) => !Keys.length && Status === 1;
    const filterDirty = (user, list = []) => {
        return _.filter(list, (adr) => isDirtyAddress(adr) && user.Private === 1);
    };

    /**
     * Get the list of dirty addresses for a user
     * @param  {Object} user
     * @param {Array} addresses
     * @return {Array}
     */
    const fromUser = (user = authentication.user, addresses = addressesModel.get()) => filterDirty(user, addresses);

    /**
     * Get list of addresses for the member we try to edit
     * @param  {Array} [member] List of member
     * @param  {Object} user
     * @return {Array}      Collection of addresses
     */
    const getListAddresses = ([member], user) => {
        if (!member.Private) {
            return member.Addresses;
        }

        const mapAddresses = addressesModel.getByUser(user).reduce((acc, { ID }) => ((acc[ID] = true), acc), {});
        /*
                The member is coming from the event he has the new address.
                But member.Addresses don't have Keys even if the matching one
                inside addressesModel.getByUser(user) has Keys.
                We create a diff array with only what's new from the event.
             */
        return addressesModel.getByUser(user).concat(member.Addresses.filter(({ ID }) => !mapAddresses[ID]));
    };

    /**
     * Find all addresses non private without keys
     * @param  {Array} memberList Collection of Member
     * @return {Object}
     */
    const get = (user = {}, memberList = memberModel.getAll(), isEvent) => {
        // Update the current member === user
        if (memberList.length === 1 && !isEvent) {
            const addresses = getListAddresses(memberList, user);
            return {
                addresses: filterDirty(user, addresses)
            };
        }

        // Default case onLoad -> via securedController
        return { addresses: filterDirty(user, addressesModel.getByUser(user)) };
    };

    /**
     * Check if all active keys from a list of addresses are dirty
     * @param  {Array}      Addresses
     * @return {Boolean}
     */
    const allDirty = ({ Addresses = [] } = authentication.user) => {
        /*
                Default = undefined
                As an user can have a lot of addresses we don't want to loop everytime
             */
        if (AppModel.get('allDirtyAddresses') === false) {
            return false;
        }

        const test = Addresses.filter(({ Status }) => Status).every(isDirtyAddress);
        AppModel.set('allDirtyAddresses', test);
        return test;
    };

    return { get, fromUser, allDirty };
}
export default addressWithoutKeys;
