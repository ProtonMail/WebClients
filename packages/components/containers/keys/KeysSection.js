import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { SubTitle, Alert, Block, PrimaryButton, Button } from 'react-components';

import KeysTable from './KeysTable';

const KeysSection = ({ mode }) => {
    const title = mode === 'user' ? c('Title').t`Contact Encryption Keys` : c('Title').t`Email Encryption Keys`;
    const handleAddKey = () => {};
    const handleImportKey = () => {};
    const handleReactivateKeys = () => {};

    return (
        <>
            <SubTitle>{title}</SubTitle>
            <Alert>
                {c('Info').t`Download your PGP Keys for use with other PGP compatible services. Only incoming messages in inline OpenPGP format are currently supported.`}
                <br />
                <LearnMore url="todo" />
            </Alert>
            <Block>
                <PrimaryButton onClick={handleAddKey}>{c('Action').t`Add new key`}</PrimaryButton>
                <Button onClick={handleImportKey}>{c('Action').t`Import key`}</Button>
                <Button onClick={handleReactivateKeys}>{c('Action').t`Reactivate keys`}</Button>
            </Block>
            <KeysTable />
        </>
    );
};

KeysSection.propTypes = {
    mode: PropTypes.string.isRequired
};

KeysSection.defaultProps = {
    mode: 'user'
};

export default KeysSection;