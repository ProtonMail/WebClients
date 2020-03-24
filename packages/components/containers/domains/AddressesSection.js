import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Alert, Button, PrimaryButton, Block } from 'react-components';

const AddressesSection = ({ onRedirect }) => {
    return (
        <>
            <Alert>{c('Info for domain modal')
                .t`Addresses must be connected to an user account. Click Add user to add a new user account with its own login and inbox that you can connect addresses to.`}</Alert>
            <Block>
                <PrimaryButton className="mr1" onClick={() => onRedirect('/settings/addresses')}>{c('Action')
                    .t`Add address`}</PrimaryButton>
                <Button onClick={() => onRedirect('/settings/members')}>{c('Action').t`Add user`}</Button>
            </Block>
        </>
    );
};

AddressesSection.propTypes = {
    onRedirect: PropTypes.func.isRequired
};

export default AddressesSection;
