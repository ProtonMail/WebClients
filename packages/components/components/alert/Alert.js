import React from 'react';
import PropTypes from 'prop-types';
import { LearnMore } from 'react-components';

const CLASSES = {
    info: 'mb1 block-info-standard',
    warning: 'mb1 block-info-standard-warning',
    error: 'mb1 block-info-standard-error'
};

const Alert = ({ type, children, learnMore, className }) => {
    return (
        <div className={CLASSES[type].concat(` ${className || ''}`)}>
            <div>{children}</div>
            {learnMore ? (
                <div>
                    <LearnMore url={learnMore} />
                </div>
            ) : null}
        </div>
    );
};

Alert.propTypes = {
    type: PropTypes.oneOf(['info', 'error', 'warning']).isRequired,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    learnMore: PropTypes.string
};

Alert.defaultProps = {
    type: 'info'
};

export default Alert;
