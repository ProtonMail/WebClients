import React from 'react';
import PropTypes from 'prop-types';
import Portal from '../portal/Portal';

const Popper = React.forwardRef(({ children, position, isOpen, role = 'tooltip', ...rest }, ref) => {
    return (
        <Portal>
            <div {...rest} ref={ref} style={position} role={role} hidden={!isOpen} aria-hidden={!isOpen}>
                {children}
            </div>
        </Portal>
    );
});

Popper.propTypes = {
    children: PropTypes.node.isRequired,
    position: PropTypes.shape({ top: PropTypes.number, left: PropTypes.number }).isRequired,
    isOpen: PropTypes.bool,
    role: PropTypes.string
};

export default Popper;
