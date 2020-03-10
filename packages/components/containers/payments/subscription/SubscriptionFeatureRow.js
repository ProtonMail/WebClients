import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Info } from 'react-components';

const SubscriptionFeatureRow = ({ icon, feature, info }) => {
    return (
        <span className="flex flex-nowrap">
            <Icon name={icon} className="mt0-25 mr1 flex-item-noshrink" />
            {feature}
            {info ? <Info title={info} /> : null}
        </span>
    );
};

SubscriptionFeatureRow.propTypes = {
    icon: PropTypes.string.isRequired,
    feature: PropTypes.node.isRequired,
    info: PropTypes.string
};

export default SubscriptionFeatureRow;
