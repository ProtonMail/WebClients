import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Row, Label, Text } from 'react-components';

const BitcoinDetails = ({ amount, address }) => {
    return (
        <figcaption>
            <Row>
                <Label>{c('Label').t`Amount BTC`}</Label>
                <Text>{amount}</Text>
            </Row>
            <Row>
                <Label>{c('Label').t`BTC address`}</Label>
                <Text>{address}</Text>
            </Row>
        </figcaption>
    );
};

BitcoinDetails.propTypes = {
    amount: PropTypes.number.isRequired,
    address: PropTypes.string.isRequired
};

export default BitcoinDetails;
