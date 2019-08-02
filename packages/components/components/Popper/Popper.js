import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

const Popper = React.forwardRef(({ children, position, isOpen, role = 'tooltip', ...rest }, ref) => {
    return ReactDOM.createPortal(
        <div {...rest} ref={ref} style={position} role={role} hidden={!isOpen} aria-hidden={!isOpen}>
            {children}
        </div>,
        document.body
    );
});

Popper.propTypes = {
    children: PropTypes.node.isRequired,
    position: PropTypes.shape({ top: PropTypes.number, left: PropTypes.number }).isRequired,
    isOpen: PropTypes.bool,
    role: PropTypes.string
};

export default Popper;
