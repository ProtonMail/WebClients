import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Alert, PrimaryButton, Block } from 'react-components';

const AddressesSection = ({ onRedirect }) => {
    return (
        <>
            <Alert>{c('Info for domain modal')
                .t`If you have a subscription plan with multi-user support, you can add users to your domain by clicking on the button below.`}</Alert>
            <Block>
                <PrimaryButton onClick={() => onRedirect('/settings/members')}>{c('Action').t`Add user`}</PrimaryButton>
            </Block>
            <Alert>{c('Info for domain modal')
                .t`Already have all the users you need? Click on the button below to add addresses to your users. More addresses can be purchased by customizing your plan from the subscription section.`}</Alert>
            <Block>
                <PrimaryButton onClick={() => onRedirect('/settings/addresses')}>{c('Action')
                    .t`Add address`}</PrimaryButton>
            </Block>
        </>
    );
};

AddressesSection.propTypes = {
    onRedirect: PropTypes.func.isRequired,
};

export default AddressesSection;
