import React from 'react';
import PropTypes from 'prop-types';
import { LearnMore } from 'react-components';
import { classnames } from '../../helpers/component';

const CLASSES = {
    info: 'mb1 block-info-standard',
    warning: 'mb1 block-info-standard-warning',
    error: 'mb1 block-info-standard-error',
    success: 'mb1 block-info-standard-success'
};

const Alert = ({ type = 'info', children, learnMore, className }) => {
    return (
        <div className={classnames([CLASSES[type], className])}>
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
    type: PropTypes.oneOf(['info', 'error', 'warning', 'success']),
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    learnMore: PropTypes.string
};

export default Alert;
