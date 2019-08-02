import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from '../../helpers/component';
import Icon from '../icon/Icon';

const DropdownCaret = ({ isOpen }) => {
    return <Icon className={classnames(['fill-currentColor', isOpen && 'rotateX-180'])} size={12} name="caret" />;
};

DropdownCaret.propTypes = {
    isOpen: PropTypes.bool
};

export default DropdownCaret;
