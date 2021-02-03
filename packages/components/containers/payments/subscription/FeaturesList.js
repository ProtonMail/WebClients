import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '../../../components';

const FeaturesList = ({ features = [] }) => {
    if (!features.length) {
        return null;
    }
    return (
        <ul className="unstyled mt0-5 mb0-5 flex flex-nowrap flex-justify-space-between">
            {features.map((text, index) => {
                const key = `${index}`;
                return (
                    <li key={key} className="text-center flex-item-fluid pl1 pr1">
                        <Icon name="check-circle" size={24} className="color-primary" />
                        <span className="block">{text}</span>
                    </li>
                );
            })}
        </ul>
    );
};

FeaturesList.propTypes = {
    features: PropTypes.arrayOf(PropTypes.string),
};

export default FeaturesList;
