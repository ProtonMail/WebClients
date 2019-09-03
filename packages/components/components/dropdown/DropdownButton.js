import React from 'react';
import Button from '../button/Button';
import PropTypes from 'prop-types';
import DropdownCaret from './DropdownCaret';
import { classnames } from 'react-components';

const DropdownButton = ({ className = '', hasCaret = false, isOpen, children, ...rest }) => {
    return (
        <Button className={classnames(['flex-item-noshrink', className])} aria-expanded={isOpen} {...rest}>
            <span className="mauto">
                <span className={hasCaret && children ? 'mr0-5' : ''}>{children}</span>
                {hasCaret && <DropdownCaret isOpen={isOpen} />}
            </span>
        </Button>
    );
};

DropdownButton.propTypes = {
    hasCaret: PropTypes.bool,
    isOpen: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string
};

export default DropdownButton;
