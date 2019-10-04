import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from '../../helpers/component';

const InlineLinkButton = ({ children, className = '', ...rest }) => {
    return (
        <button type="button" role="button" className={classnames(['link alignbaseline', className])} {...rest}>
            {children}
        </button>
    );
};

InlineLinkButton.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

export default InlineLinkButton;
