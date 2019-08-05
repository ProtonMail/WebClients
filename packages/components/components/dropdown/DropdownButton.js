import React from 'react';
import Button from '../button/Button';
import PropTypes from 'prop-types';
import DropdownCaret from './DropdownCaret';

const DropdownButton = ({ hasCaret = false, isOpen, children, ...rest }) => {
    return (
        <Button aria-expanded={isOpen} {...rest}>
            <span className="mauto">
                <span className={hasCaret ? 'mr0-5' : ''}>{children}</span>
                {hasCaret && <DropdownCaret isOpen={isOpen} />}
            </span>
        </Button>
    );
};

DropdownButton.propTypes = {
    hasCaret: PropTypes.bool,
    isOpen: PropTypes.bool,
    children: PropTypes.node
};

export default DropdownButton;
