import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Copy } from '../../components';

const BitcoinDetails = ({ amount, address }) => {
    return (
        <figcaption>
            {amount ? (
                <>
                    <div className="flex flex-nowrap flex-items-center p1 border-bottom">
                        <span className="flex-item-noshrink">{c('Label').t`BTC amount:`}</span>
                        <strong className="ml0-25 mr1 ellipsis" title={amount}>
                            {amount}
                        </strong>
                        <Copy className="pm-button--for-icon flex-item-noshrink" value={`${amount}`} />
                    </div>
                </>
            ) : null}
            <div className="flex mw100 flex-nowrap flex-items-center p1 border-bottom">
                <span className="flex-item-noshrink">{c('Label').t`BTC address:`}</span>
                <strong className="ml0-25 mr1 ellipsis" title={address}>
                    {address}
                </strong>
                <Copy className="pm-button--for-icon flex-item-noshrink" value={address} />
            </div>
        </figcaption>
    );
};

BitcoinDetails.propTypes = {
    amount: PropTypes.number,
    address: PropTypes.string.isRequired,
};

export default BitcoinDetails;
