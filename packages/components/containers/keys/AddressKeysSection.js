import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import AddressKeysHeader from './AddressKeysHeader';
import ContactKeysHeader from './ContactKeysHeader';
import AddressKeysTable from './AddressKeysTable';
import { getAddressesKeys, getUserAddressKeys } from './AddressKeysSectionModel';

const AddressKeysSection = ({ userModel, addressesModel, keysModel }) => {
    const addressKeys = getAddressesKeys(addressesModel.data, keysModel.data);
    const userAddressKeys = getUserAddressKeys(userModel.data, keysModel.data);

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

AddressKeysSection.propTypes = {
    addressesModel: PropTypes.object.isRequired,
    userModel: PropTypes.object.isRequired,
    keysModel: PropTypes.object.isRequired
};

const mapStateToProps = ({ user, addresses, keys }) => {
    return {
        userModel: user,
        addressesModel: addresses,
        keysModel: keys
    };
};

export default connect(mapStateToProps)(AddressKeysSection);
