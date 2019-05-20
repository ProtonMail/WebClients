import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { SubTitle, Alert, Block, PrimaryButton, Button } from 'react-components';

const AddressKeysHeader = ({ handleAddKey, handleImportKey, handleReactivateKeys }) => {
    const title = c('Title').t`Email encryption keys`;

    return (
        <>
            <SubTitle>{title}</SubTitle>
            <Alert learnMore="todo">
                {c('Info')
                    .t`Download your PGP Keys for use with other PGP compatible services. Only incoming messages in inline OpenPGP format are currently supported.`}
            </Alert>
            <Block>
                <PrimaryButton onClick={handleAddKey}>{c('Action').t`Add new key`}</PrimaryButton>
                <Button onClick={handleImportKey}>{c('Action').t`Import key`}</Button>
                <Button onClick={handleReactivateKeys}>{c('Action').t`Reactivate keys`}</Button>
            </Block>
        </>
    );
};

AddressKeysHeader.propTypes = {
    handleAddKey: PropTypes.func.isRequired,
    handleImportKey: PropTypes.func.isRequired,
    handleReactivateKeys: PropTypes.func.isRequired
};

export default AddressKeysHeader;
