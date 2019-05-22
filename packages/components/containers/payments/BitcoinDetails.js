import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Row, Label, Field, Copy } from 'react-components';

const BitcoinDetails = ({ amount, address }) => {
    return (
        <figcaption>
            <Row>
                <Label>{c('Label').t`Amount BTC`}</Label>
                <Field>
                    <span className="mt0-5">{amount}</span>
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`BTC address`}</Label>
                <Field className="flex">
                    <span className="mt0-5 mr1 ellipsis" title={address}>
                        {address}
                    </span>
                    <Copy value={address} />
                </Field>
            </Row>
        </figcaption>
    );
};

BitcoinDetails.propTypes = {
    amount: PropTypes.number.isRequired,
    address: PropTypes.string.isRequired
};

export default BitcoinDetails;
