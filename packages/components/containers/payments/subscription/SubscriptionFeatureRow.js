import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Info } from '../../../components';

const SubscriptionFeatureRow = ({ icon, feature, info, url }) => {
    return (
        <span className="flex flex-nowrap">
            <Icon name={icon} className="mt0-25 mr1 flex-item-noshrink" />
            {feature}
            {info ? <Info className="ml0-5 mt0-25" title={info} url={url} /> : null}
        </span>
    );
};

SubscriptionFeatureRow.propTypes = {
    icon: PropTypes.string.isRequired,
    feature: PropTypes.node.isRequired,
    info: PropTypes.string,
    url: PropTypes.string,
};

export default SubscriptionFeatureRow;
