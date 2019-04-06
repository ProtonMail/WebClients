import React from 'react';

import AddressKeysHeader from './AddressKeysHeader';
import ContactKeysHeader from './ContactKeysHeader';
import AddressKeysTable from './AddressKeysTable';
import { getAddressesKeys, getUserAddressKeys } from './AddressKeysSectionModel';
import useUserKeys from '../../models/userKeysModel';
import useAddressesKeys from '../../models/addressesKeysModel';
import { useUser } from '../../models/userModel';
import { useAddresses } from '../../models/addressesModel';
import { ACTIONS } from './KeysActions';

const AddressKeysSection = () => {
    const [User] = useUser();
    const [Addresses, loadingAddresses] = useAddresses();

    const [userKeys, loadingUserKeys] = useUserKeys(User);
    const [addressesKeys, loadingAddressesKeys] = useAddressesKeys(User, Addresses);

    const handleAddKey = (...args) => {
        // eslint-disable-next-line
        console.log('add key', ...args);
    };

    const handleImportKey = (...args) => {
        // eslint-disable-next-line
        console.log('import key', ...args);
    };

    const handleReactivateKeys = (...args) => {
        // eslint-disable-next-line
        console.log('reactivate key', ...args);
    };

    const handleDeleteKey = (...args) => {
        // eslint-disable-next-line
        console.log('delete key', ...args);
    };

    const handleExportKey = (...args) => {
        // eslint-disable-next-line
        console.log('export key', ...args);
    };

    const handleMakePrimaryKey = (...args) => {
        // eslint-disable-next-line
        console.log('make primary key', ...args);
    };

    const handleMarkObsoleteKey = (...args) => {
        // eslint-disable-next-line
        console.log('mark obsolete key', ...args);
    };

    const handleMarkCompromisedKey = (...args) => {
        // eslint-disable-next-line
        console.log('mark compromised key', ...args);
    };

    const handleReactivateKey = (...args) => {
        // eslint-disable-next-line
        console.log('mark reactivate key', ...args);
    };

    const handleMarkValidKey = (...args) => {
        // eslint-disable-next-line
        console.log('mark valid key', ...args);
    };

    const headerHandlers = {
        handleAddKey,
        handleImportKey,
        handleReactivateKeys
    };

    const keysHandlers = {
        [ACTIONS.DELETE]: handleDeleteKey,
        [ACTIONS.EXPORT]: handleExportKey,
        [ACTIONS.PRIMARY]: handleMakePrimaryKey,
        [ACTIONS.MARK_OBSOLETE]: handleMarkObsoleteKey,
        [ACTIONS.MARK_VALID]: handleMarkValidKey,
        [ACTIONS.MARK_COMPROMISED]: handleMarkCompromisedKey,
        [ACTIONS.REACTIVATE]: handleReactivateKey
    };

    const formattedAdressesKeys = getAddressesKeys(User, Addresses, addressesKeys, keysHandlers);
    const formattedUserKeys = getUserAddressKeys(User, userKeys, keysHandlers);

    return (
        <>
            <AddressKeysHeader {...headerHandlers} />
            <AddressKeysTable
                loading={loadingAddresses || loadingAddressesKeys}
                addressKeys={formattedAdressesKeys}
                mode={'address'}
            />

            <ContactKeysHeader />
            <AddressKeysTable loading={loadingUserKeys} addressKeys={formattedUserKeys} mode={'user'} />
        </>
    );
};

AddressKeysSection.propTypes = {};

export default AddressKeysSection;
