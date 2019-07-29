import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'react-components';

const FeaturesList = ({ features = [] }) => {
    if (!features.length) {
        return null;
    }
    return (
        <ul className="unstyled flex flex-nowrap flex-spacebetween">
            {features.map((text, index) => {
                const key = `${index}`;
                return (
                    <li key={key} className="aligncenter pl0-5 pr0-5">
                        <div>
                            <Icon name="add" size={25} className="fill-pm-blue" />
                        </div>
                        {text}
                    </li>
                );
            })}
        </ul>
    );
};

FeaturesList.propTypes = {
    features: PropTypes.arrayOf(PropTypes.string)
};

export default FeaturesList;
