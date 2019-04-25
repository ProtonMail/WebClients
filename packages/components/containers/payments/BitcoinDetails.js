import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Row, Label, Field } from 'react-components';

const BitcoinDetails = ({ amount, address }) => {
    return (
        <figcaption>
            <Row>
                <Label>{c('Label').t`Amount BTC`}</Label>
                <Field>{amount}</Field>
            </Row>
            <Row>
                <Label>{c('Label').t`BTC address`}</Label>
                <Field>{address}</Field>
            </Row>
        </figcaption>
    );
};

BitcoinDetails.propTypes = {
    amount: PropTypes.number.isRequired,
    address: PropTypes.string.isRequired
};

export default BitcoinDetails;
