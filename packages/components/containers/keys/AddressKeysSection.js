import React from 'react';

import AddressKeysHeader from './AddressKeysHeader';
import ContactKeysHeader from './ContactKeysHeader';
import AddressKeysTable from './AddressKeysTable';
import { getAddressesKeys, getUserAddressKeys } from './AddressKeysSectionModel';
import { useUser } from '../../models/userModel';
import { useAddresses } from '../../models/addressesModel';

const AddressKeysSection = () => {
    const [user] = useUser();
    const [addresses] = useAddresses();
    // TODO: Keys model
    const addressKeys = getAddressesKeys(addresses, {});
    const userAddressKeys = getUserAddressKeys(user, {});

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

    const headerHandlers = {
        handleAddKey,
        handleImportKey,
        handleReactivateKeys
    };

    const tableHandlers = {
        handleDeleteKey,
        handleExportKey,
        handleMakePrimaryKey,
        handleMarkObsoleteKey,
        handleMarkCompromisedKey
    };

    return (
        <>
            <AddressKeysHeader {...headerHandlers} />
            <AddressKeysTable addressKeys={addressKeys} mode={'address'} {...tableHandlers} />

            <ContactKeysHeader />
            <AddressKeysTable addressKeys={userAddressKeys} mode={'user'} {...tableHandlers} />
        </>
    );
};

AddressKeysSection.propTypes = {};

export default AddressKeysSection;
