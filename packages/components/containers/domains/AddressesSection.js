import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { APPS } from 'proton-shared/lib/constants';
import { Alert, Block, AppLink } from '../../components';

const AddressesSection = ({ onClose }) => {
    return (
        <>
            <Alert>{c('Info for domain modal')
                .t`If you have a subscription plan with multi-user support, you can add users to your domain by clicking on the button below.`}</Alert>
            <Block>
                <AppLink
                    className="pm-button pm-button--primary"
                    onClick={() => onClose?.()}
                    to="/organization#members"
                    toApp={APPS.PROTONACCOUNT}
                >{c('Action').t`Add user`}</AppLink>
            </Block>
            <Alert>{c('Info for domain modal')
                .t`Already have all the users you need? Click on the button below to add addresses to your users. More addresses can be purchased by customizing your plan from the subscription section.`}</Alert>
            <Block>
                <AppLink
                    className="pm-button pm-button--primary"
                    onClick={() => onClose?.()}
                    to="/organization#addresses"
                    toApp={APPS.PROTONACCOUNT}
                >{c('Action').t`Add address`}</AppLink>
            </Block>
        </>
    );
};

AddressesSection.propTypes = {
    onClose: PropTypes.func,
};

export default AddressesSection;
