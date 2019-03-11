import React from 'react';
import PropTypes from 'prop-types';
import { LearnMore } from 'react-components';

const CLASSES = {
    info: 'mb1 block-info',
    warning: 'mb1 block-info-error',
    error: 'mb1 block-info-warning'
};

const Alert = ({ type, children, learnMore }) => {
    return (
        <div className={CLASSES[type]}>
            <div>{children}</div>
            {learnMore ? <LearnMore url={learnMore} /> : null}
        </div>
    );
};

Alert.propTypes = {
    type: PropTypes.oneOf(['info', 'error', 'warning']).isRequired,
    children: PropTypes.node.isRequired,
    learnMore: PropTypes.string
};

Alert.defaultProps = {
    type: 'info'
};

export default Alert;
